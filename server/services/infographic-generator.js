'use strict';

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DEFAULT_TOKENGO_BASE_URL = 'https://ai.ssgoo.net';
const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1536';
const DEFAULT_IMAGE_QUALITY = 'high';
const DEFAULT_OUTPUT_FORMAT = 'png';
const DEFAULT_OUTPUT_COMPRESSION = 80;
const DEFAULT_RESPONSE_FORMAT = 'url';
const DEFAULT_INPUT_FIDELITY = 'high';
const DEFAULT_TIMEOUT_MS = 600000;
const MAX_WECHAT_IMAGE_BYTES = 1024 * 1024;
const DEFAULT_REFERENCE_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'wechat-newspic-reference.png');
const IMAGE_PROMPT_PREFIX = '请参考图中的报纸式日报样式，编辑生成一幅高质量中文 AI 日报一览图，采用竖版报纸版式、深蓝标题栏、黑白细线分栏和高信息密度。';
const NEWS_IMAGE_WIDTH = 1024;
const NEWS_IMAGE_HEIGHT = 1536;

function buildImagePromptSystemMessage() {
    return IMAGE_PROMPT_PREFIX;
}

function buildImagePrompt(prompt) {
    return `${IMAGE_PROMPT_PREFIX}\n\n${String(prompt || '').trim()}`;
}

function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatOverlayDate(date) {
    const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return String(date || '').trim();
    }
    return `${match[1]}.${match[2]}.${match[3]}`;
}

function formatOverlayChineseDate(date) {
    const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return String(date || '').trim();
    }
    return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

function formatOverlayWeekday(date) {
    const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return '';
    }
    const weekday = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00+08:00`).getDay();
    return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][weekday];
}

function measureDisplayUnits(text) {
    return Array.from(String(text || '')).reduce((total, char) => total + (/[\x00-\x7F]/.test(char) ? 1 : 2), 0);
}

function wrapDisplayText(text, maxUnits, maxLines) {
    const words = String(text || '')
        .replace(/\s+/g, ' ')
        .trim()
        .match(/[A-Za-z0-9.+#/_-]+|[\u4e00-\u9fff]|[^\s]/g) || [];
    const lines = [];
    let current = '';

    for (const token of words) {
        const joiner = current && /^[A-Za-z0-9.+#/_-]+$/.test(token) && /[A-Za-z0-9.+#/_-]$/.test(current) ? ' ' : '';
        const next = `${current}${joiner}${token}`;
        if (current && measureDisplayUnits(next) > maxUnits) {
            lines.push(current);
            current = token;
            if (lines.length >= maxLines) {
                break;
            }
        } else {
            current = next;
        }
    }

    if (current && lines.length < maxLines) {
        lines.push(current);
    }

    if (lines.length > 0 && words.join('').length > lines.join('').length) {
        const lastIndex = lines.length - 1;
        lines[lastIndex] = `${lines[lastIndex].replace(/[，。；、:：,.!?！？\s]+$/g, '')}...`;
    }

    return lines;
}

function parseNewspicContent(content) {
    return String(content || '')
        .split(/\n\s*\n/)
        .map((block) => block.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((block, index) => {
            const match = block.match(/^(\d+)\.\s*(.*?)[：:]\s*(.+)$/);
            if (!match) {
                return {
                    number: String(index + 1),
                    title: block,
                    keyPoint: ''
                };
            }
            return {
                number: match[1],
                title: match[2].trim(),
                keyPoint: match[3].trim()
            };
        });
}

function renderTextLines(lines, { x, y, fontSize, lineHeight, fill, weight = 400 }) {
    const tspans = lines.map((line, index) => (
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )).join('');
    return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${weight}" fill="${fill}">${tspans}</text>`;
}

