const express = require('express');
const { isApiKeyConfigured } = require('../services/ai-proxy');

function toPositiveInteger(value, fallback) {
    const number = Math.floor(Number(value));
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeAiRequest(body = {}, requestLimits = {}) {
    const maxQueryChars = toPositiveInteger(requestLimits.maxQueryChars, 12000);
    const maxOutputTokens = toPositiveInteger(requestLimits.maxOutputTokens, 4000);
    const timeoutMs = toPositiveInteger(requestLimits.timeoutMs, 120000);
    const query = typeof body.query === 'string' ? body.query.trim() : '';

    if (!query) {
        return {
            error: {
                status: 400,
                message: 'query 参数必须是非空字符串'
            }
        };
    }

    if (query.length > maxQueryChars) {
        return {
            error: {
                status: 413,
                message: `query 长度不能超过 ${maxQueryChars} 个字符`
            }
        };
    }

    const requestedTemperature = Number(body.temperature ?? 0.7);
    const temperature = Number.isFinite(requestedTemperature)
        ? Math.min(2, Math.max(0, requestedTemperature))
        : 0.7;
    const requestedMaxTokens = toPositiveInteger(body.max_tokens, maxOutputTokens);

    return {
        query,
        temperature,
        maxTokens: Math.min(requestedMaxTokens, maxOutputTokens),
        stream: body.stream !== false,
        timeoutMs
    };
}

function normalizeModelError(error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        return {
            status: 504,
            message: '上游 AI 服务请求超时'
        };
    }

    return {
        status: 500,
        message: error?.message || '上游 AI 服务请求失败'
    };
}

function createAiRouter({ systemPrompt, aiConfig, aiUsageService, requestLimits = {} }) {
    const router = express.Router();

    router.post('/ai/chat', async (req, res) => {
        const startedAt = Date.now();
        let requestChars = 0;

        function recordUsage(status, options = {}) {
            if (!aiUsageService || typeof aiUsageService.recordUsage !== 'function') {
                return;
            }

            try {
                aiUsageService.recordUsage({
                    req,
                    status,
                    model: aiConfig.model,
                    source: 'homepage',
                    stream: Boolean(options.stream),
                    requestChars,
                    latencyMs: Date.now() - startedAt,
                    usage: options.usage,
                    error: options.error
                });
            } catch (error) {
                console.error('记录AI用量失败:', error);
            }
        }

        try {
            const { apiKey, apiUrl, model } = aiConfig;

            if (!isApiKeyConfigured(apiKey)) {
                return res.status(500).json({
                    error: 'API_KEY未配置',
                    message: '请在 .env 文件中配置 QWEN_API_KEY 或 DASHSCOPE_API_KEY'
                });
            }

            const normalizedRequest = normalizeAiRequest(req.body, requestLimits);
            if (normalizedRequest.error) {
                return res.status(normalizedRequest.error.status).json({
                    error: '参数错误',
                    message: normalizedRequest.error.message
                });
            }
            const { query, temperature, maxTokens, stream, timeoutMs } = normalizedRequest;

            requestChars = query.length;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ];
            const signal = AbortSignal.timeout(timeoutMs);

            if (stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                res.flushHeaders();

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model,
                            messages,
                            temperature,
                            max_tokens: maxTokens,
                            stream: true,
                            stream_options: { include_usage: true }
                        }),
                        signal
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        recordUsage('error', {
                            stream: true,
                            error: errorData.message || `HTTP ${response.status}`
                        });
                        res.write(`data: ${JSON.stringify({ error: errorData.message || 'API请求失败' })}\n\n`);
                        res.end();
                        return;
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    let responseUsage = null;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;

                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.usage) {
                                    responseUsage = parsed.usage;
                                }
                                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                            } catch (error) {
                                // ignore invalid chunks
                            }
                        }
                    }

                    recordUsage('success', {
                        stream: true,
                        usage: responseUsage
                    });
                    res.end();
                } catch (error) {
                    const normalizedError = normalizeModelError(error);
                    console.error('流式API调用错误:', error);
                    recordUsage('error', {
                        stream: true,
                        error: normalizedError.message
                    });
                    res.write(`data: ${JSON.stringify({ error: normalizedError.message })}\n\n`);
                    res.end();
                }

                return;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream: false
                }),
                signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                recordUsage('error', {
                    stream: false,
                    error: errorData.message || `HTTP ${response.status}`
                });
                return res.status(response.status).json({
                    error: 'API请求失败',
                    message: errorData.message || `HTTP ${response.status}`,
                    details: errorData
                });
            }

            const data = await response.json();
            recordUsage('success', {
                stream: false,
                usage: data.usage
            });
            return res.json(data);
        } catch (error) {
            const normalizedError = normalizeModelError(error);
            console.error('AI搜索错误:', error);
            recordUsage('error', {
                stream: Boolean(req.body?.stream),
                error: normalizedError.message
            });
            if (!res.headersSent) {
                return res.status(normalizedError.status).json({
                    error: '服务器错误',
                    message: normalizedError.message
                });
            }
            return undefined;
        }
    });

    return router;
}

module.exports = {
    createAiRouter,
    normalizeAiRequest,
    normalizeModelError
};
