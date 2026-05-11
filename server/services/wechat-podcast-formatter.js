const crypto = require('crypto');

const { buildWechatDigest } = require('./wechat-content');

const DEFAULT_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const DEFAULT_TIMEOUT_MS = 120000;

function buildWechatPodcastFormattingPrompt() {
    return [
        '你是一个擅长内容运营的微信公众号编辑。',
        '你的任务是把现有播客文字版做轻包装，整理成适合微信公众号阅读的 Markdown。',
        '目标不是重写观点，而是在尽量保留原意的前提下提升可读性、层次感和公众号观感。',
        '',
        '必须遵守：',
        '1. 标题由外部提供，不要在正文重复输出新的 H1 标题。',
        '2. 只做轻包装，不要发散补充不存在的事实，不要改写核心观点。',
        '3. 不要输出音频链接、收听入口、二维码、图片占位提示。',
        '4. 使用简洁的二级标题和短段落，适合微信公众号。',
        '5. 如果提供了转发文案，可以在文末整理成“推荐转发文案”区块。',
        '6. 输出纯 Markdown，不要解释，不要代码块。',
        '',
        '推荐结构：',
        '- 开场导语',
        '- 今日内容',
        '- 推荐转发文案（若有）'
    ].join('\n');
}

function resolveAssistantContent(data) {
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => (typeof item === 'string' ? item : item?.text || item?.content || ''))
            .join('')
            .trim();
    }

    return '';
}

function normalizeChatCompletionsUrl(baseOrFullUrl, fallbackUrl) {
    const raw = (baseOrFullUrl || '').trim();
    if (!raw) return fallbackUrl;
    if (/\/chat\/completions\/?$/.test(raw)) return raw;
    return `${raw.replace(/\/+$/, '')}/chat/completions`;
}

function buildFormatterFingerprint({ model, prompt, version }) {
    return crypto
        .createHash('sha1')
        .update(JSON.stringify({
            version: version || '',
            model: model || '',
            prompt: prompt || ''
        }))
        .digest('hex');
}

function createWechatPodcastFormatter({
    config = {},
    fetchImpl = fetch
} = {}) {
    const apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY || '';
    const apiUrl = normalizeChatCompletionsUrl(
        config.apiUrl || process.env.DEEPSEEK_API_URL || process.env.DEEPSEEK_BASE_URL || '',
        DEFAULT_API_URL
    );
    const model = config.model || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.WECHAT_PODCAST_FORMATTER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));
    const prompt = buildWechatPodcastFormattingPrompt();
    const fingerprint = buildFormatterFingerprint({
        model,
        prompt,
        version: config.version || process.env.WECHAT_PODCAST_FORMATTER_VERSION || ''
    });

    return {
        getFingerprint() {
            return fingerprint;
        },
        async formatForWechat({
            title,
            summary,
            scriptMarkdown,
            wechatCopy
        }) {
            if (!apiKey) {
                throw new Error('缺少 DeepSeek API Key，无法生成播客公众号轻包装文稿');
            }

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);

            try {
                const response = await fetchImpl(apiUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            {
                                role: 'system',
                                content: prompt
                            },
                            {
                                role: 'user',
                                content: [
                                    `标题：${title || ''}`,
                                    `摘要：${summary || ''}`,
                                    '',
                                    '播客文字版原稿：',
                                    String(scriptMarkdown || '').trim(),
                                    '',
                                    `转发文案：${wechatCopy || '无'}`
                                ].join('\n')
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 2200,
                        thinking: { type: 'disabled' },
                        stream: false
                    }),
                    signal: controller.signal
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const message = data?.error?.message || data?.message || `播客公众号轻包装失败: HTTP ${response.status}`;
                    throw new Error(message);
                }

                const markdown = resolveAssistantContent(data);
                if (!markdown) {
                    throw new Error('DeepSeek 未返回播客公众号轻包装内容');
                }

                return {
                    markdown,
                    digest: buildWechatDigest(summary || markdown)
                };
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

module.exports = {
    buildWechatPodcastFormattingPrompt,
    createWechatPodcastFormatter
};