function buildDailyNewspicOverlaySvg({ date, content }) {
    const items = parseNewspicContent(content);
    const cards = items.map((item, index) => {
        const column = index % 5;
        const row = Math.floor(index / 5);
        const x = 18 + column * 198;
        const y = 366 + row * 384;
        const titleLines = wrapDisplayText(item.title, 12, 3);
        const keyPointLines = wrapDisplayText(item.keyPoint, 15, titleLines.length > 2 ? 5 : 6);

        return [
            `<rect x="${x}" y="${y}" width="190" height="360" fill="#fffdf8" stroke="#9aa3b2" stroke-width="1"/>`,
            `<rect x="${x + 8}" y="${y + 8}" width="26" height="28" fill="#082345"/>`,
            `<text x="${x + 21}" y="${y + 29}" text-anchor="middle" font-size="22" font-weight="900" fill="#ffffff">${escapeXml(item.number)}</text>`,
            renderTextLines(titleLines, {
                x: x + 42,
                y: y + 30,
                fontSize: 21,
                lineHeight: 27,
                fill: '#080808',
                weight: 900
            }),
            `<line x1="${x + 10}" y1="${y + 118}" x2="${x + 180}" y2="${y + 118}" stroke="#c9ced8" stroke-width="1"/>`,
            renderTextLines(keyPointLines, {
                x: x + 12,
                y: y + 150,
                fontSize: 16,
                lineHeight: 25,
                fill: '#101010',
                weight: 500
            }),
            `<rect x="${x + 12}" y="${y + 288}" width="166" height="52" rx="6" fill="#f4f7fb" stroke="#b8c0cc" stroke-width="1"/>`,
            `<line x1="${x + 26}" y1="${y + 323}" x2="${x + 92}" y2="${y + 304}" stroke="#082345" stroke-width="4"/>`,
            `<circle cx="${x + 110}" cy="${y + 311}" r="18" fill="#0b4aae" opacity="0.88"/>`,
            `<circle cx="${x + 145}" cy="${y + 311}" r="14" fill="#d12d28" opacity="0.9"/>`
        ].join('\n');
    }).join('\n');

    return Buffer.from(`
<svg width="${NEWS_IMAGE_WIDTH}" height="${NEWS_IMAGE_HEIGHT}" viewBox="0 0 ${NEWS_IMAGE_WIDTH} ${NEWS_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", Arial, sans-serif; }
  </style>
  <rect width="1024" height="1536" fill="#f8f5ee" opacity="0.97"/>
  <rect x="10" y="12" width="1004" height="1512" fill="none" stroke="#082345" stroke-width="1.4"/>
  <rect x="18" y="20" width="188" height="54" fill="#082345"/>
  <text x="40" y="59" font-size="38" font-weight="900" fill="#ffffff">AI 日报</text>
  <text x="38" y="98" font-size="18" font-weight="700" fill="#080808">人工智能行业动态</text>
  <text x="34" y="122" font-size="17" font-weight="700" fill="#080808">10条要点 · 每日精选</text>
  <rect x="22" y="134" width="174" height="54" rx="7" fill="#f8fbff" stroke="#082345" stroke-width="1.4"/>
  <text x="38" y="167" font-size="22" font-weight="900" fill="#0b4aae">小元说 AI日报</text>
  <line x1="210" y1="20" x2="210" y2="200" stroke="#9aa3b2" stroke-width="1"/>
  <text x="225" y="125" font-size="104" font-weight="900" fill="#082345">AI生存指南</text>
  <text x="232" y="184" font-size="18" font-weight="700" fill="#101010">洞察 AI 前沿 · 把握技术趋势 · 提升认知效率 · AI 时代生存与进化</text>
  <line x1="846" y1="20" x2="846" y2="200" stroke="#9aa3b2" stroke-width="1"/>
  <text x="858" y="58" font-size="21" font-weight="900" fill="#d12d28">${escapeXml(formatOverlayChineseDate(date))}</text>
  <text x="858" y="80" font-size="15" font-weight="800" fill="#d12d28">${escapeXml(formatOverlayDate(date))}</text>
  <text x="892" y="98" font-size="26" font-weight="900" fill="#080808">${escapeXml(formatOverlayWeekday(date))}</text>
  <line x1="858" y1="118" x2="1000" y2="118" stroke="#9aa3b2" stroke-width="1"/>
  <text x="858" y="152" font-size="18" font-weight="800" fill="#080808">第 ${escapeXml(String(date || '').replace(/-/g, ''))} 期</text>
  <rect x="858" y="166" width="142" height="34" fill="#082345"/>
  <text x="874" y="190" font-size="19" font-weight="900" fill="#ffffff">今日要闻速览</text>
  <line x1="10" y1="222" x2="1014" y2="222" stroke="#082345" stroke-width="3"/>
  <line x1="10" y1="230" x2="1014" y2="230" stroke="#082345" stroke-width="1"/>
  <text x="28" y="300" font-size="40" font-weight="900" fill="#080808">AI 竞争进入新阶段：从模型、数据到落地与生态</text>
  <text x="206" y="340" font-size="24" font-weight="800" fill="#080808">资本逻辑、技术突破、成本战与具身智能全面升级</text>
  <line x1="18" y1="354" x2="1006" y2="354" stroke="#082345" stroke-width="1"/>
  ${cards}
  <line x1="18" y1="1136" x2="1006" y2="1136" stroke="#082345" stroke-width="1.2"/>
  <rect x="18" y="1152" width="82" height="188" fill="#082345"/>
  <text x="47" y="1218" font-size="31" font-weight="900" fill="#ffffff">两条</text>
  <text x="47" y="1276" font-size="31" font-weight="900" fill="#ffffff">生存</text>
  <text x="47" y="1334" font-size="31" font-weight="900" fill="#ffffff">智慧</text>
  <text x="130" y="1180" font-size="22" font-weight="900" fill="#080808">第一件：从模型能力到业务落地</text>
  <text x="130" y="1218" font-size="17" font-weight="600" fill="#101010">不要只看模型强弱，要看技术能否进入真实场景。</text>
  <rect x="122" y="1242" width="390" height="76" rx="6" fill="#fffdf8" stroke="#9aa3b2"/>
  <text x="142" y="1276" font-size="18" font-weight="800" fill="#082345">行动指南：找到高频、具体、可验证的环节</text>
  <text x="560" y="1180" font-size="22" font-weight="900" fill="#080808">第二件：从数据与成本说起</text>
  <text x="560" y="1218" font-size="17" font-weight="600" fill="#101010">高质量数据与低成本推理，决定产品能否规模化。</text>
  <rect x="552" y="1242" width="430" height="76" rx="6" fill="#fffdf8" stroke="#9aa3b2"/>
  <text x="572" y="1276" font-size="18" font-weight="800" fill="#082345">行动指南：沉淀可复用数据资产，优先验证 ROI</text>
  <line x1="18" y1="1366" x2="1006" y2="1366" stroke="#082345" stroke-width="1.2"/>
  <rect x="18" y="1384" width="82" height="82" fill="#082345"/>
  <text x="38" y="1420" font-size="29" font-weight="900" fill="#ffffff">今日</text>
  <text x="38" y="1458" font-size="29" font-weight="900" fill="#ffffff">结论</text>
  <text x="125" y="1432" font-size="18" font-weight="800" fill="#080808">资本：从模型能力转向变现能力</text>
  <text x="390" y="1432" font-size="18" font-weight="800" fill="#080808">数据：从辅助资源变成战略资产</text>
  <text x="672" y="1432" font-size="18" font-weight="800" fill="#080808">成本：进入低价时代，应用门槛下降</text>
  <line x1="18" y1="1486" x2="1006" y2="1486" stroke="#9aa3b2" stroke-width="1"/>
  <text x="20" y="1514" font-size="17" font-weight="700" fill="#101010">出品：小元说 AI</text>
  <text x="250" y="1514" font-size="17" font-weight="700" fill="#101010">让复杂的 AI 信息，变得简单、实用、有价值</text>
  <text x="650" y="1514" font-size="15" font-weight="600" fill="#101010">信息来源：公开资料整理，仅供参考</text>
</svg>`);
}

