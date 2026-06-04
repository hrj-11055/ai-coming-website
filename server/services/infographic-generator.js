'use strict';

const sharp = require('sharp');

const OFFICIAL_OPENAI_BASE_URL = 'https://api.openai.com';
const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1536';
const DEFAULT_IMAGE_QUALITY = 'high';
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_COMPRESSION = 80;
const DEFAULT_TIMEOUT_MS = 600000;
const MAX_WECHAT_IMAGE_BYTES = 1024 * 1024;
const IMAGE_PROMPT_PREFIX = '请生成一幅高质量中文 AI 日报一览图，图片为主要展示内容。';

function buildImagePromptSystemMessage() {
    return IMAGE_PROMPT_PREFIX;
}

function buildImagePrompt(prompt) {
    return `${IMAGE_PROMPT_PREFIX}\n\n${String(prompt || '').trim()}`;
}

async function compressImageForWechat(imageBuffer) {
    const attempts = [
        { width: 1280, quality: 72 },
        { width: 1024, quality: 60 }
    ];

    for (const attempt of attempts) {
        const compressed = await sharp(imageBuffer)
            .rotate()
            .resize({
                width: attempt.width,
                height: 1536,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: attempt.quality, mozjpeg: true })
            .toBuffer();
        if (compressed.length <= MAX_WECHAT_IMAGE_BYTES) {
            return compressed;
        }
    }

    throw new Error('生成图片压缩后仍超过微信 1MB 限制');
}

async function ensureWechatImageSize(imageBuffer, compressImage) {
    if (imageBuffer.length <= MAX_WECHAT_IMAGE_BYTES) {
        return imageBuffer;
    }

    const compressed = await compressImage(imageBuffer);
    if (!Buffer.isBuffer(compressed) || compressed.length > MAX_WECHAT_IMAGE_BYTES) {
        throw new Error('生成图片压缩后仍超过微信 1MB 限制');
    }
    return compressed;
}

function clampCompression(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
}

function createInfographicGenerator({ config = {}, fetchImpl = fetch, compressImage = compressImageForWechat } = {}) {
    const openaiApiKey = config.openaiApiKey ?? process.env.OPENAI_API_KEY ?? '';
    const openaiBaseUrl = String(config.openaiBaseUrl || OFFICIAL_OPENAI_BASE_URL).replace(/\/+$/, '');
    const model = config.model || process.env.OPENAI_IMAGE_MODEL || DEFAULT_OPENAI_IMAGE_MODEL;
    const size = config.size || process.env.OPENAI_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
    const quality = config.quality || process.env.OPENAI_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
    const outputFormat = config.outputFormat || process.env.OPENAI_IMAGE_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT;
    const outputCompression = clampCompression(
        config.outputCompression ?? process.env.OPENAI_IMAGE_OUTPUT_COMPRESSION,
        DEFAULT_OUTPUT_COMPRESSION
    );
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.INFOGRAPHIC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    return {
        async generateInfographic({ prompt }) {
            if (!openaiApiKey) {
                throw new Error('缺少 OPENAI_API_KEY，无法生成日报一览图');
            }
            if (openaiBaseUrl !== OFFICIAL_OPENAI_BASE_URL) {
                throw new Error('日报一览图只允许使用官方 OpenAI API 地址');
            }

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetchImpl(`${OFFICIAL_OPENAI_BASE_URL}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        prompt: buildImagePrompt(prompt),
                        size,
                        quality,
                        output_format: outputFormat,
                        output_compression: outputCompression,
                        n: 1
                    }),
                    signal: controller.signal
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.error?.message || `生成日报一览图失败: HTTP ${response.status}`);
                }

                const b64 = data?.data?.[0]?.b64_json;
                if (typeof b64 !== 'string' || !b64) {
                    throw new Error('官方 OpenAI Images API 未返回 b64_json');
                }

                return ensureWechatImageSize(Buffer.from(b64, 'base64'), compressImage);
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

module.exports = {
    buildImagePrompt,
    buildImagePromptSystemMessage,
    createInfographicGenerator
};
