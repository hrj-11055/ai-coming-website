const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');

function normalizeNewsPayload(rawData) {
    return Array.isArray(rawData) ? rawData : (rawData && Array.isArray(rawData.articles) ? rawData.articles : []);
}

function readJsonFileSafe(filePath, fallbackValue = []) {
    try {
        const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return normalizeNewsPayload(rawData);
    } catch (error) {
        return fallbackValue;
    }
}

function readMetadataFileSafe(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return null;
    }
}

function writeJsonFileSafe(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function isIsoDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeSpeechText(value) {
    return String(value || '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\[[^\]]+\]\([^)]+\)/g, '')
        .replace(/[`*_>#-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function pickArticleSummary(article) {
    return sanitizeSpeechText(article.summary || article.key_point || '');
}

function dedupeArticles(articles) {
    const seen = new Set();
    return articles.filter((article) => {
        const key = article.id || article.source_url || `${article.title || ''}-${article.published_at || ''}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function createContentHash(articles) {
    const payload = articles.map((article) => ({
        title: article.title || '',
        summary: article.summary || '',
        key_point: article.key_point || '',
        importance_score: article.importance_score || 0,
        published_at: article.published_at || '',
        created_at: article.created_at || ''
    }));

    return crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
}

function estimateDurationSeconds(script) {
    if (!script) {
        return null;
    }

    return Math.max(30, Math.round(script.length / 3.2));
}

function getOrdinalLabel(index) {
    const labels = ['第一条', '第二条', '第三条', '第四条', '第五条', '第六条'];
    return labels[index] || `第${index + 1}条`;
}

function buildPodcastSummary(date, articles) {
    if (!articles.length) {
        return `今天还没有可播报的 AI 资讯。`;
    }

    const topTitles = articles
        .slice(0, 3)
        .map((article) => sanitizeSpeechText(article.title))
        .filter(Boolean);

    if (!topTitles.length) {
        return `${date} 的 AI 资讯播客已准备，包含 ${articles.length} 条快讯。`;
    }

    return `今天共整理 ${articles.length} 条 AI 快讯，重点包括：${topTitles.join('；')}。`;
}

function buildPodcastScript(date, articles) {
    if (!articles.length) {
        return '';
    }

    const dateObj = new Date(`${date}T00:00:00`);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const intro = `欢迎收听 AIcoming ${month}月${day}日 AI 资讯播客。今天为你梳理 ${articles.length} 条值得关注的 AI 动态。`;
    const outro = '以上就是今天的 AI 资讯重点，感谢收听，我们下期再见。';
    const maxLength = 580;
    const segments = [intro];

    for (let index = 0; index < articles.length && segments.join('').length < maxLength - outro.length - 20; index++) {
        const article = articles[index];
        const title = sanitizeSpeechText(article.title);
        if (!title) {
            continue;
        }

        const summary = pickArticleSummary(article).slice(0, 88);
        const segment = `${getOrdinalLabel(index)}，${title}。${summary || '这是一条值得关注的资讯。'}`;
        if ((segments.join('') + segment + outro).length > maxLength) {
            break;
        }
        segments.push(segment);
    }

    segments.push(outro);
    return segments.join('');
}

function createPlaceholderMetadata({ date, articles, summary, canGenerate, status = 'unavailable', transcript = null, updatedAt = null, audioUrl = null, contentHash = null, title = 'AI资讯日报播客', errorMessage = null }) {
    return {
        date,
        status,
        title,
        summary,
        duration_seconds: transcript ? estimateDurationSeconds(transcript) : null,
        audio_url: audioUrl,
        transcript,
        script_mode: 'scripted',
        updated_at: updatedAt,
        can_generate: canGenerate,
        article_count: articles.length,
        content_hash: contentHash,
        error: errorMessage
    };
}

function getNewsForDate({ date, readData, newsFile, dataDir, dailyArchiveDir }) {
    const merged = [];
    const archiveCandidates = [
        path.join(dailyArchiveDir, `news-${date}.json`),
        path.join(dataDir, `news-${date}.json`),
        path.join(dataDir, `${date}.json`)
    ];

    for (const filePath of archiveCandidates) {
        if (fs.existsSync(filePath)) {
            merged.push(...readJsonFileSafe(filePath, []));
        }
    }

    const currentNews = readData(newsFile).filter((article) => {
        const articleDate = article.created_at ? article.created_at.split('T')[0] : '';
        return articleDate === date;
    });
    merged.push(...currentNews);

    return dedupeArticles(merged).sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
}

function buildPublicOssUrl(objectKey, config) {
    if (config.publicBaseUrl) {
        return `${config.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`;
    }

    return `https://${config.bucket}.${config.region}.aliyuncs.com/${objectKey}`;
}

function createPodcastConfigFromEnv(env) {
    return {
        metadataDir: env.PODCAST_METADATA_DIR || '',
        yunTts: {
            apiUrl: env.YUNTTS_API_URL || 'https://www.yuntts.com/api/v1/indextts2_generate',
            apiKey: env.YUNTTS_API_KEY || '',
            voice: env.YUNTTS_VOICE || env.YUNTTS_SPEAKER_ID || 'jack_cheng',
            speed: Number(env.YUNTTS_SPEED || 1.0),
            responseFormat: env.YUNTTS_RESPONSE_FORMAT || 'mp3',
            intervalSilence: Number(env.YUNTTS_INTERVAL_SILENCE || 100),
            seed: Number(env.YUNTTS_SEED || 42)
        },
        oss: {
            region: env.PODCAST_OSS_REGION || '',
            bucket: env.PODCAST_OSS_BUCKET || '',
            accessKeyId: env.PODCAST_OSS_ACCESS_KEY_ID || '',
            accessKeySecret: env.PODCAST_OSS_ACCESS_KEY_SECRET || '',
            endpoint: env.PODCAST_OSS_ENDPOINT || '',
            publicBaseUrl: env.PODCAST_OSS_PUBLIC_BASE_URL || ''
        }
    };
}

function isPodcastGenerationConfigured(config) {
    const { yunTts, oss } = config;
    return Boolean(
        yunTts.apiKey &&
        yunTts.apiUrl &&
        yunTts.voice &&
        oss.region &&
        oss.bucket &&
        oss.accessKeyId &&
        oss.accessKeySecret
    );
}

function createNewsPodcastService({
    readData,
    newsFile,
    dataDir,
    dailyArchiveDir,
    metadataDir,
    config
}) {
    const jobs = new Map();
    const resolvedMetadataDir = metadataDir;

    if (!fs.existsSync(resolvedMetadataDir)) {
        fs.mkdirSync(resolvedMetadataDir, { recursive: true });
    }

    function getMetadataPath(date) {
        return path.join(resolvedMetadataDir, `${date}.json`);
    }

    function loadExistingMetadata(date) {
        return readMetadataFileSafe(getMetadataPath(date));
    }

    function saveMetadata(date, metadata) {
        writeJsonFileSafe(getMetadataPath(date), metadata);
    }

    function getArticles(date) {
        return getNewsForDate({
            date,
            readData,
            newsFile,
            dataDir,
            dailyArchiveDir
        });
    }

    function getCurrentMetadata(date) {
        if (!isIsoDate(date)) {
            return {
                status: 'error',
                error: 'invalid_date'
            };
        }

        const articles = getArticles(date);
        const summary = buildPodcastSummary(date, articles);
        const contentHash = articles.length ? createContentHash(articles) : null;
        const canGenerate = articles.length > 0 && isPodcastGenerationConfigured(config);
        const existing = loadExistingMetadata(date);

        if (existing && existing.content_hash === contentHash && existing.audio_url) {
            return {
                ...existing,
                can_generate: canGenerate
            };
        }

        if (existing && existing.content_hash === contentHash && existing.status === 'pending') {
            return {
                ...existing,
                can_generate: canGenerate
            };
        }

        if (jobs.has(date)) {
            return createPlaceholderMetadata({
                date,
                articles,
                summary,
                canGenerate,
                status: 'pending',
                contentHash
            });
        }

        if (!articles.length) {
            return createPlaceholderMetadata({
                date,
                articles,
                summary: '当前日期暂无可用于生成播客的新闻内容。',
                canGenerate: false,
                contentHash
            });
        }

        if (existing && existing.content_hash === contentHash && existing.status === 'error') {
            return {
                ...existing,
                can_generate: canGenerate
            };
        }

        if (!canGenerate) {
            return createPlaceholderMetadata({
                date,
                articles,
                summary: '播客生成能力尚未配置完成，暂时无法生成音频。',
                canGenerate: false,
                contentHash
            });
        }

        return createPlaceholderMetadata({
            date,
            articles,
            summary,
            canGenerate,
            contentHash
        });
    }

    async function synthesizeWithYunTts(script) {
        const body = {
            text: script,
            voice: config.yunTts.voice,
            response_format: config.yunTts.responseFormat,
            interval_silence: config.yunTts.intervalSilence,
            speed: config.yunTts.speed,
            seed: config.yunTts.seed
        };

        const response = await fetch(config.yunTts.apiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.yunTts.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.msg || data.message || `YunTTS 请求失败: HTTP ${response.status}`);
        }

        const audioUrl = data.audio_url || (data.data && data.data.audio_url) || null;
        const duration = data.duration || (data.data && data.data.duration) || null;
        if (!audioUrl) {
            throw new Error(data.msg || data.message || 'YunTTS 未返回 audio_url');
        }

        return {
            ...data,
            audio_url: audioUrl,
            duration
        };
    }

    async function downloadAudioBuffer(audioUrl) {
        const response = await fetch(audioUrl);
        if (!response.ok) {
            throw new Error(`下载音频失败: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    async function uploadAudioToOss(buffer, date, contentHash) {
        const client = new OSS({
            region: config.oss.region,
            bucket: config.oss.bucket,
            accessKeyId: config.oss.accessKeyId,
            accessKeySecret: config.oss.accessKeySecret,
            endpoint: config.oss.endpoint || undefined
        });

        const [year, month, day] = date.split('-');
        const objectKey = `podcast/news/${year}/${month}/${day}/daily-news-${contentHash.slice(0, 10)}.mp3`;

        await client.put(objectKey, buffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=31536000'
            }
        });

        return buildPublicOssUrl(objectKey, config.oss);
    }

    async function generateNewsPodcast(date) {
        if (!isIsoDate(date)) {
            return { status: 'error', error: 'invalid_date' };
        }

        const existingStatus = getCurrentMetadata(date);
        if (existingStatus.status === 'ready') {
            return existingStatus;
        }

        if (!existingStatus.can_generate) {
            return existingStatus;
        }

        if (jobs.has(date)) {
            return getCurrentMetadata(date);
        }

        const articles = getArticles(date);
        const contentHash = createContentHash(articles);
        const script = buildPodcastScript(date, articles);
        const summary = buildPodcastSummary(date, articles);
        const pendingMetadata = createPlaceholderMetadata({
            date,
            articles,
            summary,
            canGenerate: true,
            status: 'pending',
            transcript: script,
            updatedAt: new Date().toISOString(),
            contentHash
        });
        saveMetadata(date, pendingMetadata);

        const job = (async () => {
            try {
                const ttsResult = await synthesizeWithYunTts(script);
                const audioBuffer = await downloadAudioBuffer(ttsResult.audio_url);
                const ossUrl = await uploadAudioToOss(audioBuffer, date, contentHash);
                const readyMetadata = createPlaceholderMetadata({
                    date,
                    articles,
                    summary,
                    canGenerate: true,
                    status: 'ready',
                    transcript: script,
                    updatedAt: new Date().toISOString(),
                    audioUrl: ossUrl,
                    contentHash
                });
                readyMetadata.duration_seconds = ttsResult.duration
                    ? Math.round(Number(ttsResult.duration))
                    : estimateDurationSeconds(script);
                saveMetadata(date, readyMetadata);
            } catch (error) {
                const failedMetadata = createPlaceholderMetadata({
                    date,
                    articles,
                    summary: '播客生成失败，请稍后重试。',
                    canGenerate: true,
                    status: 'error',
                    transcript: script,
                    updatedAt: new Date().toISOString(),
                    contentHash,
                    errorMessage: error.message
                });
                saveMetadata(date, failedMetadata);
                console.error(`[podcast] 生成失败 ${date}:`, error.message);
            } finally {
                jobs.delete(date);
            }
        })();

        jobs.set(date, job);
        return pendingMetadata;
    }

    return {
        getCurrentMetadata,
        generateNewsPodcast
    };
}

module.exports = {
    createNewsPodcastService,
    createPodcastConfigFromEnv,
    isPodcastGenerationConfigured
};
