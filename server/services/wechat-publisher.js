const fs = require('fs');
const path = require('path');

const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/material/add_material';
const DRAFT_URL = 'https://api.weixin.qq.com/cgi-bin/draft/add';

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(text) {
    let output = escapeHtml(text);
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
    output = output.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
    return output;
}

function renderMarkdownToHtml(markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let currentList = null;

    function flushList() {
        if (currentList && currentList.length > 0) {
            blocks.push(`<ul>${currentList.join('')}</ul>`);
        }
        currentList = null;
    }

    lines.forEach((rawLine) => {
        const line = rawLine.trim();

        if (!line) {
            flushList();
            return;
        }

        if (/^-\s+/.test(line)) {
            currentList = currentList || [];
            currentList.push(`<li>${renderInlineMarkdown(line.replace(/^-\s+/, ''))}</li>`);
            return;
        }

        flushList();

        if (/^#\s+/.test(line)) {
            blocks.push(`<h1>${renderInlineMarkdown(line.replace(/^#\s+/, ''))}</h1>`);
            return;
        }

        if (/^##\s+/.test(line)) {
            blocks.push(`<h2>${renderInlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`);
            return;
        }

        if (/^###\s+/.test(line)) {
            blocks.push(`<h3>${renderInlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`);
            return;
        }

        if (/^>\s+/.test(line)) {
            blocks.push(`<blockquote>${renderInlineMarkdown(line.replace(/^>\s+/, ''))}</blockquote>`);
            return;
        }

        blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
    });

    flushList();

    return [
        '<section style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;color:#1f2937;line-height:1.8;font-size:16px;">',
        blocks.join('\n'),
        '</section>'
    ].join('\n');
}

async function fetchAccessToken({ appId, appSecret, fetchImpl = fetch }) {
    const url = `${TOKEN_URL}?grant_type=client_credential&appid=${encodeURIComponent(appId)}&secret=${encodeURIComponent(appSecret)}`;
    const response = await fetchImpl(url);
    if (!response.ok) {
        throw new Error(`获取 access token 失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errcode) {
        throw new Error(`获取 access token 失败: ${data.errmsg || data.errcode}`);
    }

    if (!data.access_token) {
        throw new Error('微信 access token 响应缺少 access_token');
    }

    return data.access_token;
}

function getMimeType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}

async function uploadImage({ accessToken, imagePath, fetchImpl = fetch }) {
    const resolvedPath = path.resolve(imagePath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`封面图不存在: ${resolvedPath}`);
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const fileName = path.basename(resolvedPath);
    const boundary = `----wechat-boundary-${Date.now().toString(16)}`;
    const header = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="media"; filename="${fileName}"`,
        `Content-Type: ${getMimeType(resolvedPath)}`,
        '',
        ''
    ].join('\r\n');
    const footer = `\r\n--${boundary}--\r\n`;
    const body = Buffer.concat([
        Buffer.from(header, 'utf8'),
        fileBuffer,
        Buffer.from(footer, 'utf8')
    ]);

    const response = await fetchImpl(`${UPLOAD_URL}?access_token=${encodeURIComponent(accessToken)}&type=image`, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body
    });

    if (!response.ok) {
        throw new Error(`上传图片失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errcode) {
        throw new Error(`上传图片失败: ${data.errmsg || data.errcode}`);
    }

    if (!data.media_id) {
        throw new Error('上传图片成功但缺少 media_id');
    }

    return data;
}

async function publishDraft({ accessToken, article, fetchImpl = fetch }) {
    const response = await fetchImpl(`${DRAFT_URL}?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            articles: [
                {
                    title: article.title,
                    author: article.author || undefined,
                    digest: article.digest || undefined,
                    content: article.content,
                    thumb_media_id: article.thumbMediaId,
                    need_open_comment: 1,
                    only_fans_can_comment: 0
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`发布草稿失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errcode) {
        throw new Error(`发布草稿失败: ${data.errmsg || data.errcode}`);
    }

    return data;
}

function createWechatPublisher(options = {}) {
    const appId = options.appId || process.env.WECHAT_APP_ID || '';
    const appSecret = options.appSecret || process.env.WECHAT_APP_SECRET || '';
    const defaultAuthor = options.defaultAuthor || process.env.WECHAT_AUTOGEN_DEFAULT_AUTHOR || 'AIcoming';
    const defaultCoverImage = options.defaultCoverImage || process.env.WECHAT_AUTOGEN_DEFAULT_COVER_IMAGE || '';
    const fetchImpl = options.fetchImpl || fetch;

    if (!appId || !appSecret) {
        throw new Error('缺少 WECHAT_APP_ID 或 WECHAT_APP_SECRET');
    }

    return {
        async publishMarkdownDraft(payload) {
            const accessToken = await fetchAccessToken({ appId, appSecret, fetchImpl });
            const coverImagePath = payload.coverImagePath || defaultCoverImage;
            if (!coverImagePath) {
                throw new Error('缺少微信公众号默认封面图配置');
            }

            const coverUpload = await uploadImage({
                accessToken,
                imagePath: coverImagePath,
                fetchImpl
            });

            return publishDraft({
                accessToken,
                article: {
                    title: payload.title,
                    author: payload.author || defaultAuthor,
                    digest: payload.digest || '',
                    content: renderMarkdownToHtml(payload.markdown),
                    thumbMediaId: coverUpload.media_id
                },
                fetchImpl
            });
        }
    };
}

module.exports = {
    createWechatPublisher,
    fetchAccessToken,
    publishDraft,
    renderMarkdownToHtml,
    uploadImage
};
