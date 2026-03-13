const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');
const DEFAULT_YUNTTS_GENERATE_URL = 'https://www.yuntts.com/api/v1/indextts2_generate';
const DEFAULT_YUNTTS_CLONE_URL = 'https://www.yuntts.com/api/v1/indextts2_cloning';
const DEFAULT_YUNTTS_QUERY_URL = 'https://www.yuntts.com/api/v1/indextts_query';
const PODCAST_SCRIPT_ARTICLE_LIMIT = 10;
const PODCAST_SEGMENT_SUMMARY_LENGTH = 42;

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

function hashText(value) {
    return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

function hashFileContent(filePath) {
    return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
}

function inferAudioMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.wav') return 'audio/wav';
    if (ext === '.m4a') return 'audio/mp4';
    if (ext === '.flac') return 'audio/flac';
    return 'audio/mpeg';
}

function normalizeAudioExtension(value) {
    const normalized = String(value || 'mp3').trim().toLowerCase().replace(/^\./, '');
    if (normalized === 'mpeg') return 'mp3';
    return normalized || 'mp3';
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
        const normalizedTitle = sanitizeSpeechText(article.title || '');
        const fallbackKey = normalizedTitle || article.id || 'untitled';
        const key = article.source_url || `${fallbackKey}-${article.published_at || ''}`;
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
    const labels = ['第一条', '第二条', '第三条', '第四条', '第五条', '第六条', '第七条', '第八条', '第九条', '第十条'];
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
    const segments = [intro];
    const selectedArticles = articles.slice(0, PODCAST_SCRIPT_ARTICLE_LIMIT);

    for (let index = 0; index < selectedArticles.length; index++) {
        const article = selectedArticles[index];
        const title = sanitizeSpeechText(article.title);
        if (!title) {
            continue;
        }

        const summary = pickArticleSummary(article).slice(0, PODCAST_SEGMENT_SUMMARY_LENGTH);
        const segment = `${getOrdinalLabel(index)}，${title}。${summary || '这是一条值得关注的资讯。'}`;
        segments.push(segment);
    }

    segments.push(outro);
    return segments.join('');
}

