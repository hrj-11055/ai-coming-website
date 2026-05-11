const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let baoyuMd = null;
try {
    baoyuMd = require('baoyu-md');
} catch (_) {
    // baoyu-md not installed; will fall back to legacy renderer
}

const TOKEN_URL = 'https://api.weixin.qq.com/cgi-bin/token';
const UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/material/add_material';
const TEMP_MEDIA_UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/media/upload';
const DRAFT_URL = 'https://api.weixin.qq.com/cgi-bin/draft/add';
const PREVIEW_URL = 'https://api.weixin.qq.com/cgi-bin/message/mass/preview';
const SENDALL_URL = 'https://api.weixin.qq.com/cgi-bin/message/mass/sendall';
const NEWS_IMAGE_UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg';

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderInlineMarkdownLegacy(text) {
    let output = escapeHtml(text);
    output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a style="color:#576b95;text-decoration:none;border-bottom:1px solid #576b95;" href="$2">$1</a>');
    output = output.replace(/(?<![="])(https?:\/\/[^\s<]+)/g, '<a style="color:#576b95;text-decoration:none;border-bottom:1px solid #576b95;" href="$1">$1</a>');
    return output;
}

function renderMarkdownToHtmlLegacy(markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let currentList = null;

    const STYLE = {
        section: 'font-family:Optima-Regular,Optima,PingFangSC-light,PingFangTC-light,"PingFang SC",Cambria,Georgia,serif;color:#353535;line-height:1.75;font-size:16px;letter-spacing:0.8px;word-spacing:0.8px;padding:8px 4px;',
        h2: 'font-size:18px;font-weight:700;color:#222;margin:24px 10px 0 0;padding-left:10px;border-left:5px solid rgb(248,57,41);',
        h3: 'font-size:17px;font-weight:700;color:#353535;margin:24px 0 8px;display:inline-block;background:linear-gradient(#fff 60%,rgba(221,221,221,0.4) 40%);padding:2px 13px 2px 0;',
        h4: 'font-size:16px;font-weight:700;color:#353535;margin:16px 0 4px;display:inline-block;padding-left:10px;border-left:5px solid #DEC6FB;',
        p: 'margin:0.8em 0;font-size:16px;color:#353535;line-height:1.75;',
        blockquote: 'border-left:4px solid #ddd;margin:1.2em 0;padding:0.5em 1em;color:#888;font-size:15px;',
        hr: 'border:none;border-top:1px solid #eee;margin:1.5em 0;',
        ul: 'margin:0.5em 0;padding-left:1.5em;color:#353535;line-height:1.75;',
        li: 'margin:0.3em 0;'
    };

    function flushList() {
        if (currentList && currentList.length > 0) {
            blocks.push(`<ul style="${STYLE.ul}">${currentList.join('')}</ul>`);
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
            currentList.push(`<li style="${STYLE.li}">${renderInlineMarkdownLegacy(line.replace(/^-\s+/, ''))}</li>`);
            return;
        }

        flushList();

        if (/^#\s+/.test(line)) {
            blocks.push(`<h2 style="${STYLE.h2}">${renderInlineMarkdownLegacy(line.replace(/^#\s+/, ''))}</h2>`);
            return;
        }

        if (/^##\s+/.test(line)) {
            blocks.push(`<h2 style="${STYLE.h2}">${renderInlineMarkdownLegacy(line.replace(/^##\s+/, ''))}</h2>`);
            return;
        }

        if (/^###\s+/.test(line)) {
            blocks.push(`<h3 style="${STYLE.h3}">${renderInlineMarkdownLegacy(line.replace(/^###\s+/, ''))}</h3>`);
            return;
        }

        if (/^####\s+/.test(line)) {
            blocks.push(`<h4 style="${STYLE.h4}">${renderInlineMarkdownLegacy(line.replace(/^####\s+/, ''))}</h4>`);
            return;
        }

        if (/^-{3,}$/.test(line)) {
            blocks.push(`<hr style="${STYLE.hr}"/>`);
            return;
        }

        if (/^>\s+/.test(line)) {
            blocks.push(`<blockquote style="${STYLE.blockquote}">${renderInlineMarkdownLegacy(line.replace(/^>\s+/, ''))}</blockquote>`);
            return;
        }

        blocks.push(`<p style="${STYLE.p}">${renderInlineMarkdownLegacy(line)}</p>`);
    });

    flushList();

    return [
        `<section style="${STYLE.section}">`,
        blocks.join('\n'),
        '</section>'
    ].join('\n');
}

async function renderMarkdownToHtml(markdown, options = {}) {
    if (!baoyuMd) {
        return renderMarkdownToHtmlLegacy(markdown);
    }

    const theme = options.theme || process.env.WECHAT_MD_THEME || 'default';
    const primaryColor = options.primaryColor || process.env.WECHAT_MD_COLOR || '#0F4C81';

    const result = await baoyuMd.renderMarkdownDocument(String(markdown || ''), {
        theme,
        primaryColor,
        keepTitle: true,
        fontFamily: options.fontFamily || process.env.WECHAT_MD_FONT_FAMILY,
        fontSize: options.fontSize || process.env.WECHAT_MD_FONT_SIZE
    });

    const bodyMatch = result.html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    return bodyMatch ? bodyMatch[1].trim() : result.html;
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
        case '.mp3':
            return 'audio/mpeg';
        case '.amr':
            return 'audio/amr';
        case '.wav':
            return 'audio/wav';
        case '.m4a':
            return 'audio/mp4';
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

function buildMultipartBody({ fieldName, fileName, mimeType, fileBuffer }) {
    const boundary = `----wechat-boundary-${Date.now().toString(16)}-${crypto.randomBytes(4).toString('hex')}`;
    const header = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"`,
        `Content-Type: ${mimeType}`,
        '',
        ''
    ].join('\r\n');
    const footer = `\r\n--${boundary}--\r\n`;

    return {
        boundary,
        body: Buffer.concat([
            Buffer.from(header, 'utf8'),
            fileBuffer,
            Buffer.from(footer, 'utf8')
        ])
    };
}

async function uploadMultipartMedia({ url, fileName, mimeType, fileBuffer, fetchImpl = fetch }) {
    const { boundary, body } = buildMultipartBody({
        fieldName: 'media',
        fileName,
        mimeType,
        fileBuffer
    });

    const response = await fetchImpl(url, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body
    });

    return response;
}

function readLocalFileBuffer(filePath, missingMessagePrefix) {
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`${missingMessagePrefix}: ${resolvedPath}`);
    }

    return {
        resolvedPath,
        fileBuffer: fs.readFileSync(resolvedPath)
    };
}

