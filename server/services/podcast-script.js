const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_SCRIPT_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_SCRIPT_MODEL = 'deepseek-chat';
const DEFAULT_SCRIPT_TIMEOUT_MS = 120000;
const DEFAULT_SCRIPT_INPUT_DIR = '/var/www/json/report';
const DEFAULT_SCRIPT_MAX_TOKENS = 2200;
const DEFAULT_SCRIPT_MAX_RETRIES = 3;
const DEFAULT_SCRIPT_RETRY_BASE_DELAY_MS = 1000;
const MAX_TTS_TEXT_LENGTH = 100000;
const RETRYABLE_HTTP_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const STRUCTURAL_SPOKEN_LABELS = new Set([
    '硅基生存指南',
    '开场钩子',
    '十个信号',
    '生存智慧'
]);

function hashText(value) {
    return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

function sanitizeInlineText(value) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function toStarRating(score) {
    const normalized = Math.max(1, Math.min(5, Number(score) || 1));
    return '⭐'.repeat(normalized);
}

function buildPodcastSourceMarkdown({ date, articles }) {
    const lines = [
        `# AIcoming Daily News | ${date}`,
        '',
        '以下是当日新闻原始素材，请根据系统提示词完成口播稿生成。',
        ''
    ];

    articles.forEach((article, index) => {
        lines.push(`## ${index + 1}. ${sanitizeInlineText(article.title) || '无标题'}`);
        lines.push(`- 来源：${sanitizeInlineText(article.source_name) || '未知来源'}`);
        lines.push(`- 分类：${sanitizeInlineText(article.category) || '未分类'}`);
        lines.push(`- 重要性：${toStarRating(article.importance_score)}`);
        lines.push(`- 要点：${sanitizeInlineText(article.key_point) || '无'}`);
        lines.push(`- 深度摘要：${sanitizeInlineText(article.summary) || '无'}`);
        lines.push(`- 原文链接：${sanitizeInlineText(article.source_url) || '#'}`);
        lines.push('');
    });

    return lines.join('\n').trim();
}

function normalizeMarkdownLine(line) {
    return line
        .replace(/^\s{0,3}#+\s*/, '')
        .replace(/^\s*[-*+]\s+/, '')
        .replace(/\*\*/g, '')
        .replace(/__/g, '')
        .trim();
}

function stripMarkdownForSpeech(markdown) {
    return markdown
        .split('\n')
        .map((line) => normalizeMarkdownLine(line))
        .filter((line) => line && !STRUCTURAL_SPOKEN_LABELS.has(line))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function extractBulletItems(block) {
    return block
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => /^[-*+]\s+/.test(line))
        .map((line) => line.replace(/^[-*+]\s+/, '').trim())
        .filter(Boolean);
}

function parsePodcastScriptMarkdown(markdown) {
    const source = String(markdown || '').trim();
    const normalized = source.replace(/\r\n/g, '\n');
    const wechatMatch = normalized.match(/\*\*朋友圈文案\*\*：([^\n]+)/);
    const excludedBlockMatch = normalized.match(/\*\*排除旧闻\*\*：\n((?:[-*+]\s+[^\n]+\n?)*)/);
    const selectedTitles = [...normalized.matchAll(/\*\*信号\d+：([^*\n]+)\*\*/g)].map((match) => match[1].trim());

    const speechStartIndex = normalized.search(/^##\s+开场钩子/m);
    const ttsMarkdown = speechStartIndex >= 0 ? normalized.slice(speechStartIndex) : normalized;
    const scriptTtsText = stripMarkdownForSpeech(ttsMarkdown);

    if (!scriptTtsText) {
        throw new Error('生成的口播稿缺少可朗读正文');
    }

    if (scriptTtsText.length > MAX_TTS_TEXT_LENGTH) {
        throw new Error(`生成的口播稿超过异步 TTS 限制（${scriptTtsText.length} > ${MAX_TTS_TEXT_LENGTH}）`);
    }

    return {
        script_markdown: source,
        script_tts_text: scriptTtsText,
        wechat_copy: wechatMatch ? wechatMatch[1].trim() : '',
        excluded_items: excludedBlockMatch ? extractBulletItems(excludedBlockMatch[1]) : [],
        selected_titles: selectedTitles
    };
}

function loadSystemPrompt(filePath) {
    if (!filePath) {
        throw new Error('未配置播客提示词文件路径');
    }

    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`播客提示词文件不存在: ${resolvedPath}`);
    }

    return fs.readFileSync(resolvedPath, 'utf8').trim();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildReportInputFilePath(date, inputDir = DEFAULT_SCRIPT_INPUT_DIR) {
    return path.join(inputDir, `${date}.json`);
}

function loadReportJsonInput({ date, inputDir = DEFAULT_SCRIPT_INPUT_DIR }) {
    const filePath = buildReportInputFilePath(date, inputDir);
    if (!fs.existsSync(filePath)) {
        const error = new Error(`未找到指定日报输入文件: ${filePath}`);
        error.scriptInputFile = filePath;
        throw error;
    }

    return {
        filePath,
        content: fs.readFileSync(filePath, 'utf8').trim()
    };
}

function isRetryableStatusCode(status) {
    return RETRYABLE_HTTP_STATUS_CODES.has(Number(status));
}

function parseRetryAfterMs(response) {
    const headerValue = response?.headers?.get?.('retry-after');
    if (!headerValue) {
        return null;
    }

    const numericSeconds = Number(headerValue);
    if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
        return Math.round(numericSeconds * 1000);
    }

    const dateValue = Date.parse(headerValue);
    if (Number.isFinite(dateValue)) {
        return Math.max(0, dateValue - Date.now());
    }

    return null;
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

async function requestPodcastScript({
    config,
    fetchImpl = fetch,
    sleepImpl = sleep,
    systemPrompt,
    sourceContent,
    scriptInputFile = null
}) {
    const timeoutMs = Math.max(1000, Number(config.timeoutMs) || DEFAULT_SCRIPT_TIMEOUT_MS);
    const maxRetries = Math.max(0, Number(config.maxRetries) || DEFAULT_SCRIPT_MAX_RETRIES);
    const maxTokens = Math.max(1, Number(config.maxTokens) || DEFAULT_SCRIPT_MAX_TOKENS);
    const retryBaseDelayMs = Math.max(1, Number(config.retryBaseDelayMs) || DEFAULT_SCRIPT_RETRY_BASE_DELAY_MS);

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetchImpl(config.apiUrl || DEFAULT_SCRIPT_API_URL, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: config.model || DEFAULT_SCRIPT_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: sourceContent
                        }
                    ],
                    temperature: 0.4,
                    max_tokens: maxTokens,
                    stream: false
                }),
                signal: controller.signal
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                const message = data?.error?.message || data?.base_resp?.status_msg || data?.message || data?.msg || `播客文稿生成失败: HTTP ${response.status}`;
                if (attempt < maxRetries && isRetryableStatusCode(response.status)) {
                    const retryAfterMs = parseRetryAfterMs(response);
                    const delayMs = retryAfterMs ?? retryBaseDelayMs * (2 ** attempt);
                    await sleepImpl(delayMs);
                    continue;
                }

                const error = new Error(message);
                error.scriptInputFile = scriptInputFile;
                error.scriptAttempts = attempt + 1;
                error.lastHttpStatus = response.status;
                throw error;
            }

            const content = resolveAssistantContent(data);
            if (!content) {
                const error = new Error('文本模型未返回口播稿内容');
                error.scriptInputFile = scriptInputFile;
                error.scriptAttempts = attempt + 1;
                error.lastHttpStatus = response.status;
                throw error;
            }

            return {
                content,
                attempts: attempt + 1,
                lastHttpStatus: response.status
            };
        } finally {
            clearTimeout(timer);
        }
    }

    const error = new Error('播客文稿生成失败：超过最大重试次数');
    error.scriptInputFile = scriptInputFile;
    error.scriptAttempts = maxRetries + 1;
    throw error;
}