async function createDailyNewspicFallbackBackground({ compressImage = compressImageForWechat } = {}) {
    const svg = Buffer.from(`
<svg width="${NEWS_IMAGE_WIDTH}" height="${NEWS_IMAGE_HEIGHT}" viewBox="0 0 ${NEWS_IMAGE_WIDTH} ${NEWS_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="100%" stop-color="#f1eee6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1536" fill="url(#paper)"/>
  <g opacity="0.18" stroke="#082345" stroke-width="1">
    <path d="M20 224 H1004"/>
    <path d="M20 356 H1004"/>
    <path d="M20 1138 H1004"/>
    <path d="M20 1368 H1004"/>
    <path d="M210 20 V200"/>
    <path d="M846 20 V200"/>
  </g>
  <g opacity="0.10" fill="#082345">
    <rect x="18" y="20" width="188" height="54"/>
    <rect x="858" y="166" width="142" height="34"/>
    <rect x="18" y="1152" width="82" height="188"/>
    <rect x="18" y="1384" width="82" height="82"/>
  </g>
</svg>`);
    const buffer = await sharp(svg)
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
    return ensureWechatImageSize(buffer, compressImage);
}

async function composeDailyNewspicImage({ backgroundBuffer, date, content, compressImage = compressImageForWechat }) {
    const overlaySvg = buildDailyNewspicOverlaySvg({ date, content });
    const composed = await sharp(backgroundBuffer)
        .rotate()
        .resize(NEWS_IMAGE_WIDTH, NEWS_IMAGE_HEIGHT, { fit: 'cover' })
        .modulate({ brightness: 1.02, saturation: 0.84 })
        .composite([{ input: overlaySvg, top: 0, left: 0 }])
        .jpeg({ quality: 84, mozjpeg: true })
        .toBuffer();

    return ensureWechatImageSize(composed, compressImage);
}

