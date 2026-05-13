'use strict';

const DEFAULT_DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEFAULT_GPT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_TIMEOUT_MS = 600000;
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_COMPRESSION = 85;
const DEFAULT_IMAGE_QUALITY = 'medium';

function buildImagePromptSystemMessage() {
    return [
        '你是一名 AI 资讯信息图设计师。',
        '根据以下播客文字稿，生成一段中文图片生成提示词，用于制作一张 AI 资讯日报信息图。',
        '要求：',
        '1. 提示词描述图片的视觉构成、主要内容、风格和色调',
        '2. 图片风格：科技感、简洁、信息丰富',
        '3. 图片应包含今日 AI 资讯的核心亮点（3~5 条新闻标题或关键词）',
        '4. 只输出提示词，不要解释'
    ].join('\n');
}

function normalizeChatCompletionsUrl(baseOrFullUrl, fallbackUrl) {
    const raw = (baseOrFullUrl || '').trim();
    if (!raw) return fallbackUrl;
    if (/\/chat\/completions\/?$/.test(raw)) return raw;
    return `${raw.replace(/\/+$/, '')}/chat/completions`;
}

function createInfographicGenerator({ config = {}, fetchImpl = fetch } = {}) {
    const deepseekApiKey = config.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
    const deepseekUrl = normalizeChatCompletionsUrl(
        config.deepseekApiUrl || process.env.DEEPSEEK_API_URL || process.env.DEEPSEEK_BASE_URL || '',
        DEFAULT_DEEPSEEK_URL
    );
    const deepseekModel = config.deepseekModel || process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;

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
            if (!deepseekApiKey) throw new Error('缺少 DeepSeek API Key，无法生成信息图提示词');
            if (!gptImageApiKey) throw new Error('缺少 GPT Image API Key，无法生成信息图');
            if (!gptImageBaseUrl) throw new Error('缺少 GPT Image API Base URL，无法生成信息图');

            // Step 1: DeepSeek 压缩文字稿 → 中文图片提示词
            const controller1 = new AbortController();
            const timer1 = setTimeout(() => controller1.abort(), timeoutMs);
            let imagePrompt;
            try {
                const resp = await fetchImpl(deepseekUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${deepseekApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: deepseekModel,
                        messages: [
                            { role: 'system', content: buildImagePromptSystemMessage() },
                            { role: 'user', content: String(scriptMarkdown || '').trim() }
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                        thinking: { type: 'disabled' },
                        stream: false
                    }),
                    signal: controller1.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `DeepSeek 请求失败: HTTP ${resp.status}`);
                }
                const content = data?.choices?.[0]?.message?.content;
                imagePrompt = (typeof content === 'string' ? content : '').trim();
                if (!imagePrompt) throw new Error('DeepSeek 未返回图片提示词');
            } finally {
                clearTimeout(timer1);
            }

            // Step 2: gpt-image-2 生成图片
            const controller2 = new AbortController();
            const timer2 = setTimeout(() => controller2.abort(), timeoutMs);
            try {
                const resp = await fetchImpl(`${gptImageBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${gptImageApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: gptImageModel,
                        prompt: imagePrompt,
                        n: 1,
                        size: imageSize,
                        quality: imageQuality,
                        output_format: outputFormat,
                        output_compression: outputCompression
                    }),
                    signal: controller2.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `图片生成失败: HTTP ${resp.status}`);
                }
                const b64 = data?.data?.[0]?.b64_json;
                if (!b64) throw new Error('gpt-image-2 未返回 b64_json');
                return Buffer.from(b64, 'base64');
            } finally {
                clearTimeout(timer2);
            }
        }
    };
}

module.exports = { createInfographicGenerator, buildImagePromptSystemMessage };
