const crypto = require('crypto');

function padDatePart(value) {
    return String(value || '').padStart(2, '0');
}

function formatWechatTitle(date) {
    const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        throw new Error(`无效日期格式: ${date}`);
    }

    return `${match[2]}月${match[3]}日AI资讯早报`;
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

function normalizeArticles(report) {
    if (Array.isArray(report)) {
        return report;
    }

    if (Array.isArray(report?.articles)) {
        return report.articles;
    }

    if (Array.isArray(report?.news)) {
        return report.news;
    }

    return [];
}

function buildWechatDigest(text) {
    const source = sanitizeInlineText(text);
    if (!source) {
        return '';
    }

    if (source.length <= 120) {
        return source;
    }

    const truncated = source.slice(0, 117);
    const lastPunct = Math.max(
        truncated.lastIndexOf('。'),
        truncated.lastIndexOf('，'),
        truncated.lastIndexOf('；'),
        truncated.lastIndexOf('、')
    );

    return lastPunct > 80 ? truncated.slice(0, lastPunct + 1) : `${truncated}...`;
}

function buildHighlightItems(articles, limit = 5) {
    return [...articles]
        .sort((left, right) => (Number(right.importance_score) || 0) - (Number(left.importance_score) || 0))
        .slice(0, limit)
        .map((article) => sanitizeInlineText(article.title) || '无标题');
}

function buildNewsMarkdown({ date, report }) {
    const title = formatWechatTitle(date);
    const articles = normalizeArticles(report);
    const highlights = buildHighlightItems(articles);
    const lines = [
        `# ${title}`,
        '',
        '> 日报版',
        '',
        '以下内容基于当天 AI 资讯 JSON 自动整理，帮助你快速浏览今日重点动态。',
        '',
        '## 今日看点',
        ''
    ];

    if (highlights.length === 0) {
        lines.push('- 今日暂无可展示的重点资讯');
    } else {
        highlights.forEach((item) => {
            lines.push(`- ${item}`);
        });
    }

    articles.forEach((article, index) => {
        lines.push('');
        lines.push(`## ${index + 1}. ${sanitizeInlineText(article.title) || '无标题'}`);
        lines.push(`- 来源：${sanitizeInlineText(article.source_name) || '未知来源'}`);
        lines.push(`- 分类：${sanitizeInlineText(article.category) || '未分类'}`);
        lines.push(`- 重要性：${toStarRating(article.importance_score)}`);
        lines.push(`- 核心要点：${sanitizeInlineText(article.key_point) || '暂无'}`);
        lines.push(`- 深度摘要：${sanitizeInlineText(article.summary) || '暂无'}`);
        lines.push(`- 原文链接：${sanitizeInlineText(article.source_url) || '#'}`);
    });

    return lines.join('\n').trim();
}

function normalizeBaseUrl(siteBaseUrl) {
    const value = sanitizeInlineText(siteBaseUrl);
    return value.replace(/\/+$/, '');
}

function joinAbsoluteUrl(siteBaseUrl, maybeRelativeUrl) {
    const input = sanitizeInlineText(maybeRelativeUrl);
    if (!input) {
        return '';
    }

    if (/^https?:\/\//i.test(input)) {
        return input;
    }

    const baseUrl = normalizeBaseUrl(siteBaseUrl);
    return baseUrl ? `${baseUrl}${input.startsWith('/') ? '' : '/'}${input}` : input;
}

function trimPodcastScriptMarkdown(markdown) {
    const lines = String(markdown || '')
        .replace(/\r\n/g, '\n')
        .split('\n');

    while (lines.length > 0 && !lines[0].trim()) {
        lines.shift();
    }

    while (lines.length > 0 && /^#\s+/.test(lines[0].trim())) {
        lines.shift();
    }

    return lines.join('\n').trim();
}

function buildPodcastMarkdown({ date, metadata }) {
    const title = formatWechatTitle(date);
    const scriptMarkdown = trimPodcastScriptMarkdown(metadata?.script_markdown || '');
    const lines = [
        `# ${title}`,
        '',
        '> 播客版',
        ''
    ];

    if (metadata?.summary) {
        lines.push(metadata.summary.trim());
        lines.push('');
    }

    if (scriptMarkdown) {
        lines.push('## 今日播客正文');
        lines.push('');
        lines.push(scriptMarkdown);
        lines.push('');
    }

    if (metadata?.wechat_copy) {
        lines.push('## 推荐转发文案');
        lines.push('');
        lines.push(metadata.wechat_copy.trim());
        lines.push('');
    }

    return lines.join('\n').trim();
}

function buildPodcastVoiceMessageText(metadata, maxChars = 170) {
    const source = sanitizeInlineText(metadata?.script_tts_text || metadata?.transcript || metadata?.summary || '');
    if (!source) {
        return '';
    }

    const outro = '更多内容请看公众号文章。';
    const budget = Math.max(40, maxChars - outro.length - 1);
    const sentences = source
        .split(/(?<=[。！？!?；;])/)
        .map((item) => item.trim())
        .filter(Boolean);

    let body = '';
    for (const sentence of sentences) {
        if ((body + sentence).length > budget) {
            break;
        }
        body += sentence;
    }

    if (!body) {
        body = source.slice(0, budget).trim();
        body = body.replace(/[，、；,.!?！？:：\s]+$/g, '');
        body += '。';
    }

    return `${body}${outro}`;
}

function hashText(value) {
    return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

module.exports = {
    buildNewsMarkdown,
    buildPodcastMarkdown,
    buildPodcastVoiceMessageText,
    buildWechatDigest,
    formatWechatTitle,
    hashText,
    normalizeArticles,
    padDatePart
};