async function uploadImage({ accessToken, imagePath, fetchImpl = fetch }) {
    const { resolvedPath, fileBuffer } = readLocalFileBuffer(imagePath, '封面图不存在');
    const fileName = path.basename(resolvedPath);
    const response = await uploadMultipartMedia({
        url: `${UPLOAD_URL}?access_token=${encodeURIComponent(accessToken)}&type=image`,
        fileName,
        mimeType: getMimeType(resolvedPath),
        fileBuffer,
        fetchImpl
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

async function uploadVoice({
    accessToken,
    audioPath,
    audioUrl,
    audioBuffer,
    fileBuffer,
    fileName,
    fetchImpl = fetch
}) {
    let resolvedFileName = fileName || 'podcast.mp3';
    let resolvedMimeType = getMimeType(resolvedFileName);
    let resolvedBuffer = audioBuffer || fileBuffer;

    if (!resolvedBuffer) {
        if (audioPath) {
            const local = readLocalFileBuffer(audioPath, '音频文件不存在');
            resolvedFileName = fileName || path.basename(local.resolvedPath);
            resolvedMimeType = getMimeType(local.resolvedPath);
            resolvedBuffer = local.fileBuffer;
        } else if (audioUrl) {
            const response = await fetchImpl(audioUrl);
            if (!response.ok) {
                throw new Error(`下载音频失败: HTTP ${response.status}`);
            }
            resolvedBuffer = Buffer.from(await response.arrayBuffer());
            resolvedFileName = fileName || path.basename(new URL(audioUrl).pathname || 'podcast.mp3');
            resolvedMimeType = getMimeType(resolvedFileName);
        } else {
            throw new Error('缺少音频文件或音频地址');
        }
    }

    const response = await uploadMultipartMedia({
        url: `${TEMP_MEDIA_UPLOAD_URL}?access_token=${encodeURIComponent(accessToken)}&type=voice`,
        fileName: resolvedFileName,
        mimeType: resolvedMimeType,
        fileBuffer: resolvedBuffer,
        fetchImpl
    });

    if (!response.ok) {
        throw new Error(`上传语音素材失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errcode) {
        throw new Error(`上传语音素材失败: ${data.errmsg || data.errcode}`);
    }

    if (!data.media_id) {
        throw new Error('上传语音素材成功但缺少 media_id');
    }

    return data;
}

async function uploadNewsImage({ accessToken, imageBuffer, fetchImpl = fetch }) {
    const { boundary, body } = buildMultipartBody({
        fieldName: 'media',
        fileName: 'infographic.png',
        mimeType: 'image/png',
        fileBuffer: imageBuffer
    });

    const response = await fetchImpl(
        `${NEWS_IMAGE_UPLOAD_URL}?access_token=${encodeURIComponent(accessToken)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body
        }
    );

    if (!response.ok) {
        throw new Error(`上传正文图片失败: HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    if (data.errcode) {
        throw new Error(`上传正文图片失败: ${data.errmsg || data.errcode}`);
    }
    if (!data.url) {
        throw new Error('上传正文图片成功但缺少 url');
    }

    return data.url;
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

async function publishPreviewVoice({
    accessToken,
    mediaId,
    openId,
    wxName,
    fetchImpl = fetch
}) {
    const body = {
        msgtype: 'voice',
        voice: {
            media_id: mediaId
        }
    };

    if (openId) {
        body.touser = openId;
    } else if (wxName) {
        body.towxname = wxName;
    } else {
        throw new Error('语音预览缺少 openId 或 wxName');
    }

    const response = await fetchImpl(`${PREVIEW_URL}?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`预览语音消息失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errcode) {
        throw new Error(`预览语音消息失败: ${data.errmsg || data.errcode}`);
    }

    return data;
}

async function publishSendAllVoice({
    accessToken,
    mediaId,
    tagId,
    sendToAll = true,
    fetchImpl = fetch
}) {
    if (!sendToAll && (tagId === '' || tagId === null || tagId === undefined)) {
        throw new Error('定向群发语音消息缺少 tagId');
    }

    const filter = sendToAll
        ? { is_to_all: true }
        : { is_to_all: false, tag_id: Number(tagId) };

    const response = await fetchImpl(`${SENDALL_URL}?access_token=${encodeURIComponent(accessToken)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filter,
            voice: {
                media_id: mediaId
            },
            msgtype: 'voice'
        })
    });

    if (!response.ok) {
        throw new Error(`群发语音消息失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.errcode) {
        throw new Error(`群发语音消息失败: ${data.errmsg || data.errcode}`);
    }

    return data;
}

function createWechatPublisher(options = {}) {
    const appId = options.appId || process.env.WECHAT_APP_ID || '';
    const appSecret = options.appSecret || process.env.WECHAT_APP_SECRET || '';
    const defaultAuthor = options.defaultAuthor || process.env.WECHAT_AUTOGEN_DEFAULT_AUTHOR || 'AIcoming';
    const defaultCoverImage = options.defaultCoverImage || process.env.WECHAT_AUTOGEN_DEFAULT_COVER_IMAGE || '';
    const audioSendMode = String(options.audioSendMode || process.env.WECHAT_AUTOGEN_AUDIO_SEND_MODE || 'sendall').toLowerCase();
    const audioTagId = options.audioTagId ?? process.env.WECHAT_AUTOGEN_AUDIO_TAG_ID ?? '';
    const audioSendToAll = String(options.audioSendToAll ?? process.env.WECHAT_AUTOGEN_AUDIO_SEND_TO_ALL ?? 'true').toLowerCase() !== 'false';
    const audioPreviewOpenId = options.audioPreviewOpenId || process.env.WECHAT_AUTOGEN_AUDIO_PREVIEW_OPENID || '';
    const audioPreviewWxName = options.audioPreviewWxName || process.env.WECHAT_AUTOGEN_AUDIO_PREVIEW_WXNAME || '';
    const fetchImpl = options.fetchImpl || fetch;

    if (!appId || !appSecret) {
        throw new Error('缺少 WECHAT_APP_ID 或 WECHAT_APP_SECRET');
    }

    return {
        getAudioDeliveryFingerprint() {
            return crypto.createHash('sha1').update(JSON.stringify({
                audioSendMode,
                audioTagId,
                audioSendToAll,
                audioPreviewOpenId,
                audioPreviewWxName
            })).digest('hex');
        },
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
                    content: await renderMarkdownToHtml(payload.markdown),
                    thumbMediaId: coverUpload.media_id
                },
                fetchImpl
            });
        },
        async publishPodcastAudio(payload) {
            const accessToken = await fetchAccessToken({ appId, appSecret, fetchImpl });
            const voiceUpload = await uploadVoice({
                accessToken,
                audioPath: payload.audioPath,
                audioUrl: payload.audioUrl,
                audioBuffer: payload.audioBuffer,
                fileName: payload.fileName,
                fetchImpl
            });

            let deliveryResult;
            if (audioSendMode === 'preview') {
                deliveryResult = await publishPreviewVoice({
                    accessToken,
                    mediaId: voiceUpload.media_id,
                    openId: audioPreviewOpenId,
                    wxName: audioPreviewWxName,
                    fetchImpl
                });
            } else {
                deliveryResult = await publishSendAllVoice({
                    accessToken,
                    mediaId: voiceUpload.media_id,
                    tagId: audioTagId,
                    sendToAll: audioSendToAll,
                    fetchImpl
                });
            }

            return {
                ...deliveryResult,
                voice_media_id: voiceUpload.media_id,
                delivery_mode: audioSendMode
            };
        },
        async uploadNewsImageForContent({ imageBuffer }) {
            const accessToken = await fetchAccessToken({ appId, appSecret, fetchImpl });
            return uploadNewsImage({ accessToken, imageBuffer, fetchImpl });
        },
    };
}

module.exports = {
    createWechatPublisher,
    fetchAccessToken,
    publishDraft,
    publishPreviewVoice,
    publishSendAllVoice,
    renderMarkdownToHtml,
    renderMarkdownToHtmlLegacy,
    uploadImage,
    uploadNewsImage,
    uploadVoice
};