async function compressImageForWechat(imageBuffer) {
    const attempts = [
        { width: 1280, quality: 72 },
        { width: 1024, quality: 60 }
    ];

    for (const attempt of attempts) {
        const compressed = await sharp(imageBuffer)
            .rotate()
            .resize({
                width: attempt.width,
                height: 1536,
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: attempt.quality, mozjpeg: true })
            .toBuffer();
        if (compressed.length <= MAX_WECHAT_IMAGE_BYTES) {
            return compressed;
        }
    }

    throw new Error('生成图片压缩后仍超过微信 1MB 限制');
}

async function ensureWechatImageSize(imageBuffer, compressImage) {
    if (imageBuffer.length <= MAX_WECHAT_IMAGE_BYTES) {
        return imageBuffer;
    }

    const compressed = await compressImage(imageBuffer);
    if (!Buffer.isBuffer(compressed) || compressed.length > MAX_WECHAT_IMAGE_BYTES) {
        throw new Error('生成图片压缩后仍超过微信 1MB 限制');
    }
    return compressed;
}

function clampCompression(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : fallback;
}

function readReferenceImageBuffer(config) {
    if (Buffer.isBuffer(config.referenceImageBuffer) && config.referenceImageBuffer.length > 0) {
        return config.referenceImageBuffer;
    }

    const referenceImagePath = config.referenceImagePath
        || process.env.TOKENGO_IMAGE_REFERENCE_PATH
        || DEFAULT_REFERENCE_IMAGE_PATH;
    const imageBuffer = fs.readFileSync(referenceImagePath);
    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
        throw new Error(`日报参考图为空: ${referenceImagePath}`);
    }
    return imageBuffer;
}

