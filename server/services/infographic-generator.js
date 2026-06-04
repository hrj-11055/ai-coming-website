'use strict';

const sharp = require('sharp');

const DEFAULT_TOKENGO_BASE_URL = 'https://ai.ssgoo.net';
const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_IMAGE_QUALITY = 'high';
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_COMPRESSION = 80;
const DEFAULT_RESPONSE_FORMAT = 'url';
const DEFAULT_TIMEOUT_MS = 600000;
const MAX_WECHAT_IMAGE_BYTES = 1024 * 1024;
const IMAGE_PROMPT_PREFIX = '请生成一幅高质量中文 AI 日报一览图，图片为主要展示内容，方形 1:1 构图。';

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
    const tokenGoApiKey = config.tokenGoApiKey ?? process.env.TOKENGO_API_KEY ?? '';
    const tokenGoBaseUrl = String(
        config.tokenGoBaseUrl ?? process.env.TOKENGO_API_BASE_URL ?? DEFAULT_TOKENGO_BASE_URL
    ).replace(/\/+$/, '');
    const model = config.model || process.env.TOKENGO_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    const size = config.size || process.env.TOKENGO_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
    const quality = config.quality || process.env.TOKENGO_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
    const outputFormat = config.outputFormat || process.env.TOKENGO_IMAGE_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT;
    const outputCompression = clampCompression(
        config.outputCompression ?? process.env.TOKENGO_IMAGE_OUTPUT_COMPRESSION,
        DEFAULT_OUTPUT_COMPRESSION
    );
    const responseFormat = config.responseFormat || process.env.TOKENGO_IMAGE_RESPONSE_FORMAT || DEFAULT_RESPONSE_FORMAT;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.INFOGRAPHIC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    return {
        async generateInfographic({ prompt }) {
            if (!tokenGoApiKey) {
                throw new Error('缺少 TOKENGO_API_KEY，无法生成日报一览图');
            }
            if (!tokenGoBaseUrl) {
                throw new Error('缺少 TOKENGO_API_BASE_URL，无法生成日报一览图');
            }

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const requestBody = {
                    model,
                    prompt: buildImagePrompt(prompt),
                    size,
                    quality,
                    output_format: outputFormat,
                    response_format: responseFormat,
                    n: 1
                };
                if (outputFormat === 'jpeg') {
                    requestBody.output_compression = outputCompression;
                }

                const response = await fetchImpl(`${tokenGoBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${tokenGoApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.error?.message || `生成日报一览图失败: HTTP ${response.status}`);
                }

                const firstImage = data?.data?.[0];
                let imageBuffer;
                if (typeof firstImage?.b64_json === 'string' && firstImage.b64_json) {
                    imageBuffer = Buffer.from(firstImage.b64_json, 'base64');
                } else if (typeof firstImage?.url === 'string' && firstImage.url) {
                    const imageResponse = await fetchImpl(firstImage.url, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    if (!imageResponse.ok) {
                        throw new Error(`下载生成图像失败: HTTP ${imageResponse.status}`);
                    }
                    imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                } else {
                    throw new Error('TokenGo Images API 未返回有效的图片 URL 或 b64_json');
                }

                return ensureWechatImageSize(imageBuffer, compressImage);
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
