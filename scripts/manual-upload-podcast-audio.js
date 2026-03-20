const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');

function parseEnvFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};

    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        let value = trimmed.slice(separatorIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    }

    return env;
}

function requireArg(name, value) {
    if (!value) {
        throw new Error(`缺少参数 ${name}`);
    }
    return value;
}

function getArg(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1) {
        return null;
    }
    return process.argv[index + 1] || null;
}

function hasFlag(flag) {
    return process.argv.includes(flag);
}

function inferAudioMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.wav') return 'audio/wav';
    if (ext === '.m4a') return 'audio/mp4';
    if (ext === '.flac') return 'audio/flac';
    if (ext === '.ogg') return 'audio/ogg';
    return 'audio/mpeg';
}

function buildPublicOssUrl(objectKey, config) {
    if (config.publicBaseUrl) {
        return `${config.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
    }

    return `https://${config.bucket}.${config.region}.aliyuncs.com/${objectKey}`;
}

function estimateDurationSeconds(filePath) {
    const stats = fs.statSync(filePath);
    return Math.max(30, Math.round(stats.size / 16000));
}

async function main() {
    const date = requireArg('--date', getArg('--date'));
    const filePath = requireArg('--file', getArg('--file'));
    const envPath = getArg('--env') || path.join(process.cwd(), '.env');
    const metadataDir = getArg('--metadata-dir') || path.join(process.cwd(), 'data', 'podcasts', 'news');
    const updateMetadata = hasFlag('--update-metadata');

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('date 必须是 YYYY-MM-DD 格式');
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`音频文件不存在: ${filePath}`);
    }
    if (!fs.existsSync(envPath)) {
        throw new Error(`环境变量文件不存在: ${envPath}`);
    }

    const env = parseEnvFile(envPath);
    const ossConfig = {
        region: env.PODCAST_OSS_REGION,
        bucket: env.PODCAST_OSS_BUCKET,
        accessKeyId: env.PODCAST_OSS_ACCESS_KEY_ID,
        accessKeySecret: env.PODCAST_OSS_ACCESS_KEY_SECRET,
        endpoint: env.PODCAST_OSS_ENDPOINT || undefined,
        publicBaseUrl: env.PODCAST_OSS_PUBLIC_BASE_URL || ''
    };

    if (!ossConfig.region || !ossConfig.bucket || !ossConfig.accessKeyId || !ossConfig.accessKeySecret) {
        throw new Error('OSS 配置不完整，无法上传');
    }

    const buffer = fs.readFileSync(filePath);
    const contentHash = crypto.createHash('sha1').update(buffer).digest('hex');
    const generationSignature = crypto.createHash('sha1').update(`manual:${date}:${path.basename(filePath)}:${buffer.length}`).digest('hex');
    const [year, month, day] = date.split('-');
    const ext = path.extname(filePath).toLowerCase() || '.mp3';
    const objectKey = `podcast/news/${year}/${month}/${day}/manual-${contentHash.slice(0, 10)}-${generationSignature.slice(0, 8)}${ext}`;

    const client = new OSS({
        region: ossConfig.region,
        bucket: ossConfig.bucket,
        accessKeyId: ossConfig.accessKeyId,
        accessKeySecret: ossConfig.accessKeySecret,
        endpoint: ossConfig.endpoint
    });

    await client.put(objectKey, buffer, {
        headers: {
            'Content-Type': inferAudioMimeType(filePath),
            'Cache-Control': 'public, max-age=31536000'
        }
    });

    const audioUrl = buildPublicOssUrl(objectKey, ossConfig);
    const result = {
        date,
        source_file: filePath,
        object_key: objectKey,
        audio_url: audioUrl,
        content_hash: contentHash
    };

    if (updateMetadata) {
        const metadataFile = path.join(metadataDir, `${date}.json`);
        if (!fs.existsSync(metadataFile)) {
            throw new Error(`播客 metadata 不存在: ${metadataFile}`);
        }

        const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        metadata.status = 'ready';
        metadata.audio_url = audioUrl;
        metadata.audio_storage = 'oss';
        metadata.audio_file = null;
        metadata.audio_mime_type = inferAudioMimeType(filePath);
        metadata.duration_seconds = estimateDurationSeconds(filePath);
        metadata.updated_at = new Date().toISOString();
        metadata.last_error_message = null;
        metadata.error = null;
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
        result.metadata_file = metadataFile;
    }

    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
