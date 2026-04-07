const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DEFAULT_MINIMAX_TTS_FILE_METADATA_API_URL = 'https://api.minimaxi.com/v1/files/retrieve';
const DEFAULT_MINIMAX_TTS_API_URL = 'https://api.minimaxi.com/v1/t2a_async_v2';
const DEFAULT_MINIMAX_TTS_QUERY_API_URL = 'https://api.minimaxi.com/v1/query/t2a_async_query_v2';
const DEFAULT_MINIMAX_TTS_MODEL = 'speech-2.8-turbo';
const DEFAULT_MINIMAX_TTS_VOICE_ID = 'male-qn-jingying';
const DEFAULT_AUDIO_FORMAT = 'mp3';
const DEFAULT_LANGUAGE_BOOST = 'Chinese';
const DEFAULT_TTS_POLL_INTERVAL_MS = 3000;
const DEFAULT_TTS_TIMEOUT_MS = 600000;

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

function buildAsyncTtsQueryUrl(queryApiUrl, taskId) {
    const separator = String(queryApiUrl || '').includes('?') ? '&' : '?';
    return `${queryApiUrl}${separator}task_id=${encodeURIComponent(taskId)}`;
}

function isAsyncTtsCompleted(status) {
    return ['success', 'succeeded', 'completed', 'done', 'finish', 'finished']
        .includes(String(status || '').trim().toLowerCase());
}

function isAsyncTtsFailed(status) {
    return ['failed', 'error', 'expired', 'canceled', 'cancelled']
        .includes(String(status || '').trim().toLowerCase());
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

function createMinimaxTtsClient({
    apiKey = process.env.MINIMAX_API_KEY || '',
    apiUrl = process.env.MINIMAX_TTS_API_URL || DEFAULT_MINIMAX_TTS_API_URL,
    queryApiUrl = process.env.MINIMAX_TTS_QUERY_API_URL || DEFAULT_MINIMAX_TTS_QUERY_API_URL,
    fileMetadataApiUrl = process.env.MINIMAX_TTS_FILE_METADATA_API_URL || DEFAULT_MINIMAX_TTS_FILE_METADATA_API_URL,
    model = process.env.MINIMAX_TTS_MODEL || DEFAULT_MINIMAX_TTS_MODEL,
    voiceId = process.env.MINIMAX_TTS_VOICE_ID || DEFAULT_MINIMAX_TTS_VOICE_ID,
    audioFormat = process.env.MINIMAX_TTS_FORMAT || DEFAULT_AUDIO_FORMAT,
    speed = Number(process.env.MINIMAX_TTS_SPEED || 1.0),
    volume = Number(process.env.MINIMAX_TTS_VOLUME || 1.0),
    pitch = Number(process.env.MINIMAX_TTS_PITCH || 0),
    languageBoost = process.env.MINIMAX_TTS_LANGUAGE_BOOST || DEFAULT_LANGUAGE_BOOST,
    pollIntervalMs = Number(process.env.MINIMAX_TTS_POLL_INTERVAL_MS || DEFAULT_TTS_POLL_INTERVAL_MS),
    timeoutMs = Number(process.env.MINIMAX_TTS_TIMEOUT_MS || DEFAULT_TTS_TIMEOUT_MS),
    fetchImpl = fetch
} = {}) {
    const audioClient = createMinimaxAudioClient({
        apiKey,
        fileMetadataApiUrl,
        fetchImpl
    });

    return {
        async synthesizeTextToAudioBuffer(text) {
            const normalizedText = String(text || '').trim();
            if (!normalizedText) {
                throw new Error('MiniMax 短音频合成缺少文本');
            }
            if (!apiKey || !apiUrl || !queryApiUrl) {
                throw new Error('MiniMax 短音频合成能力尚未配置完成');
            }

            const createResponse = await fetchImpl(apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    text: normalizedText,
                    voice_setting: {
                        voice_id: voiceId,
                        speed,
                        vol: volume,
                        pitch
                    },
                    audio_setting: {
                        audio_sample_rate: 32000,
                        bitrate: 128000,
                        format: String(audioFormat || DEFAULT_AUDIO_FORMAT).replace(/^\./, ''),
                        channel: 1
                    },
                    language_boost: languageBoost
                })
            });

            const createData = await createResponse.json().catch(() => ({}));
            if (!createResponse.ok) {
                throw new Error(parseMinimaxMessage(createData, `MiniMax 短音频合成任务创建失败: HTTP ${createResponse.status}`));
            }
            ensureMinimaxSuccess(createData, 'MiniMax 短音频合成任务创建失败');

            const taskId = createData?.task_id || createData?.data?.task_id || null;
            const initialFileId = createData?.file_id || createData?.data?.file_id || null;
            if (!taskId) {
                throw new Error('MiniMax 短音频合成未返回 task_id');
            }

            const deadline = Date.now() + Math.max(1000, timeoutMs || DEFAULT_TTS_TIMEOUT_MS);
            let fileId = initialFileId;
            while (Date.now() <= deadline) {
                const queryResponse = await fetchImpl(buildAsyncTtsQueryUrl(queryApiUrl, taskId), {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                const queryData = await queryResponse.json().catch(() => ({}));
                if (!queryResponse.ok) {
                    throw new Error(parseMinimaxMessage(queryData, `MiniMax 短音频合成查询失败: HTTP ${queryResponse.status}`));
                }
                ensureMinimaxSuccess(queryData, 'MiniMax 短音频合成查询失败');

                const payload = queryData?.data || queryData;
                const status = payload?.status || payload?.task_status || payload?.state || null;
                fileId = payload?.file_id || payload?.result_file_id || payload?.audio_file_id || fileId;

                if (isAsyncTtsCompleted(status)) {
                    if (!fileId) {
                        throw new Error('MiniMax 短音频合成已完成但未返回 file_id');
                    }
                    const downloaded = await audioClient.downloadAudioBufferFromFileId(fileId);
                    return {
                        ...downloaded,
                        taskId,
                        fileId
                    };
                }

                if (isAsyncTtsFailed(status)) {
                    throw new Error(parseMinimaxMessage(queryData, `MiniMax 短音频合成失败: ${status || 'unknown'}`));
                }

                await sleep(Math.max(1, pollIntervalMs || DEFAULT_TTS_POLL_INTERVAL_MS));
            }

            throw new Error(`MiniMax 短音频合成轮询超时（>${Math.max(1000, timeoutMs || DEFAULT_TTS_TIMEOUT_MS)}ms）`);
        }
    };
}

module.exports = {
    createMinimaxAudioClient,
    createMinimaxTtsClient
};
