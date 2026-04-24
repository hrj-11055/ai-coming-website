const fs = require('fs');
const path = require('path');

const DEFAULT_PROMPT = '你是一个专业的AI助手，擅长回答用户关于AI、人工智能、机器学习等相关问题。请用简洁、准确、专业的方式回答。';

function loadSystemPrompt(rootDir) {
    const promptFile = path.join(rootDir, 'config', 'system-prompt.txt');

    try {
        if (fs.existsSync(promptFile)) {
            const systemPrompt = fs.readFileSync(promptFile, 'utf8');
            console.log('✅ 系统提示词已加载: config/system-prompt.txt');
            return systemPrompt;
        }

        console.warn('⚠️  系统提示词文件不存在，使用默认提示词');
        return DEFAULT_PROMPT;
    } catch (error) {
        console.error('❌ 读取系统提示词文件失败:', error.message);
        return DEFAULT_PROMPT;
    }
}

function createAiConfigFromEnv(env) {
    return {
        apiKey: env.QWEN_API_KEY || env.DASHSCOPE_API_KEY,
        apiUrl: env.QWEN_API_URL || env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: env.QWEN_MODEL || env.DASHSCOPE_MODEL || 'qwen3.5-plus'
    };
}

function normalizeChatCompletionsUrl(baseOrFullUrl, fallbackUrl) {
    const raw = (baseOrFullUrl || '').trim();
    if (!raw) return fallbackUrl;
    if (/\/chat\/completions\/?$/.test(raw)) return raw;
    return `${raw.replace(/\/+$/, '')}/chat/completions`;
}

function createWeeklyKeywordsAiConfigFromEnv(env) {
    const deepseekBaseOrUrl = env.DEEPSEEK_API_URL || env.DEEPSEEK_BASE_URL;
    const deepseekApiUrl = normalizeChatCompletionsUrl(
        deepseekBaseOrUrl,
        'https://api.deepseek.com/chat/completions'
    );

    return {
        apiKey: env.DEEPSEEK_API_KEY || env.QWEN_API_KEY || env.DASHSCOPE_API_KEY,
        apiUrl: deepseekApiUrl,
        model: env.DEEPSEEK_MODEL || 'deepseek-v4-flash'
    };
}

function isApiKeyConfigured(apiKey) {
    const placeholders = new Set([
        'sk-your-qwen-api-key-here',
        'sk-your-api-key-here',
        'sk-your_api_key_here',
        'your_api_key_here'
    ]);
    return Boolean(apiKey && !placeholders.has(apiKey));
}

module.exports = {
    loadSystemPrompt,
    createAiConfigFromEnv,
    createWeeklyKeywordsAiConfigFromEnv,
    isApiKeyConfigured
};
