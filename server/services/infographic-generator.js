'use strict';

const sharp = require('sharp');

const DEFAULT_GPT_IMAGE_BASE_URL = 'https://ai.ssgoo.net';
const DEFAULT_GPT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_IMAGE_QUALITY = 'low';
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_COMPRESSION = 70;
const DEFAULT_RESPONSE_FORMAT = 'url';
const DEFAULT_TIMEOUT_MS = 600000;
const MAX_WECHAT_IMAGE_BYTES = 1024 * 1024;
const IMAGE_PROMPT_PREFIX = '请基于下面播客文字稿画一幅《小元说 AI日报》图片。';

function buildImagePromptSystemMessage() {
    return IMAGE_PROMPT_PREFIX;
}

function buildImagePrompt(scriptMarkdown) {
    return `${IMAGE_PROMPT_PREFIX}\n\n${String(scriptMarkdown || '').trim()}`;
}

async function compressImageForWechat(imageBuffer) {
    const attempts = [
        { width: 1280, quality: 65 },
        { width: 1024, quality: 50 }
    ];

    for (const attempt of attempts) {
        const compressed = await sharp(imageBuffer)
            .rotate()
            .resize({
                width: attempt.width,
                height: attempt.width,
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

function createInfographicGenerator({ config = {}, fetchImpl = fetch, compressImage = compressImageForWechat } = {}) {
    let gptImageApiKey = config.gptImageApiKey;
    if (gptImageApiKey === undefined) {
        gptImageApiKey = process.env.GPT_IMAGE_API_KEY || '';
    }

    let gptImageBaseUrl = config.gptImageBaseUrl;
    if (gptImageBaseUrl === undefined) {
        gptImageBaseUrl = process.env.GPT_IMAGE_API_BASE_URL || DEFAULT_GPT_IMAGE_BASE_URL;
    }
    gptImageBaseUrl = String(gptImageBaseUrl || '').replace(/\/+$/, '');

    const gptImageModel = config.gptImageModel || process.env.GPT_IMAGE_MODEL || DEFAULT_GPT_IMAGE_MODEL;
    const imageSize = config.imageSize || process.env.GPT_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
    const imageQuality = config.imageQuality || process.env.GPT_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
    const outputFormat = config.outputFormat || process.env.GPT_IMAGE_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT;
    const outputCompressionValue = config.outputCompression ?? process.env.GPT_IMAGE_OUTPUT_COMPRESSION ?? DEFAULT_OUTPUT_COMPRESSION;
    const parsedOutputCompression = Number(outputCompressionValue);
    const outputCompression = Number.isFinite(parsedOutputCompression)
        ? Math.max(0, Math.min(100, parsedOutputCompression))
        : DEFAULT_OUTPUT_COMPRESSION;
    const responseFormat = config.responseFormat || process.env.GPT_IMAGE_RESPONSE_FORMAT || DEFAULT_RESPONSE_FORMAT;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.INFOGRAPHIC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    return {
        async generateInfographic({ scriptMarkdown }) {
            if (!gptImageApiKey) throw new Error('缺少 GPT Image API Key，无法生成信息图');
            if (!gptImageBaseUrl) throw new Error('缺少 GPT Image API Base URL，无法生成信息图');

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const requestBody = {
                    model: gptImageModel,
                    prompt: buildImagePrompt(scriptMarkdown),
                    size: imageSize,
                    quality: imageQuality,
                    output_format: outputFormat,
                    response_format: responseFormat,
                    n: 1
                };
                if (outputFormat === 'jpeg') {
                    requestBody.output_compression = outputCompression;
                }

                const resp = await fetchImpl(`${gptImageBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${gptImageApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `提交图片生成任务失败: HTTP ${resp.status}`);
                }

                const firstImage = data?.data?.[0];
                let imageBuffer;
                if (typeof firstImage?.b64_json === 'string' && firstImage.b64_json) {
                    imageBuffer = Buffer.from(firstImage.b64_json, 'base64');
                } else if (typeof firstImage?.url !== 'string' || !firstImage.url) {
                    throw new Error('Images API 未返回有效的图片 URL 或 b64_json');
                } else {
                    const imageResp = await fetchImpl(firstImage.url, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    if (!imageResp.ok) {
                        throw new Error(`下载生成图像失败: HTTP ${imageResp.status}`);
                    }
                    const arrayBuffer = await imageResp.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                }
                return ensureWechatImageSize(imageBuffer, compressImage);
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

module.exports = { createInfographicGenerator, buildImagePromptSystemMessage, buildImagePrompt };