function createPlaceholderMetadata({
    date,
    articles,
    summary,
    canGenerate,
    status = 'unavailable',
    transcript = null,
    updatedAt = null,
    audioUrl = null,
    audioStorage = null,
    audioFile = null,
    audioMimeType = null,
    contentHash = null,
    scriptHash = null,
    voiceProfileKey = null,
    title = 'AI资讯日报播客',
    errorMessage = null
}) {
    return {
        date,
        status,
        title,
        summary,
        duration_seconds: transcript ? estimateDurationSeconds(transcript) : null,
        audio_url: audioUrl,
        audio_storage: audioStorage,
        audio_file: audioFile,
        audio_mime_type: audioMimeType,
        transcript,
        script_mode: 'scripted',
        updated_at: updatedAt,
        can_generate: canGenerate,
        article_count: articles.length,
        content_hash: contentHash,
        script_hash: scriptHash,
        voice_profile_key: voiceProfileKey,
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
            apiUrl: env.YUNTTS_API_URL || DEFAULT_YUNTTS_GENERATE_URL,
            cloneApiUrl: env.YUNTTS_CLONE_API_URL || DEFAULT_YUNTTS_CLONE_URL,
            queryApiUrl: env.YUNTTS_QUERY_API_URL || DEFAULT_YUNTTS_QUERY_URL,
            apiKey: env.YUNTTS_API_KEY || '',
            voice: env.YUNTTS_VOICE || '',
            fallbackVoice: env.YUNTTS_SPEAKER_ID || 'jack_cheng',
            cloneSampleFile: env.YUNTTS_CLONE_SAMPLE_FILE || '',
            cloneName: env.YUNTTS_CLONE_NAME || 'AIcoming Podcast Voice',
            cloneDescription: env.YUNTTS_CLONE_DESCRIPTION || 'AIcoming daily podcast voice clone',
            speed: Number(env.YUNTTS_SPEED || 1.0),
            responseFormat: env.YUNTTS_RESPONSE_FORMAT || 'mp3',
            sampleRate: Number(env.YUNTTS_SAMPLE_RATE || 24000),
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

function isOssConfigured(config) {
    const { oss } = config;
    return Boolean(
        oss.region &&
        oss.bucket &&
        oss.accessKeyId &&
        oss.accessKeySecret
    );
}

function isPodcastGenerationConfigured(config) {
    const { yunTts } = config;
    const hasVoiceConfig = Boolean(yunTts.voice || yunTts.cloneSampleFile || yunTts.fallbackVoice);
    return Boolean(
        yunTts.apiKey &&
        yunTts.apiUrl &&
        hasVoiceConfig
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
    const resolvedAudioDir = path.join(resolvedMetadataDir, 'audio');
    const voiceStateFile = path.join(path.dirname(resolvedMetadataDir), 'voice-profile.json');

    if (!fs.existsSync(resolvedMetadataDir)) {
        fs.mkdirSync(resolvedMetadataDir, { recursive: true });
    }
    if (!fs.existsSync(resolvedAudioDir)) {
        fs.mkdirSync(resolvedAudioDir, { recursive: true });
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

    function resolveAudioUrl(date) {
        return `/api/podcast/news/${date}/audio`;
    }

    function buildLocalAudioFileName(date, contentHash, voiceProfileKey, extension) {
        const safeExtension = normalizeAudioExtension(extension);
        const voiceHash = hashText(voiceProfileKey).slice(0, 8);
        return `${date}-daily-news-${contentHash.slice(0, 10)}-${voiceHash}.${safeExtension}`;
    }

    function getLocalAudioAbsolutePath(fileName) {
        if (!fileName) {
            return null;
        }

        const resolvedPath = path.resolve(resolvedAudioDir, fileName);
        const relativePath = path.relative(resolvedAudioDir, resolvedPath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return null;
        }

        return resolvedPath;
    }

    function resolveLocalAudioRecord(date, metadata) {
        if (!metadata || metadata.audio_storage !== 'local' || !metadata.audio_file) {
            return null;
        }

        const filePath = getLocalAudioAbsolutePath(metadata.audio_file);
        if (!filePath || !fs.existsSync(filePath)) {
            return null;
        }

        return {
            filePath,
            mimeType: metadata.audio_mime_type || inferAudioMimeType(filePath),
            url: resolveAudioUrl(date)
        };
    }

    function hasPlayableAudio(date, metadata) {
        if (!metadata || !metadata.audio_url) {
            return false;
        }

        if (metadata.audio_storage === 'local') {
            return Boolean(resolveLocalAudioRecord(date, metadata));
        }

        return true;
    }

    function loadVoiceState() {
        return readMetadataFileSafe(voiceStateFile);
    }

    function saveVoiceState(state) {
        writeJsonFileSafe(voiceStateFile, state);
    }

    function getVoiceProfileKey() {
        if (config.yunTts.cloneSampleFile) {
            if (!fs.existsSync(config.yunTts.cloneSampleFile)) {
                return `clone-missing-${hashText(config.yunTts.cloneSampleFile).slice(0, 10)}`;
            }
            return `clone-${hashFileContent(config.yunTts.cloneSampleFile).slice(0, 12)}`;
        }

        const rawVoice = config.yunTts.voice || config.yunTts.fallbackVoice || 'default';
        return `voice-${hashText(rawVoice).slice(0, 12)}`;
    }

    async function queryAvailableVoices() {
        const response = await fetch(config.yunTts.queryApiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.yunTts.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.msg || data.message || `YunTTS 音色查询失败: HTTP ${response.status}`);
        }

        const voices = Array.isArray(data.data) ? data.data : (Array.isArray(data.voices) ? data.voices : []);
        return voices;
    }

    function findVoiceEntry(voices, voiceIdOrName) {
        if (!voiceIdOrName) {
            return null;
        }

        return voices.find((item) => {
            const voiceId = item.voice_id || item.id || '';
            const voiceName = item.voice_name || item.name || '';
            return voiceId === voiceIdOrName || voiceName === voiceIdOrName;
        }) || null;
    }

    async function cloneVoiceFromSample(voiceProfileKey) {
        if (!config.yunTts.cloneSampleFile || !fs.existsSync(config.yunTts.cloneSampleFile)) {
            throw new Error('未找到可用的声音克隆样本文件');
        }

        const fileBuffer = fs.readFileSync(config.yunTts.cloneSampleFile);
        const body = {
            name: config.yunTts.cloneName,
            speaker_file_base64: fileBuffer.toString('base64')
        };
        if (config.yunTts.cloneDescription) {
            body.description = config.yunTts.cloneDescription;
        }

        const response = await fetch(config.yunTts.cloneApiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.yunTts.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.msg || data.message || `YunTTS 音色克隆失败: HTTP ${response.status}`);
        }

        const voiceId = data.voice_id || (data.data && data.data.voice_id) || (data.data && data.data.id) || null;
        if (!voiceId) {
            throw new Error(data.msg || data.message || 'YunTTS 未返回 voice_id');
        }

        const state = {
            voice_id: voiceId,
            voice_name: config.yunTts.cloneName,
            voice_profile_key: voiceProfileKey,
            sample_file: config.yunTts.cloneSampleFile,
            created_at: new Date().toISOString()
        };
        saveVoiceState(state);
        return state;
    }

    async function resolveSynthesisVoice() {
        const voiceProfileKey = getVoiceProfileKey();
        const configuredVoice = config.yunTts.voice;
        const cloneSampleFile = config.yunTts.cloneSampleFile;

        if (!cloneSampleFile) {
            return {
                voiceId: configuredVoice || config.yunTts.fallbackVoice,
                voiceProfileKey
            };
        }

        const voices = await queryAvailableVoices();
        const existingState = loadVoiceState();

        if (configuredVoice) {
            const matchedConfiguredVoice = findVoiceEntry(voices, configuredVoice);
            if (matchedConfiguredVoice) {
                return {
                    voiceId: matchedConfiguredVoice.voice_id || matchedConfiguredVoice.id || configuredVoice,
                    voiceProfileKey
                };
            }
        }

        if (existingState && existingState.voice_profile_key === voiceProfileKey) {
            const matchedStateVoice = findVoiceEntry(voices, existingState.voice_id);
            if (matchedStateVoice) {
                return {
                    voiceId: matchedStateVoice.voice_id || matchedStateVoice.id || existingState.voice_id,
                    voiceProfileKey
                };
            }
        }

        const clonedVoice = await cloneVoiceFromSample(voiceProfileKey);
        return {
            voiceId: clonedVoice.voice_id,
            voiceProfileKey
        };
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
        const script = articles.length ? buildPodcastScript(date, articles) : '';
        const scriptHash = script ? hashText(script) : null;
        const voiceProfileKey = getVoiceProfileKey();
        const canGenerate = articles.length > 0 && isPodcastGenerationConfigured(config);
        const existing = loadExistingMetadata(date);

        if (existing && existing.content_hash === contentHash && existing.script_hash === scriptHash && existing.voice_profile_key === voiceProfileKey && hasPlayableAudio(date, existing)) {
            const localAudioRecord = resolveLocalAudioRecord(date, existing);
            return {
                ...existing,
                audio_url: localAudioRecord ? localAudioRecord.url : existing.audio_url,
                can_generate: canGenerate
            };
        }

        if (existing && existing.content_hash === contentHash && existing.script_hash === scriptHash && existing.voice_profile_key === voiceProfileKey && existing.status === 'pending') {
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
                contentHash,
                scriptHash,
                voiceProfileKey
            });
        }

        if (!articles.length) {
            return createPlaceholderMetadata({
                date,
                articles,
                summary: '当前日期暂无可用于生成播客的新闻内容。',
                canGenerate: false,
                contentHash,
                scriptHash,
                voiceProfileKey
            });
        }

        if (existing && existing.content_hash === contentHash && existing.script_hash === scriptHash && existing.voice_profile_key === voiceProfileKey && existing.status === 'error') {
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
                contentHash,
                scriptHash,
                voiceProfileKey
            });
        }

        return createPlaceholderMetadata({
            date,
            articles,
            summary,
            canGenerate,
            contentHash,
            scriptHash,
            voiceProfileKey
        });
    }

    async function synthesizeWithYunTts(script, voiceId) {
        const body = {
            text: script,
            voice: voiceId,
            response_format: config.yunTts.responseFormat,
            sample_rate: config.yunTts.sampleRate,
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

    async function uploadAudioToOss(buffer, date, contentHash, voiceProfileKey) {
        const client = new OSS({
            region: config.oss.region,
            bucket: config.oss.bucket,
            accessKeyId: config.oss.accessKeyId,
            accessKeySecret: config.oss.accessKeySecret,
            endpoint: config.oss.endpoint || undefined
        });

        const [year, month, day] = date.split('-');
        const voiceHash = hashText(voiceProfileKey).slice(0, 8);
        const extension = normalizeAudioExtension(config.yunTts.responseFormat);
        const objectKey = `podcast/news/${year}/${month}/${day}/daily-news-${contentHash.slice(0, 10)}-${voiceHash}.${extension}`;

        await client.put(objectKey, buffer, {
            headers: {
                'Content-Type': inferAudioMimeType(objectKey),
                'Cache-Control': 'public, max-age=31536000'
            }
        });

        return buildPublicOssUrl(objectKey, config.oss);
    }

    function pruneLocalAudioFiles({ date, keepFileName }) {
        const prefix = `${date}-`;
        const files = fs.readdirSync(resolvedAudioDir);
        for (const fileName of files) {
            if (!fileName.startsWith(prefix) || fileName === keepFileName) {
                continue;
            }

            try {
                fs.unlinkSync(path.join(resolvedAudioDir, fileName));
            } catch (error) {
                console.warn(`[podcast] 删除旧本地音频失败 ${fileName}:`, error.message);
            }
        }
    }

    function saveAudioLocally(buffer, date, contentHash, voiceProfileKey) {
        const extension = normalizeAudioExtension(config.yunTts.responseFormat);
        const fileName = buildLocalAudioFileName(date, contentHash, voiceProfileKey, extension);
        const filePath = path.join(resolvedAudioDir, fileName);
        fs.writeFileSync(filePath, buffer);
        pruneLocalAudioFiles({ date, keepFileName: fileName });

        return {
            audioUrl: resolveAudioUrl(date),
            audioStorage: 'local',
            audioFile: fileName,
            audioMimeType: inferAudioMimeType(filePath)
        };
    }

    async function persistAudio(buffer, date, contentHash, voiceProfileKey) {
        if (isOssConfigured(config)) {
            const audioUrl = await uploadAudioToOss(buffer, date, contentHash, voiceProfileKey);
            return {
                audioUrl,
                audioStorage: 'oss',
                audioFile: null,
                audioMimeType: inferAudioMimeType(`audio.${normalizeAudioExtension(config.yunTts.responseFormat)}`)
            };
        }

        return saveAudioLocally(buffer, date, contentHash, voiceProfileKey);
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
        const voiceProfileKey = getVoiceProfileKey();
        const script = buildPodcastScript(date, articles);
        const scriptHash = hashText(script);
        const summary = buildPodcastSummary(date, articles);
        const pendingMetadata = createPlaceholderMetadata({
            date,
            articles,
            summary,
            canGenerate: true,
            status: 'pending',
            transcript: script,
            updatedAt: new Date().toISOString(),
            contentHash,
            scriptHash,
            voiceProfileKey
        });
        saveMetadata(date, pendingMetadata);

        const job = (async () => {
            try {
                const { voiceId } = await resolveSynthesisVoice();
                const ttsResult = await synthesizeWithYunTts(script, voiceId);
                const audioBuffer = await downloadAudioBuffer(ttsResult.audio_url);
                const audioRecord = await persistAudio(audioBuffer, date, contentHash, voiceProfileKey);
                const readyMetadata = createPlaceholderMetadata({
                    date,
                    articles,
                    summary,
                    canGenerate: true,
                    status: 'ready',
                    transcript: script,
                    updatedAt: new Date().toISOString(),
                    audioUrl: audioRecord.audioUrl,
                    audioStorage: audioRecord.audioStorage,
                    audioFile: audioRecord.audioFile,
                    audioMimeType: audioRecord.audioMimeType,
                    contentHash,
                    scriptHash,
                    voiceProfileKey
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
                    scriptHash,
                    voiceProfileKey,
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
        generateNewsPodcast,
        getAudioFileForDate(date) {
            if (!isIsoDate(date)) {
                return null;
            }

            const metadata = loadExistingMetadata(date);
            return resolveLocalAudioRecord(date, metadata);
        }
    };
}

module.exports = {
    createNewsPodcastService,
    createPodcastConfigFromEnv,
    isPodcastGenerationConfigured
};
