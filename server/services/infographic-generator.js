'use strict';

const DEFAULT_GPT_IMAGE_MODEL = 'gpt-image-2-official';
const DEFAULT_IMAGE_SIZE = '16:9';
const DEFAULT_IMAGE_RESOLUTION = '2k';
const DEFAULT_IMAGE_QUALITY = 'high';
const DEFAULT_TIMEOUT_MS = 600000;
const IMAGE_PROMPT_PREFIX = '请基于下面播客文字稿画一幅《小元说 AI日报》图片。';

function buildImagePromptSystemMessage() {
    return IMAGE_PROMPT_PREFIX;
}

function buildImagePrompt(scriptMarkdown) {
    return `${IMAGE_PROMPT_PREFIX}\n\n${String(scriptMarkdown || '').trim()}`;
}

function createInfographicGenerator({ config = {}, fetchImpl = fetch } = {}) {
    let gptImageApiKey = config.gptImageApiKey;
    if (gptImageApiKey === undefined) {
        gptImageApiKey = process.env.GPT_IMAGE_API_KEY || '';
        if (!gptImageApiKey || gptImageApiKey === 'sk-your-key-here') {
            gptImageApiKey = 'sk-3Cwn7yQg0WKg82hF1KIvjrEv7ZZ4ktUg0HiPdneLhifFsabV';
        }
    }

    let gptImageBaseUrl = config.gptImageBaseUrl;
    if (gptImageBaseUrl === undefined) {
        gptImageBaseUrl = process.env.GPT_IMAGE_API_BASE_URL || '';
        if (!gptImageBaseUrl || gptImageBaseUrl.includes('bytecatcode.org')) {
            gptImageBaseUrl = 'https://api.apimart.ai';
        }
    } else {
        gptImageBaseUrl = String(gptImageBaseUrl || '').replace(/\/+$/, '');
    }

    const gptImageModel = config.gptImageModel || DEFAULT_GPT_IMAGE_MODEL;
    let imageSize = config.imageSize || DEFAULT_IMAGE_SIZE;
    if (imageSize === '1024x1024') {
        imageSize = '16:9';
    }
    const imageResolution = config.imageResolution || process.env.GPT_IMAGE_RESOLUTION || DEFAULT_IMAGE_RESOLUTION;
    const imageQuality = config.imageQuality || process.env.GPT_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.INFOGRAPHIC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));
    const pollIntervalMs = Number(config.pollIntervalMs || 3000);

    return {
        async generateInfographic({ scriptMarkdown }) {
            if (!gptImageApiKey) throw new Error('缺少 GPT Image API Key，无法生成信息图');
            if (!gptImageBaseUrl) throw new Error('缺少 GPT Image API Base URL，无法生成信息图');

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                // Step 1: Submit the task
                const resp = await fetchImpl(`${gptImageBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${gptImageApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: gptImageModel,
                        prompt: buildImagePrompt(scriptMarkdown),
                        size: imageSize,
                        resolution: imageResolution,
                        quality: imageQuality,
                        n: 1
                    }),
                    signal: controller.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `提交图片生成任务失败: HTTP ${resp.status}`);
                }
                const taskId = data?.data?.task_id;
                if (!taskId) {
                    throw new Error('APIMart 未返回 task_id');
                }

                // Step 2: Poll status
                let imageUrl = null;
                while (imageUrl === null) {
                    if (controller.signal.aborted) {
                        throw new Error('图片生成超时或已被取消');
                    }

                    const statusResp = await fetchImpl(`${gptImageBaseUrl}/v1/tasks/${taskId}`, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${gptImageApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        signal: controller.signal
                    });
                    const statusData = await statusResp.json().catch(() => ({}));
                    if (!statusResp.ok) {
                        throw new Error(statusData?.error?.message || `查询任务状态失败: HTTP ${statusResp.status}`);
                    }

                    const taskStatus = statusData?.data?.status;
                    if (taskStatus === 'completed') {
                        const images = statusData?.data?.result?.images;
                        const firstImage = images?.[0];
                        if (firstImage) {
                            if (Array.isArray(firstImage.url)) {
                                imageUrl = firstImage.url[0];
                            } else if (typeof firstImage.url === 'string') {
                                imageUrl = firstImage.url;
                            }
                        }
                        if (!imageUrl) {
                            throw new Error('任务已完成，但未返回有效的图片 URL');
                        }
                    } else if (taskStatus === 'failed') {
                        throw new Error(statusData?.data?.result?.error_message || statusData?.data?.result?.message || '图片生成任务失败 (failed)');
                    } else if (taskStatus === 'cancelled') {
                        throw new Error('图片生成任务已被取消 (cancelled)');
                    } else {
                        // Wait for pollIntervalMs
                        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
                    }
                }

                // Step 3: Fetch/Download the image content
                const imageResp = await fetchImpl(imageUrl, {
                    method: 'GET',
                    signal: controller.signal
                });
                if (!imageResp.ok) {
                    throw new Error(`下载生成图像失败: HTTP ${imageResp.status}`);
                }
                const arrayBuffer = await imageResp.arrayBuffer();
                return Buffer.from(arrayBuffer);
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

module.exports = { createInfographicGenerator, buildImagePromptSystemMessage, buildImagePrompt };

