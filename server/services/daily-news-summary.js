'use strict';

const DEFAULT_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_TOKENS = 1200;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 1000;
const DAILY_NEWS_LIMIT = 10;
const MAX_TOTAL_CHARACTERS = 500;
const MAX_HEADLINE_CHARACTERS = 14;
const MAX_SENTENCE_CHARACTERS = 12;
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

function normalizeChatCompletionsUrl(value) {
    const input = String(value || '').trim();
    if (!input) {
        return DEFAULT_API_URL;
    }
    if (/\/chat\/completions\/?$/.test(input)) {
        return input;
    }
    return `${input.replace(/\/+$/, '')}/chat/completions`;
}

function createDailyNewsSummaryConfigFromEnv(env = process.env) {
    return {
        apiKey: env.DAILY_NEWS_SUMMARY_API_KEY || env.DEEPSEEK_API_KEY || '',
        apiUrl: normalizeChatCompletionsUrl(
            env.DAILY_NEWS_SUMMARY_API_URL || env.DEEPSEEK_API_URL || env.DEEPSEEK_BASE_URL
        ),
        model: env.DAILY_NEWS_SUMMARY_MODEL || env.DEEPSEEK_MODEL || DEFAULT_MODEL,
        timeoutMs: Number(env.DAILY_NEWS_SUMMARY_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
        maxTokens: Number(env.DAILY_NEWS_SUMMARY_MAX_TOKENS || DEFAULT_MAX_TOKENS),
        maxRetries: Number(env.DAILY_NEWS_SUMMARY_MAX_RETRIES || DEFAULT_MAX_RETRIES),
        retryBaseDelayMs: Number(env.DAILY_NEWS_SUMMARY_RETRY_BASE_DELAY_MS || DEFAULT_RETRY_BASE_DELAY_MS)
    };
}

function countCharacters(value) {
    return Array.from(String(value || '')).length;
}

function clipText(value, maxCharacters) {
    return Array.from(String(value || '')).slice(0, maxCharacters).join('');
}

function sanitizeInlineText(value) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function sanitizeSummaryPart(value, maxCharacters) {
    const cleaned = sanitizeInlineText(value)
        .replace(/^[“”"'`]+|[“”"'`]+$/g, '')
        .replace(/[。！？!?；;]+/g, '，')
        .replace(/[。！？!?；;，,:：、\s]+$/g, '')
        .trim();
    return clipText(cleaned, maxCharacters).replace(/[。！？!?；;，,:：、\s]+$/g, '').trim();
}

function buildSummaryPrompt({ date, items }) {
    const sourceItems = items.slice(0, DAILY_NEWS_LIMIT).map((item, index) => ({
        index: index + 1,
        title: sanitizeInlineText(item.originalTitle || item.title),
        key_point: sanitizeInlineText(item.keyPoint),
        summary: sanitizeInlineText(item.summary),
        source: sanitizeInlineText(item.sourceName)
    }));

    return [
        `请为 ${date} 的 AI 日报精选下面 10 条新闻，并输出 json 对象。`,
        '每条新闻必须保持原索引，只能依据输入内容概括，不得补充输入中没有的事实、数字或结论。',
        '每条输出一个 4-14 字的 headline，以及恰好两句概括 sentence1、sentence2；每句 6-12 字，不含句末标点。',
        '两句话应分别说明“发生了什么”和“为什么值得关注”，避免空话、重复标题与营销语气。',
        '输出格式必须是：{"items":[{"index":1,"headline":"短标题","sentence1":"第一句","sentence2":"第二句"}]}。',
        '必须输出 10 条，不能输出 markdown 或额外解释。最终内容会由代码再次校验并限制在 500 字以内。',
        '',
        '新闻输入 json：',
        JSON.stringify(sourceItems)
    ].join('\n');
}

function stripCodeFence(value) {
    const input = String(value || '').trim();
    const match = input.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return match ? match[1].trim() : input;
}

function buildDailyNewsSummaryContent(items) {
    return items.slice(0, DAILY_NEWS_LIMIT)
        .map((item, index) => `${index + 1}. ${item.title}：${item.keyPoint}`)
        .join('\n\n');
}

function normalizeDailyNewsSummaryItems(payload, sourceItems) {
    const rawItems = Array.isArray(payload) ? payload : payload?.items;
    if (!Array.isArray(rawItems) || rawItems.length !== DAILY_NEWS_LIMIT) {
        throw new Error(`DeepSeek 日报摘要必须返回 ${DAILY_NEWS_LIMIT} 条`);
    }

    const byIndex = new Map();
    rawItems.forEach((item) => {
        const index = Number(item?.index);
        if (Number.isInteger(index) && index >= 1 && index <= DAILY_NEWS_LIMIT && !byIndex.has(index)) {
            byIndex.set(index, item);
        }
    });

    if (byIndex.size !== DAILY_NEWS_LIMIT) {
        throw new Error('DeepSeek 日报摘要索引缺失或重复');
    }

    const normalized = sourceItems.slice(0, DAILY_NEWS_LIMIT).map((sourceItem, offset) => {
        const raw = byIndex.get(offset + 1);
        const title = sanitizeSummaryPart(raw.headline, MAX_HEADLINE_CHARACTERS);
        const sentence1 = sanitizeSummaryPart(raw.sentence1, MAX_SENTENCE_CHARACTERS);
        const sentence2 = sanitizeSummaryPart(raw.sentence2, MAX_SENTENCE_CHARACTERS);
        if (!title || !sentence1 || !sentence2) {
            throw new Error(`DeepSeek 日报摘要第 ${offset + 1} 条字段不完整`);
        }

        return {
            ...sourceItem,
            originalTitle: sanitizeInlineText(sourceItem.originalTitle || sourceItem.title),
            title,
            keyPoint: `${sentence1}。${sentence2}。`,
            sentence1,
            sentence2
        };
    });

    const content = buildDailyNewsSummaryContent(normalized);
    const characterCount = countCharacters(content);
    if (characterCount > MAX_TOTAL_CHARACTERS) {
        throw new Error(`DeepSeek 日报摘要超过 ${MAX_TOTAL_CHARACTERS} 字（当前 ${characterCount} 字）`);
    }

    return {
        items: normalized,
        content,
        characterCount
    };
}

function validateCachedDailyNewsSummary(cache, sourceFingerprint) {
    if (!cache || cache.source_fingerprint !== sourceFingerprint || !Array.isArray(cache.items)) {
        return null;
    }
    if (cache.items.length !== DAILY_NEWS_LIMIT) {
        return null;
    }

    const valid = cache.items.every((item) => (
        sanitizeInlineText(item.title)
        && sanitizeInlineText(item.sentence1)
        && sanitizeInlineText(item.sentence2)
        && !/[。！？!?；;]/.test(String(item.sentence1))
        && !/[。！？!?；;]/.test(String(item.sentence2))
        && sanitizeInlineText(item.keyPoint) === `${sanitizeInlineText(item.sentence1)}。${sanitizeInlineText(item.sentence2)}。`
    ));
    if (!valid) {
        return null;
    }

    const content = buildDailyNewsSummaryContent(cache.items);
    const characterCount = countCharacters(content);
    if (characterCount > MAX_TOTAL_CHARACTERS) {
        return null;
    }

    return {
        items: cache.items,
        content,
        characterCount,
        model: cache.model || null,
        usage: cache.usage || null,
        generatedAt: cache.generated_at || null
    };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestDailyNewsSummary({ config, date, items, fetchImpl, sleepImpl }) {
    const maxRetries = Math.max(0, Number(config.maxRetries) || 0);
    const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_TIMEOUT_MS);
    const retryBaseDelayMs = Math.max(1, Number(config.retryBaseDelayMs) || DEFAULT_RETRY_BASE_DELAY_MS);
    const body = {
        model: config.model || DEFAULT_MODEL,
        messages: [
            {
                role: 'system',
                content: '你是严谨的 AI 科技新闻编辑。你只输出符合指定结构的 json，不编造事实。'
            },
            {
                role: 'user',
                content: buildSummaryPrompt({ date, items })
            }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: Math.max(256, Number(config.maxTokens) || DEFAULT_MAX_TOKENS),
        thinking: { type: 'disabled' },
        stream: false
    };

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetchImpl(config.apiUrl || DEFAULT_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
                if (attempt < maxRetries && RETRYABLE_STATUS_CODES.has(response.status)) {
                    await sleepImpl(retryBaseDelayMs * (2 ** attempt));
                    continue;
                }
                throw new Error(`DeepSeek 日报摘要请求失败: ${message}`);
            }

            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('DeepSeek 日报摘要响应缺少 choices[0].message.content');
            }

            let parsed;
            try {
                parsed = JSON.parse(stripCodeFence(content));
            } catch (error) {
                throw new Error(`DeepSeek 日报摘要 JSON 解析失败: ${error.message}`);
            }

            return {
                parsed,
                usage: data.usage || null,
                model: data.model || config.model || DEFAULT_MODEL
            };
        } finally {
            clearTimeout(timer);
        }
    }

    throw new Error('DeepSeek 日报摘要请求失败');
}

function createDailyNewsSummarizer(options = {}) {
    const config = {
        ...createDailyNewsSummaryConfigFromEnv(options.env || process.env),
        ...(options.config || {})
    };
    const fetchImpl = options.fetchImpl || fetch;
    const sleepImpl = options.sleepImpl || sleep;

    return {
        async summarizeDailyNews({ date, items }) {
            if (!config.apiKey) {
                throw new Error('未配置 DAILY_NEWS_SUMMARY_API_KEY 或 DEEPSEEK_API_KEY');
            }
            if (!Array.isArray(items) || items.length !== DAILY_NEWS_LIMIT) {
                throw new Error(`日报摘要输入必须恰好包含 ${DAILY_NEWS_LIMIT} 条新闻`);
            }

            const response = await requestDailyNewsSummary({
                config,
                date,
                items,
                fetchImpl,
                sleepImpl
            });
            const normalized = normalizeDailyNewsSummaryItems(response.parsed, items);

            return {
                ...normalized,
                model: response.model,
                usage: response.usage,
                generatedAt: new Date().toISOString()
            };
        }
    };
}

module.exports = {
    DAILY_NEWS_LIMIT,
    MAX_TOTAL_CHARACTERS,
    buildDailyNewsSummaryContent,
    buildSummaryPrompt,
    countCharacters,
    createDailyNewsSummarizer,
    createDailyNewsSummaryConfigFromEnv,
    normalizeDailyNewsSummaryItems,
    validateCachedDailyNewsSummary
};
