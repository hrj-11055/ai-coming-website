const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_MINIMAX_TTS_FILE_METADATA_API_URL = 'https://api.minimaxi.com/v1/files/retrieve';

function parseMinimaxMessage(data, fallbackMessage) {
    return data?.error?.message
        || data?.base_resp?.status_msg
        || data?.message
        || data?.msg
        || fallbackMessage;
}

function ensureMinimaxSuccess(data, fallbackMessage) {
    const statusCode = Number(data?.base_resp?.status_code);
    if (Number.isFinite(statusCode) && statusCode !== 0) {
        throw new Error(parseMinimaxMessage(data, fallbackMessage));
    }
}

function buildAsyncTtsFileMetadataUrl(fileMetadataApiUrl, fileId) {
    const separator = String(fileMetadataApiUrl || '').includes('?') ? '&' : '?';
    return `${fileMetadataApiUrl}${separator}file_id=${encodeURIComponent(fileId)}`;
}

function bufferLooksLikeAudio(buffer) {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    const header = buffer.subarray(0, 4);
    return buffer.subarray(0, 3).equals(Buffer.from('ID3'))
        || header.equals(Buffer.from('RIFF'))
        || header.equals(Buffer.from('OggS'))
        || header.equals(Buffer.from('fLaC'))
        || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
}

function extractAudioBufferFromArchive(archiveBuffer) {
    if (!archiveBuffer?.length) {
        throw new Error('MiniMax 音频归档为空');
    }

    if (bufferLooksLikeAudio(archiveBuffer)) {
        return {
            audioBuffer: archiveBuffer,
            fileName: null
        };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'minimax-audio-'));
    const archivePath = path.join(tempDir, 'audio-archive.tar');

    try {
        fs.writeFileSync(archivePath, archiveBuffer);
        execFileSync('tar', ['-xf', archivePath, '-C', tempDir]);

        const entries = fs.readdirSync(tempDir, { recursive: true });
        const audioEntry = entries.find((entry) => /\.(mp3|wav|m4a|flac|ogg)$/i.test(String(entry)));
        if (!audioEntry) {
            throw new Error('MiniMax 音频归档中未找到可用音频文件');
        }

        const audioPath = path.join(tempDir, String(audioEntry));
        return {
            audioBuffer: fs.readFileSync(audioPath),
            fileName: path.basename(audioPath)
        };
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

function createMinimaxAudioClient({
    apiKey = process.env.MINIMAX_API_KEY || '',
    fileMetadataApiUrl = process.env.MINIMAX_TTS_FILE_METADATA_API_URL || DEFAULT_MINIMAX_TTS_FILE_METADATA_API_URL,
    fetchImpl = fetch
} = {}) {
    return {
        async downloadAudioBufferFromFileId(fileId) {
            const normalizedFileId = String(fileId || '').trim();
            if (!normalizedFileId) {
                throw new Error('MiniMax 音频下载缺少 file_id');
            }

            if (!apiKey || !fileMetadataApiUrl) {
                throw new Error('MiniMax 音频下载能力尚未配置完成');
            }

            const metadataResponse = await fetchImpl(buildAsyncTtsFileMetadataUrl(fileMetadataApiUrl, normalizedFileId), {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const metadataData = await metadataResponse.json().catch(() => ({}));
            if (!metadataResponse.ok) {
                throw new Error(parseMinimaxMessage(metadataData, `获取 MiniMax 文件下载地址失败: HTTP ${metadataResponse.status}`));
            }
            ensureMinimaxSuccess(metadataData, '获取 MiniMax 文件下载地址失败');

            const file = metadataData?.file || metadataData?.data?.file || metadataData?.data || {};
            const downloadUrl = file?.download_url || metadataData?.download_url || metadataData?.data?.download_url || null;
            if (!downloadUrl) {
                throw new Error('MiniMax 文件下载信息未返回 download_url');
            }

            const downloadResponse = await fetchImpl(downloadUrl);
            if (!downloadResponse.ok) {
                const contentType = downloadResponse.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await downloadResponse.json().catch(() => ({}));
                    throw new Error(parseMinimaxMessage(data, `下载 MiniMax 音频归档失败: HTTP ${downloadResponse.status}`));
                }

                throw new Error(`下载 MiniMax 音频归档失败: HTTP ${downloadResponse.status}`);
            }

            const arrayBuffer = await downloadResponse.arrayBuffer();
            const extracted = extractAudioBufferFromArchive(Buffer.from(arrayBuffer));

            return {
                audioBuffer: extracted.audioBuffer,
                fileName: file?.filename || extracted.fileName || null,
                downloadUrl
            };
        }
    };
}

module.exports = {
    createMinimaxAudioClient
};
