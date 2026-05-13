'use strict';

const DEFAULT_GPT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_TIMEOUT_MS = 600000;
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_COMPRESSION = 85;
const DEFAULT_IMAGE_QUALITY = 'medium';
const IMAGE_PROMPT_PREFIX = '请基于下面播客文字稿画一幅 AI 资讯日报图片。';

function buildImagePromptSystemMessage() {
    return IMAGE_PROMPT_PREFIX;
}

function buildImagePrompt(scriptMarkdown) {
    return `${IMAGE_PROMPT_PREFIX}\n\n${String(scriptMarkdown || '').trim()}`;
}

function createInfographicGenerator({ config = {}, fetchImpl = fetch } = {}) {
    const gptImageApiKey = config.gptImageApiKey || process.env.GPT_IMAGE_API_KEY || '';
    const gptImageBaseUrl = (config.gptImageBaseUrl || process.env.GPT_IMAGE_API_BASE_URL || '').replace(/\/+$/, '');
    const gptImageModel = config.gptImageModel || DEFAULT_GPT_IMAGE_MODEL;
    const imageSize = config.imageSize || DEFAULT_IMAGE_SIZE;
    const outputFormat = config.outputFormat || process.env.GPT_IMAGE_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT;
    const outputCompression = Number(config.outputCompression || process.env.GPT_IMAGE_OUTPUT_COMPRESSION || DEFAULT_OUTPUT_COMPRESSION);
    const imageQuality = config.imageQuality || process.env.GPT_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.INFOGRAPHIC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    return {
        async generateInfographic({ scriptMarkdown }) {
            if (!gptImageApiKey) throw new Error('缺少 GPT Image API Key，无法生成信息图');
            if (!gptImageBaseUrl) throw new Error('缺少 GPT Image API Base URL，无法生成信息图');

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const resp = await fetchImpl(`${gptImageBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${gptImageApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: gptImageModel,
                        prompt: buildImagePrompt(scriptMarkdown),
                        n: 1,
                        size: imageSize,
                        quality: imageQuality,
                        output_format: outputFormat,
                        output_compression: outputCompression
                    }),
                    signal: controller.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `图片生成失败: HTTP ${resp.status}`);
                }
                const b64 = data?.data?.[0]?.b64_json;
                if (!b64) throw new Error('gpt-image-2 未返回 b64_json');
                return Buffer.from(b64, 'base64');
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

module.exports = { createInfographicGenerator, buildImagePromptSystemMessage, buildImagePrompt };
