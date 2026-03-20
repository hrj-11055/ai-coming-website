const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const OSS = require('ali-oss');
const {
    createPodcastScriptService
} = require('./podcast-script');

const DEFAULT_MINIMAX_TTS_API_URL = 'https://api.minimaxi.com/v1/t2a_async_v2';
const DEFAULT_MINIMAX_TTS_QUERY_API_URL = 'https://api.minimaxi.com/v1/query/t2a_async_query_v2';
const DEFAULT_MINIMAX_TTS_FILE_METADATA_API_URL = 'https://api.minimaxi.com/v1/files/retrieve';
const DEFAULT_MINIMAX_TTS_FILE_API_URL = 'https://api.minimaxi.com/v1/files/retrieve_content';
const DEFAULT_MINIMAX_TTS_MODEL = 'speech-2.8-turbo';
const DEFAULT_MINIMAX_TTS_VOICE_ID = 'male-qn-jingying';
const DEFAULT_AUDIO_FORMAT = 'mp3';
const DEFAULT_LANGUAGE_BOOST = 'Chinese';
const DEFAULT_TTS_SPEED = 1.0;
const DEFAULT_TTS_VOLUME = 1.0;
const DEFAULT_TTS_PITCH = 0;
const DEFAULT_TTS_POLL_INTERVAL_MS = 3000;
const DEFAULT_TTS_TIMEOUT_MS = 600000;
const DEFAULT_PODCAST_SCRIPT_API_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_PODCAST_SCRIPT_MODEL = 'deepseek-chat';

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
    if (ext === '.ogg') return 'audio/ogg';
    return 'audio/mpeg';
}