function createPodcastScriptService({
    config,
    fetchImpl = fetch,
    sleepImpl = sleep
}) {
    return {
        getPromptHash() {
            const prompt = loadSystemPrompt(config.systemPromptFile);
            return hashText(prompt);
        },
        buildSourceMarkdown({ date, articles }) {
            return buildPodcastSourceMarkdown({ date, articles });
        },
        getInputFilePath(date) {
            return buildReportInputFilePath(date, config.inputDir || DEFAULT_SCRIPT_INPUT_DIR);
        },
        async generateScript({ date, articles }) {
            const systemPrompt = loadSystemPrompt(config.systemPromptFile);
            const reportInput = loadReportJsonInput({
                date,
                inputDir: config.inputDir || DEFAULT_SCRIPT_INPUT_DIR
            });
            const result = await requestPodcastScript({
                config,
                fetchImpl,
                sleepImpl,
                systemPrompt,
                sourceContent: reportInput.content,
                scriptInputFile: reportInput.filePath
            });

            return {
                ...parsePodcastScriptMarkdown(result.content),
                script_input_file: reportInput.filePath,
                script_attempts: result.attempts,
                last_http_status: result.lastHttpStatus
            };
        }
    };
}

module.exports = {
    DEFAULT_SCRIPT_API_URL,
    DEFAULT_SCRIPT_INPUT_DIR,
    DEFAULT_SCRIPT_MODEL,
    DEFAULT_SCRIPT_MAX_RETRIES,
    DEFAULT_SCRIPT_RETRY_BASE_DELAY_MS,
    DEFAULT_SCRIPT_MAX_TOKENS,
    DEFAULT_SCRIPT_TIMEOUT_MS,
    MAX_TTS_TEXT_LENGTH,
    buildPodcastSourceMarkdown,
    buildReportInputFilePath,
    parsePodcastScriptMarkdown,
    createPodcastScriptService
};
