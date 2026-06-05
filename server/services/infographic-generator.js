'use strict';

const sharp = require('sharp');

const DEFAULT_TOKENGO_BASE_URL = 'https://ai.ssgoo.net';
const DEFAULT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_IMAGE_QUALITY = 'high';
const DEFAULT_OUTPUT_FORMAT = 'jpeg';
const DEFAULT_OUTPUT_COMPRESSION = 80;
const DEFAULT_RESPONSE_FORMAT = 'url';
const DEFAULT_TIMEOUT_MS = 600000;
const MAX_WECHAT_IMAGE_BYTES = 1024 * 1024;
const IMAGE_PROMPT_PREFIX = '请生成一幅高质量中文 AI 日报一览图，图片为主要展示内容，方形 1:1 构图。';
const NEWS_IMAGE_WIDTH = 1024;
const NEWS_IMAGE_HEIGHT = 1024;

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

function measureDisplayUnits(text) {
    return Array.from(String(text || '')).reduce((total, char) => total + (/[\x00-\x7F]/.test(char) ? 1 : 2), 0);
}

function wrapDisplayText(text, maxUnits, maxLines) {
    const words = Array.from(String(text || '').replace(/\s+/g, ' ').trim());
    const lines = [];
    let current = '';

    for (const char of words) {
        const next = `${current}${char}`;
        if (current && measureDisplayUnits(next) > maxUnits) {
            lines.push(current);
            current = char;
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
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = 54 + column * 468;
        const y = 150 + row * 162;
        const titleLines = wrapDisplayText(item.title, 34, 2);
        const keyPointLines = wrapDisplayText(item.keyPoint, 40, titleLines.length > 1 ? 2 : 3);

        return [
            `<rect x="${x}" y="${y}" width="448" height="146" rx="24" fill="rgba(8,14,36,0.72)" stroke="rgba(160,190,255,0.36)" stroke-width="1.2"/>`,
            `<circle cx="${x + 35}" cy="${y + 36}" r="20" fill="#7c3aed"/>`,
            `<text x="${x + 35}" y="${y + 43}" text-anchor="middle" font-size="20" font-weight="800" fill="#ffffff">${escapeXml(item.number)}</text>`,
            renderTextLines(titleLines, {
                x: x + 68,
                y: y + 34,
                fontSize: 21,
                lineHeight: 26,
                fill: '#ffffff',
                weight: 800
            }),
            renderTextLines(keyPointLines, {
                x: x + 26,
                y: y + 88,
                fontSize: 17,
                lineHeight: 23,
                fill: '#dbeafe',
                weight: 500
            })
        ].join('\n');
    }).join('\n');

    return Buffer.from(`
<svg width="${NEWS_IMAGE_WIDTH}" height="${NEWS_IMAGE_HEIGHT}" viewBox="0 0 ${NEWS_IMAGE_WIDTH} ${NEWS_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", Arial, sans-serif; }
  </style>
  <rect width="1024" height="1024" fill="rgba(3,7,18,0.42)"/>
  <rect x="34" y="32" width="956" height="960" rx="38" fill="rgba(4,10,28,0.38)" stroke="rgba(255,255,255,0.18)" stroke-width="1.4"/>
  <text x="58" y="88" font-size="44" font-weight="900" fill="#ffffff">小元说 AI日报</text>
  <text x="58" y="122" font-size="22" font-weight="600" fill="#bfdbfe">${escapeXml(formatOverlayDate(date))}</text>
  <text x="810" y="92" font-size="20" font-weight="700" fill="#c4b5fd">10 条核心信息</text>
  <line x1="58" y1="132" x2="966" y2="132" stroke="rgba(191,219,254,0.42)" stroke-width="1"/>
  ${cards}
    </svg>`);
}

async function createDailyNewspicFallbackBackground({ compressImage = compressImageForWechat } = {}) {
    const svg = Buffer.from(`
<svg width="${NEWS_IMAGE_WIDTH}" height="${NEWS_IMAGE_HEIGHT}" viewBox="0 0 ${NEWS_IMAGE_WIDTH} ${NEWS_IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06112f"/>
      <stop offset="48%" stop-color="#27135f"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glow1" cx="22%" cy="18%" r="58%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="82%" cy="30%" r="54%">
      <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.54"/>
      <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow1)"/>
  <rect width="1024" height="1024" fill="url(#glow2)"/>
  <g opacity="0.16" stroke="#bfdbfe" stroke-width="1">
    <path d="M80 220 C260 80 410 250 570 120 S850 100 970 210" fill="none"/>
    <path d="M30 770 C220 620 360 840 540 690 S820 650 990 800" fill="none"/>
    <path d="M120 110 L910 910" />
    <path d="M930 130 L120 920" />
  </g>
  <g opacity="0.22" fill="#ffffff">
    <circle cx="150" cy="180" r="3"/>
    <circle cx="860" cy="180" r="4"/>
    <circle cx="760" cy="780" r="3"/>
    <circle cx="270" cy="850" r="4"/>
    <circle cx="520" cy="120" r="2.5"/>
    <circle cx="920" cy="610" r="2.5"/>
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
        .modulate({ brightness: 0.64, saturation: 0.9 })
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
                const requestBody = {
                    model,
                    prompt: buildImagePrompt(prompt),
                    size,
                    quality,
                    output_format: outputFormat,
                    response_format: responseFormat,
                    n: 1
                };
                if (outputFormat === 'jpeg') {
                    requestBody.output_compression = outputCompression;
                }

                const response = await fetchImpl(`${tokenGoBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${tokenGoApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
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