function createInfographicGenerator({ config = {}, fetchImpl = fetch, compressImage = compressImageForWechat } = {}) {
    const tokenGoApiKey = config.tokenGoApiKey ?? process.env.TOKENGO_API_KEY ?? '';
    const tokenGoBaseUrl = String(
        config.tokenGoBaseUrl ?? process.env.TOKENGO_API_BASE_URL ?? DEFAULT_TOKENGO_BASE_URL
    ).replace(/\/+$/, '');
    const model = config.model || process.env.TOKENGO_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
    const size = config.size || process.env.TOKENGO_IMAGE_SIZE || DEFAULT_IMAGE_SIZE;
    const quality = config.quality || process.env.TOKENGO_IMAGE_QUALITY || DEFAULT_IMAGE_QUALITY;
    const outputFormat = config.outputFormat || process.env.TOKENGO_IMAGE_OUTPUT_FORMAT || DEFAULT_OUTPUT_FORMAT;
    const outputCompression = clampCompression(
        config.outputCompression ?? process.env.TOKENGO_IMAGE_OUTPUT_COMPRESSION,
        DEFAULT_OUTPUT_COMPRESSION
    );
    const responseFormat = config.responseFormat || process.env.TOKENGO_IMAGE_RESPONSE_FORMAT || DEFAULT_RESPONSE_FORMAT;
    const inputFidelity = config.inputFidelity || process.env.TOKENGO_IMAGE_INPUT_FIDELITY || DEFAULT_INPUT_FIDELITY;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || process.env.INFOGRAPHIC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));

    return {
        async generateInfographic({ prompt }) {
            if (!tokenGoApiKey) {
                throw new Error('缺少 TOKENGO_API_KEY，无法生成日报一览图');
            }
            if (!tokenGoBaseUrl) {
                throw new Error('缺少 TOKENGO_API_BASE_URL，无法生成日报一览图');
            }

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const referenceImageBuffer = readReferenceImageBuffer(config);
                const requestBody = new FormData();
                requestBody.append('model', model);
                requestBody.append('prompt', buildImagePrompt(prompt));
                requestBody.append('image', new Blob([referenceImageBuffer], { type: 'image/png' }), 'wechat-newspic-reference.png');
                requestBody.append('size', size);
                requestBody.append('quality', quality);
                requestBody.append('output_format', outputFormat);
                requestBody.append('response_format', responseFormat);
                requestBody.append('input_fidelity', inputFidelity);
                if (outputFormat === 'jpeg') {
                    requestBody.append('output_compression', String(outputCompression));
                }

                const response = await fetchImpl(`${tokenGoBaseUrl}/v1/images/edits`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${tokenGoApiKey}`
                    },
                    body: requestBody,
                    signal: controller.signal
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data?.error?.message || `生成日报一览图失败: HTTP ${response.status}`);
                }

                const firstImage = data?.data?.[0];
                let imageBuffer;
                if (typeof firstImage?.b64_json === 'string' && firstImage.b64_json) {
                    imageBuffer = Buffer.from(firstImage.b64_json, 'base64');
                } else if (typeof firstImage?.url === 'string' && firstImage.url) {
                    const imageResponse = await fetchImpl(firstImage.url, {
                        method: 'GET',
                        signal: controller.signal
                    });
                    if (!imageResponse.ok) {
                        throw new Error(`下载生成图像失败: HTTP ${imageResponse.status}`);
                    }
                    imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                } else {
                    throw new Error('TokenGo Images API 未返回有效的图片 URL 或 b64_json');
                }

                return ensureWechatImageSize(imageBuffer, compressImage);
            } finally {
                clearTimeout(timer);
            }
        }
    };
}

module.exports = {
    buildImagePrompt,
    buildImagePromptSystemMessage,
    buildDailyNewspicOverlaySvg,
    composeDailyNewspicImage,
    createDailyNewspicFallbackBackground,
    createInfographicGenerator
};