function normalizeAudioExtension(value) {
    const normalized = String(value || DEFAULT_AUDIO_FORMAT).trim().toLowerCase().replace(/^\./, '');
    if (normalized === 'mpeg') return 'mp3';
    return normalized || DEFAULT_AUDIO_FORMAT;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeChatCompletionsUrl(baseOrFullUrl, fallbackUrl) {
    const raw = String(baseOrFullUrl || '').trim();
    if (!raw) {
        return fallbackUrl;
    }

    if (/\/chat\/completions\/?$/.test(raw)) {
        return raw;
    }

    return `${raw.replace(/\/+$/, '')}/chat/completions`;
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

function buildPodcastSummary(date, articles) {
    if (!articles.length) {
        return '今天还没有可播报的 AI 资讯。';
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
    generationSignature = null,
    promptHash = null,
    scriptHash = null,
    scriptInputFile = null,
    scriptAttempts = null,
    lastHttpStatus = null,
    lastErrorMessage = null,
    ttsTaskId = null,
    ttsFileId = null,
    ttsStatus = null,
    ttsVoiceKey = null,
    scriptMarkdown = null,
    scriptTtsText = null,
    scriptProvider = 'deepseek',
    scriptModel = null,
    ttsModel = null,
    ttsProvider = 'minimax',
    ttsVoiceType = 'system_default',
    wechatCopy = '',
    excludedItems = [],
    selectedTitles = [],
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
        script_mode: 'llm_rewritten',
        script_markdown: scriptMarkdown,
        script_tts_text: scriptTtsText,
        script_provider: scriptProvider,
        script_model: scriptModel,
        tts_provider: ttsProvider,
        tts_model: ttsModel,
        tts_voice_type: ttsVoiceType,
        updated_at: updatedAt,
        can_generate: canGenerate,
        article_count: articles.length,
        content_hash: contentHash,
        generation_signature: generationSignature,
        prompt_hash: promptHash,
        script_hash: scriptHash,
        script_input_file: scriptInputFile,
        script_attempts: scriptAttempts,
        last_http_status: lastHttpStatus,
        last_error_message: lastErrorMessage,
        tts_task_id: ttsTaskId,
        tts_file_id: ttsFileId,
        tts_status: ttsStatus,
        tts_voice_key: ttsVoiceKey,
        wechat_copy: wechatCopy,
        excluded_items: excludedItems,
        selected_titles: selectedTitles,
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
    const deepseekBaseOrUrl = env.DEEPSEEK_API_URL || env.DEEPSEEK_BASE_URL || '';
    const deepseekApiUrl = normalizeChatCompletionsUrl(
        deepseekBaseOrUrl,
        DEFAULT_PODCAST_SCRIPT_API_URL
    );

    return {
        metadataDir: env.PODCAST_METADATA_DIR || '',
        script: {
            apiKey: env.PODCAST_SCRIPT_API_KEY || env.DEEPSEEK_API_KEY || '',
            apiUrl: env.PODCAST_SCRIPT_API_URL || deepseekApiUrl,
            model: env.PODCAST_SCRIPT_MODEL || env.DEEPSEEK_MODEL || DEFAULT_PODCAST_SCRIPT_MODEL,
            inputDir: env.PODCAST_SCRIPT_INPUT_DIR || '/var/www/json/report',
            timeoutMs: Number(env.PODCAST_SCRIPT_TIMEOUT_MS || 120000),
            maxTokens: Number(env.PODCAST_SCRIPT_MAX_TOKENS || 2200),
            maxRetries: Number(env.PODCAST_SCRIPT_MAX_RETRIES || 3),
            retryBaseDelayMs: Number(env.PODCAST_SCRIPT_RETRY_BASE_DELAY_MS || 1000),
            systemPromptFile: env.PODCAST_SCRIPT_SYSTEM_PROMPT_FILE || path.join(process.cwd(), 'config', 'podcast-script-system-prompt.md')
        },
        minimaxTts: {
            apiKey: env.MINIMAX_API_KEY || '',
            apiUrl: env.MINIMAX_TTS_API_URL || DEFAULT_MINIMAX_TTS_API_URL,
            queryApiUrl: env.MINIMAX_TTS_QUERY_API_URL || DEFAULT_MINIMAX_TTS_QUERY_API_URL,
            fileMetadataApiUrl: env.MINIMAX_TTS_FILE_METADATA_API_URL || DEFAULT_MINIMAX_TTS_FILE_METADATA_API_URL,
            fileApiUrl: env.MINIMAX_TTS_FILE_API_URL || DEFAULT_MINIMAX_TTS_FILE_API_URL,
            model: env.MINIMAX_TTS_MODEL || DEFAULT_MINIMAX_TTS_MODEL,
            voiceId: env.MINIMAX_TTS_VOICE_ID || DEFAULT_MINIMAX_TTS_VOICE_ID,
            speed: Number(env.MINIMAX_TTS_SPEED || DEFAULT_TTS_SPEED),
            volume: Number(env.MINIMAX_TTS_VOLUME || DEFAULT_TTS_VOLUME),
            pitch: Number(env.MINIMAX_TTS_PITCH || DEFAULT_TTS_PITCH),
            audioFormat: env.MINIMAX_TTS_FORMAT || DEFAULT_AUDIO_FORMAT,
            languageBoost: env.MINIMAX_TTS_LANGUAGE_BOOST || DEFAULT_LANGUAGE_BOOST,
            pollIntervalMs: Number(env.MINIMAX_TTS_POLL_INTERVAL_MS || DEFAULT_TTS_POLL_INTERVAL_MS),
            timeoutMs: Number(env.MINIMAX_TTS_TIMEOUT_MS || DEFAULT_TTS_TIMEOUT_MS)
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
    const { oss = {} } = config;
    return Boolean(
        oss.region &&
        oss.bucket &&
        oss.accessKeyId &&
        oss.accessKeySecret
    );
}

function isPodcastGenerationConfigured(config) {
    const script = config?.script || {};
    const minimaxTts = config?.minimaxTts || {};
    return Boolean(
        script.apiKey &&
        script.apiUrl &&
        script.model &&
        script.systemPromptFile &&
        minimaxTts.apiKey &&
        minimaxTts.apiUrl &&
        minimaxTts.model &&
        minimaxTts.voiceId
    );
}

function buildGenerationSignature({
    contentHash,
    promptHash,
    scriptModel,
    ttsModel,
    voiceId
}) {
    return hashText(JSON.stringify({
        contentHash,
        promptHash,
        scriptModel,
        ttsModel,
        voiceId
    }));
}

function normalizeAudioLengthSeconds(value, fallbackText) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return estimateDurationSeconds(fallbackText);
    }

    if (numeric > 1000) {
        return Math.round(numeric / 1000);
    }

    return Math.round(numeric);
}

function createNewsPodcastService({
    readData,
    newsFile,
    dataDir,
    dailyArchiveDir,
    metadataDir,
    config,
    podcastScriptService = null,
    fetchImpl = fetch
}) {
    const jobs = new Map();
    const resolvedMetadataDir = metadataDir;
    const resolvedAudioDir = path.join(resolvedMetadataDir, 'audio');
    const scriptService = podcastScriptService || createPodcastScriptService({
        config: config.script,
        fetchImpl
    });

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

    function getPromptHash() {
        if (!config?.script?.systemPromptFile) {
            return 'prompt-missing';
        }

        if (!fs.existsSync(config.script.systemPromptFile)) {
            return `prompt-missing-${hashText(config.script.systemPromptFile).slice(0, 12)}`;
        }

        return hashFileContent(config.script.systemPromptFile);
    }

    function getTtsVoiceKey() {
        return `system-default-${hashText(config.minimaxTts.voiceId).slice(0, 12)}`;
    }

    function buildLocalAudioFileName(date, contentHash, generationSignature, extension) {
        const safeExtension = normalizeAudioExtension(extension);
        return `${date}-daily-news-${contentHash.slice(0, 10)}-${generationSignature.slice(0, 8)}.${safeExtension}`;
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
        const promptHash = getPromptHash();
        const ttsVoiceKey = getTtsVoiceKey();
        const generationSignature = articles.length ? buildGenerationSignature({
            contentHash,
            promptHash,
            scriptModel: config.script.model,
            ttsModel: config.minimaxTts.model,
            voiceId: config.minimaxTts.voiceId
        }) : null;
        const canGenerate = articles.length > 0 && isPodcastGenerationConfigured(config);
        const existing = loadExistingMetadata(date);

        if (existing && existing.generation_signature === generationSignature && hasPlayableAudio(date, existing)) {
            const localAudioRecord = resolveLocalAudioRecord(date, existing);
            return {
                ...existing,
                audio_url: localAudioRecord ? localAudioRecord.url : existing.audio_url,
                can_generate: canGenerate
            };
        }

        if (existing && existing.generation_signature === generationSignature && existing.status === 'pending') {
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
                promptHash,
                generationSignature,
                ttsVoiceKey,
                scriptModel: config.script.model,
                ttsModel: config.minimaxTts.model
            });
        }

        if (!articles.length) {
            return createPlaceholderMetadata({
                date,
                articles,
                summary: '当前日期暂无可用于生成播客的新闻内容。',
                canGenerate: false,
                contentHash,
                promptHash,
                generationSignature,
                ttsVoiceKey,
                scriptModel: config.script.model,
                ttsModel: config.minimaxTts.model
            });
        }

        if (existing && existing.generation_signature === generationSignature && existing.status === 'error') {
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
                promptHash,
                generationSignature,
                ttsVoiceKey,
                scriptModel: config.script.model,
                ttsModel: config.minimaxTts.model
            });
        }

        return createPlaceholderMetadata({
            date,
            articles,
            summary,
            canGenerate,
            contentHash,
            promptHash,
            generationSignature,
            ttsVoiceKey,
            scriptModel: config.script.model,
            ttsModel: config.minimaxTts.model
        });
    }

    function parseMinimaxMessage(data, fallbackMessage) {
        return data?.error?.message
            || data?.base_resp?.status_msg
            || data?.message
            || data?.msg
            || fallbackMessage;
    }

    function ensureMinimaxSuccess(data, fallbackMessage) {
        const statusCode = Number(data?.base_resp?.status_code);
        if (Number.isFinite(statusCode) && statusCode !== 0) {
            throw new Error(parseMinimaxMessage(data, fallbackMessage));
        }
    }

    function isAsyncTtsCompleted(status) {
        return ['success', 'succeeded', 'completed', 'done', 'finish', 'finished']
            .includes(String(status || '').trim().toLowerCase());
    }

    function isAsyncTtsFailed(status) {
        return ['failed', 'error', 'expired', 'canceled', 'cancelled']
            .includes(String(status || '').trim().toLowerCase());
    }

    function buildAsyncTtsQueryUrl(taskId) {
        const separator = String(config.minimaxTts.queryApiUrl || '').includes('?') ? '&' : '?';
        return `${config.minimaxTts.queryApiUrl}${separator}task_id=${encodeURIComponent(taskId)}`;
    }

    function buildAsyncTtsFileUrl(fileId) {
        const separator = String(config.minimaxTts.fileApiUrl || '').includes('?') ? '&' : '?';
        return `${config.minimaxTts.fileApiUrl}${separator}file_id=${encodeURIComponent(fileId)}`;
    }

    function buildAsyncTtsFileMetadataUrl(fileId) {
        const separator = String(config.minimaxTts.fileMetadataApiUrl || '').includes('?') ? '&' : '?';
        return `${config.minimaxTts.fileMetadataApiUrl}${separator}file_id=${encodeURIComponent(fileId)}`;
    }

    function bufferLooksLikeAudio(buffer) {
        if (!buffer || buffer.length < 4) {
            return false;
        }

        const header = buffer.subarray(0, 4);
        return buffer.subarray(0, 3).equals(Buffer.from('ID3'))
            || header.equals(Buffer.from('RIFF'))
            || header.equals(Buffer.from('OggS'))
            || header.equals(Buffer.from('fLaC'))
            || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
    }

    function extractAudioBufferFromArchive(archiveBuffer) {
        if (!archiveBuffer?.length) {
            throw new Error('MiniMax 音频归档为空');
        }

        if (bufferLooksLikeAudio(archiveBuffer)) {
            return archiveBuffer;
        }

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'minimax-audio-'));
        const archivePath = path.join(tempDir, 'audio-archive.tar');

        try {
            fs.writeFileSync(archivePath, archiveBuffer);
            execFileSync('tar', ['-xf', archivePath, '-C', tempDir]);

            const entries = fs.readdirSync(tempDir, { recursive: true });
            const audioEntry = entries.find((entry) => /\.(mp3|wav|m4a|flac|ogg)$/i.test(String(entry)));
            if (!audioEntry) {
                throw new Error('MiniMax 音频归档中未找到可用音频文件');
            }

            const audioPath = path.join(tempDir, String(audioEntry));
            return fs.readFileSync(audioPath);
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }

    async function createMinimaxAsyncTask(scriptTtsText) {
        const body = {
            model: config.minimaxTts.model,
            text: scriptTtsText,
            voice_setting: {
                voice_id: config.minimaxTts.voiceId,
                speed: config.minimaxTts.speed,
                vol: config.minimaxTts.volume,
                pitch: config.minimaxTts.pitch
            },
            audio_setting: {
                audio_sample_rate: 32000,
                bitrate: 128000,
                format: normalizeAudioExtension(config.minimaxTts.audioFormat),
                channel: 1
            },
            language_boost: config.minimaxTts.languageBoost
        };

        const response = await fetchImpl(config.minimaxTts.apiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.minimaxTts.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(parseMinimaxMessage(data, `MiniMax 异步 TTS 创建任务失败: HTTP ${response.status}`));
        }
        ensureMinimaxSuccess(data, 'MiniMax 异步 TTS 创建任务失败');

        const taskId = data?.task_id || data?.data?.task_id || null;
        const fileId = data?.file_id || data?.data?.file_id || null;
        if (!taskId) {
            throw new Error('MiniMax 异步 TTS 未返回 task_id');
        }

        return {
            taskId,
            fileId
        };
    }

    async function queryMinimaxAsyncTask(taskId) {
        const response = await fetchImpl(buildAsyncTtsQueryUrl(taskId), {
            headers: {
                Authorization: `Bearer ${config.minimaxTts.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(parseMinimaxMessage(data, `MiniMax 异步 TTS 查询失败: HTTP ${response.status}`));
        }
        ensureMinimaxSuccess(data, 'MiniMax 异步 TTS 查询失败');

        const payload = data?.data || data;
        const status = payload?.status || payload?.task_status || payload?.state || null;
        const fileId = payload?.file_id || payload?.result_file_id || payload?.audio_file_id || null;
        const duration = payload?.extra_info?.audio_length
            || payload?.audio_length
            || payload?.duration
            || null;

        return {
            status,
            fileId,
            duration,
            raw: data
        };
    }

    async function fetchMinimaxFileDownloadInfo(fileId) {
        const response = await fetchImpl(buildAsyncTtsFileMetadataUrl(fileId), {
            headers: {
                Authorization: `Bearer ${config.minimaxTts.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(parseMinimaxMessage(data, `获取 MiniMax 文件下载地址失败: HTTP ${response.status}`));
        }
        ensureMinimaxSuccess(data, '获取 MiniMax 文件下载地址失败');

        const file = data?.file || data?.data?.file || data?.data || {};
        const downloadUrl = file?.download_url || data?.download_url || data?.data?.download_url || null;
        if (!downloadUrl) {
            throw new Error('MiniMax 文件下载信息未返回 download_url');
        }

        return {
            downloadUrl,
            fileName: file?.filename || data?.filename || null
        };
    }

    async function queryMinimaxTaskStatus(taskId) {
        const normalizedTaskId = String(taskId || '').trim();
        if (!normalizedTaskId) {
            throw new Error('MiniMax 异步 TTS 查询缺少 task_id');
        }

        if (!config?.minimaxTts?.apiKey || !config?.minimaxTts?.queryApiUrl) {
            throw new Error('MiniMax 异步 TTS 查询能力尚未配置完成');
        }

        const result = await queryMinimaxAsyncTask(normalizedTaskId);
        const normalizedStatus = String(result.status || '').trim();

        return {
            task_id: normalizedTaskId,
            status: normalizedStatus,
            file_id: result.fileId || null,
            duration_seconds: normalizeAudioLengthSeconds(result.duration, null),
            is_complete: isAsyncTtsCompleted(normalizedStatus),
            is_failed: isAsyncTtsFailed(normalizedStatus)
        };
    }

    async function waitForMinimaxAsyncResult(taskId, fallbackFileId = null) {
        const timeoutMs = Math.max(1000, Number(config.minimaxTts.timeoutMs) || DEFAULT_TTS_TIMEOUT_MS);
        const pollIntervalMs = Math.max(1, Number(config.minimaxTts.pollIntervalMs) || DEFAULT_TTS_POLL_INTERVAL_MS);
        const deadline = Date.now() + timeoutMs;
        let lastResult = null;

        while (Date.now() <= deadline) {
            const result = await queryMinimaxAsyncTask(taskId);
            lastResult = result;
            const fileId = result.fileId || fallbackFileId;

            if (isAsyncTtsCompleted(result.status)) {
                if (!fileId) {
                    throw new Error('MiniMax 异步 TTS 已完成但未返回 file_id');
                }

                return {
                    fileId,
                    duration: result.duration
                };
            }

            if (isAsyncTtsFailed(result.status)) {
                throw new Error(parseMinimaxMessage(result.raw, `MiniMax 异步 TTS 任务失败: ${result.status || 'unknown'}`));
            }

            await sleep(pollIntervalMs);
        }

        const error = new Error(`MiniMax 异步 TTS 轮询超时（>${timeoutMs}ms）`);
        error.ttsTaskId = taskId;
        error.ttsFileId = lastResult?.fileId || fallbackFileId || null;
        error.ttsStatus = lastResult?.status || 'Processing';
        throw error;
    }

    async function synthesizeWithMinimax(scriptTtsText, { onTaskCreated } = {}) {
        const normalizedText = String(scriptTtsText || '').trim();
        if (!normalizedText) {
            throw new Error('MiniMax 异步 TTS 缺少可合成文本');
        }

        const task = await createMinimaxAsyncTask(normalizedText);
        if (typeof onTaskCreated === 'function') {
            await onTaskCreated(task);
        }
        try {
            const result = await waitForMinimaxAsyncResult(task.taskId, task.fileId);
            const audioBuffer = await downloadAudioBufferFromFileId(result.fileId || task.fileId);
            const numericDuration = Number(result.duration);

            return {
                audioBuffer,
                duration: Number.isFinite(numericDuration) && numericDuration > 0 ? numericDuration : null,
                chunkCount: 1,
                taskId: task.taskId,
                fileId: result.fileId || task.fileId
            };
        } catch (error) {
            error.ttsTaskId = error.ttsTaskId || task.taskId;
            error.ttsFileId = error.ttsFileId || task.fileId || null;
            error.ttsStatus = error.ttsStatus || 'Processing';
            throw error;
        }
    }

    async function downloadAudioBufferFromFileId(fileId) {
        const downloadInfo = await fetchMinimaxFileDownloadInfo(fileId);
        const response = await fetchImpl(downloadInfo.downloadUrl);
        if (!response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const data = await response.json().catch(() => ({}));
                throw new Error(parseMinimaxMessage(data, `下载 MiniMax 音频归档失败: HTTP ${response.status}`));
            }

            throw new Error(`下载 MiniMax 音频归档失败: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return extractAudioBufferFromArchive(Buffer.from(arrayBuffer));
    }

    async function uploadAudioToOss(buffer, date, contentHash, generationSignature) {
        const client = new OSS({
            region: config.oss.region,
            bucket: config.oss.bucket,
            accessKeyId: config.oss.accessKeyId,
            accessKeySecret: config.oss.accessKeySecret,
            endpoint: config.oss.endpoint || undefined
        });

        const [year, month, day] = date.split('-');
        const extension = normalizeAudioExtension(config.minimaxTts.audioFormat);
        const objectKey = `podcast/news/${year}/${month}/${day}/daily-news-${contentHash.slice(0, 10)}-${generationSignature.slice(0, 8)}.${extension}`;

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

    function saveAudioLocally(buffer, date, contentHash, generationSignature) {
        const extension = normalizeAudioExtension(config.minimaxTts.audioFormat);
        const fileName = buildLocalAudioFileName(date, contentHash, generationSignature, extension);
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

    async function persistAudio(buffer, date, contentHash, generationSignature) {
        if (isOssConfigured(config)) {
            const audioUrl = await uploadAudioToOss(buffer, date, contentHash, generationSignature);
            return {
                audioUrl,
                audioStorage: 'oss',
                audioFile: null,
                audioMimeType: inferAudioMimeType(`audio.${normalizeAudioExtension(config.minimaxTts.audioFormat)}`)
            };
        }

        return saveAudioLocally(buffer, date, contentHash, generationSignature);
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
        const promptHash = getPromptHash();
        const generationSignature = buildGenerationSignature({
            contentHash,
            promptHash,
            scriptModel: config.script.model,
            ttsModel: config.minimaxTts.model,
            voiceId: config.minimaxTts.voiceId
        });
        const ttsVoiceKey = getTtsVoiceKey();
        const summary = buildPodcastSummary(date, articles);
        const pendingMetadata = createPlaceholderMetadata({
            date,
            articles,
            summary,
            canGenerate: true,
            status: 'pending',
            updatedAt: new Date().toISOString(),
            contentHash,
            promptHash,
            generationSignature,
            ttsVoiceKey,
            scriptModel: config.script.model,
            ttsModel: config.minimaxTts.model
        });
        saveMetadata(date, pendingMetadata);

        const job = (async () => {
            let generatedScript = null;
            let ttsTask = null;
            try {
                generatedScript = await scriptService.generateScript({ date, articles });
                const scriptHash = hashText(generatedScript.script_tts_text);

                saveMetadata(date, createPlaceholderMetadata({
                    date,
                    articles,
                    summary,
                    canGenerate: true,
                    status: 'pending',
                    transcript: generatedScript.script_tts_text,
                    updatedAt: new Date().toISOString(),
                    contentHash,
                    promptHash,
                    generationSignature,
                    scriptHash,
                    scriptInputFile: generatedScript.script_input_file || null,
                    scriptAttempts: generatedScript.script_attempts || null,
                    lastHttpStatus: generatedScript.last_http_status || null,
                    ttsTaskId: null,
                    ttsFileId: null,
                    ttsStatus: 'script_ready',
                    ttsVoiceKey,
                    scriptMarkdown: generatedScript.script_markdown,
                    scriptTtsText: generatedScript.script_tts_text,
                    scriptModel: config.script.model,
                    ttsModel: config.minimaxTts.model,
                    wechatCopy: generatedScript.wechat_copy,
                    excludedItems: generatedScript.excluded_items,
                    selectedTitles: generatedScript.selected_titles
                }));

                const ttsResult = await synthesizeWithMinimax(generatedScript.script_tts_text, {
                    onTaskCreated: async (task) => {
                        ttsTask = task;
                        saveMetadata(date, createPlaceholderMetadata({
                            date,
                            articles,
                            summary,
                            canGenerate: true,
                            status: 'pending',
                            transcript: generatedScript.script_tts_text,
                            updatedAt: new Date().toISOString(),
                            contentHash,
                            promptHash,
                            generationSignature,
                            scriptHash,
                            scriptInputFile: generatedScript.script_input_file || null,
                            scriptAttempts: generatedScript.script_attempts || null,
                            lastHttpStatus: generatedScript.last_http_status || null,
                            ttsTaskId: task.taskId || null,
                            ttsFileId: task.fileId || null,
                            ttsStatus: 'Processing',
                            ttsVoiceKey,
                            scriptMarkdown: generatedScript.script_markdown,
                            scriptTtsText: generatedScript.script_tts_text,
                            scriptModel: config.script.model,
                            ttsModel: config.minimaxTts.model,
                            wechatCopy: generatedScript.wechat_copy,
                            excludedItems: generatedScript.excluded_items,
                            selectedTitles: generatedScript.selected_titles
                        }));
                    }
                });
                const audioBuffer = ttsResult.audioBuffer;
                const audioRecord = await persistAudio(audioBuffer, date, contentHash, generationSignature);
                const readyMetadata = createPlaceholderMetadata({
                    date,
                    articles,
                    summary,
                    canGenerate: true,
                    status: 'ready',
                    transcript: generatedScript.script_tts_text,
                    updatedAt: new Date().toISOString(),
                    audioUrl: audioRecord.audioUrl,
                    audioStorage: audioRecord.audioStorage,
                    audioFile: audioRecord.audioFile,
                    audioMimeType: audioRecord.audioMimeType,
                    contentHash,
                    promptHash,
                    generationSignature,
                    scriptHash,
                    scriptInputFile: generatedScript.script_input_file || null,
                    scriptAttempts: generatedScript.script_attempts || null,
                    lastHttpStatus: generatedScript.last_http_status || null,
                    ttsTaskId: ttsResult.taskId || ttsTask?.taskId || null,
                    ttsFileId: ttsResult.fileId || ttsTask?.fileId || null,
                    ttsStatus: 'Success',
                    ttsVoiceKey,
                    scriptMarkdown: generatedScript.script_markdown,
                    scriptTtsText: generatedScript.script_tts_text,
                    scriptModel: config.script.model,
                    ttsModel: config.minimaxTts.model,
                    wechatCopy: generatedScript.wechat_copy,
                    excludedItems: generatedScript.excluded_items,
                    selectedTitles: generatedScript.selected_titles
                });
                readyMetadata.duration_seconds = normalizeAudioLengthSeconds(ttsResult.duration, generatedScript.script_tts_text);
                saveMetadata(date, readyMetadata);
            } catch (error) {
                const transcript = generatedScript?.script_tts_text || null;
                const scriptHash = transcript ? hashText(transcript) : null;
                const failedMetadata = createPlaceholderMetadata({
                    date,
                    articles,
                    summary: '播客生成失败，请稍后重试。',
                    canGenerate: true,
                    status: 'error',
                    transcript,
                    updatedAt: new Date().toISOString(),
                    contentHash,
                    promptHash,
                    generationSignature,
                    scriptHash,
                    scriptInputFile: generatedScript?.script_input_file || error.scriptInputFile || null,
                    scriptAttempts: generatedScript?.script_attempts || error.scriptAttempts || null,
                    lastHttpStatus: generatedScript?.last_http_status || error.lastHttpStatus || null,
                    lastErrorMessage: error.message,
                    ttsTaskId: error.ttsTaskId || ttsTask?.taskId || null,
                    ttsFileId: error.ttsFileId || ttsTask?.fileId || null,
                    ttsStatus: error.ttsStatus || (ttsTask ? 'Processing' : null),
                    ttsVoiceKey,
                    scriptMarkdown: generatedScript?.script_markdown || null,
                    scriptTtsText: transcript,
                    scriptModel: config.script.model,
                    ttsModel: config.minimaxTts.model,
                    wechatCopy: generatedScript?.wechat_copy || '',
                    excludedItems: generatedScript?.excluded_items || [],
                    selectedTitles: generatedScript?.selected_titles || [],
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
        queryMinimaxTaskStatus,
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
