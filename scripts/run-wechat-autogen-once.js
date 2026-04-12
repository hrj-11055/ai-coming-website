#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    buildNewsMarkdown,
    buildPodcastMarkdown,
    buildPodcastVoiceMessageText,
    buildWechatDigest,
    formatWechatPodcastTitle,
    formatWechatTitle,
    hashText
} = require('../server/services/wechat-content');
const { createMinimaxAudioClient, createMinimaxTtsClient } = require('../server/services/minimax-audio');
const { createWechatPodcastFormatter } = require('../server/services/wechat-podcast-formatter');
const { createWechatPublisher } = require('../server/services/wechat-publisher');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_REPORT_DIR = process.env.WECHAT_AUTOGEN_REPORT_DIR || '/var/www/json/report';
const DEFAULT_PODCAST_METADATA_DIR = process.env.WECHAT_AUTOGEN_PODCAST_METADATA_DIR || path.join(ROOT_DIR, 'data', 'podcasts', 'news');
const DEFAULT_STATE_FILE = process.env.WECHAT_AUTOGEN_STATE_FILE || path.join(ROOT_DIR, 'data', 'wechat-autogen-state.json');
const DEFAULT_STAGING_DIR = process.env.WECHAT_AUTOGEN_STAGING_DIR || path.join(ROOT_DIR, 'data', 'wechat-staging');
const DEFAULT_TIMEZONE = process.env.WECHAT_AUTOGEN_TIMEZONE || 'Asia/Shanghai';
const DEFAULT_START_HOUR = Number(process.env.WECHAT_AUTOGEN_START_HOUR || 9);
const DEFAULT_START_MINUTE = Number(process.env.WECHAT_AUTOGEN_START_MINUTE || 5);
const DEFAULT_SITE_BASE_URL = process.env.WECHAT_AUTOGEN_SITE_BASE_URL || '';
const DEFAULT_ENABLED = isFeatureEnabled(process.env.WECHAT_AUTOGEN_ENABLED, false);
const DEFAULT_ENABLED_TYPES = String(process.env.WECHAT_AUTOGEN_ENABLED_TYPES || 'podcast,markdown')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

function ensureParentDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonFileSafe(filePath, fallbackValue = null) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallbackValue;
    }
}

function writeJsonFile(filePath, value) {
    ensureParentDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writeTextFile(filePath, value) {
    ensureParentDir(filePath);
    fs.writeFileSync(filePath, value, 'utf8');
}

function getArg(flag) {
    const index = process.argv.indexOf(flag);
    return index === -1 ? null : (process.argv[index + 1] || null);
}

function hasFlag(flag) {
    return process.argv.includes(flag);
}

function isFeatureEnabled(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return !['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

function getCurrentDateInfo(timeZone, now = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = Object.fromEntries(
        formatter.formatToParts(now).map((part) => [part.type, part.value])
    );

    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour),
        minute: Number(parts.minute)
    };
}

function isWithinScanWindow({ hour, minute }, startHour, startMinute) {
    return hour > startHour || (hour === startHour && minute >= startMinute);
}

function createFileFingerprint(filePath) {
    const stats = fs.statSync(filePath);
    return [filePath, stats.size, stats.mtimeMs].join(':');
}

function createPodcastFingerprint(metadata, formatterFingerprint = '') {
    return hashText(JSON.stringify({
        status: metadata?.status || '',
        summary: metadata?.summary || '',
        script_markdown: metadata?.script_markdown || '',
        audio_url: metadata?.audio_url || '',
        wechat_podcast_title: formatWechatPodcastTitle(),
        formatter_fingerprint: formatterFingerprint || ''
    }));
}

function createPodcastAudioFingerprint(metadata, deliveryFingerprint = '', shortVoiceText = '') {
    return hashText(JSON.stringify({
        status: metadata?.status || '',
        audio_url: metadata?.audio_url || '',
        audio_file: metadata?.audio_file || '',
        audio_storage: metadata?.audio_storage || '',
        audio_mime_type: metadata?.audio_mime_type || '',
        tts_file_id: metadata?.tts_file_id || '',
        content_hash: metadata?.content_hash || '',
        generation_signature: metadata?.generation_signature || '',
        short_voice_text: shortVoiceText || '',
        delivery_fingerprint: deliveryFingerprint || ''
    }));
}

function normalizeBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
}

function toAbsoluteUrl(siteBaseUrl, maybeRelativeUrl) {
    const input = String(maybeRelativeUrl || '').trim();
    if (!input) {
        return '';
    }

    if (/^https?:\/\//i.test(input)) {
        return input;
    }

    const baseUrl = normalizeBaseUrl(siteBaseUrl);
    return baseUrl ? `${baseUrl}${input.startsWith('/') ? '' : '/'}${input}` : '';
}

function resolveLocalPodcastAudioPath(podcastMetadataDir, metadata) {
    if (!metadata || metadata.audio_storage !== 'local' || !metadata.audio_file) {
        return null;
    }

    const audioDir = path.join(podcastMetadataDir, 'audio');
    const resolvedPath = path.resolve(audioDir, metadata.audio_file);
    const relativePath = path.relative(audioDir, resolvedPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath) || !fs.existsSync(resolvedPath)) {
        return null;
    }

    return resolvedPath;
}

function normalizeResult(action, reason, extra = {}) {
    return {
        action,
        reason,
        ...extra
    };
}

async function maybePublishReport({
    date,
    reportDir,
    stagingDir,
    state,
    publisher,
    enabledTypes
}) {
    if (!enabledTypes.has('markdown')) {
        return normalizeResult('skip', 'markdown_disabled');
    }

    const reportPath = path.join(reportDir, `${date}.json`);
    if (!fs.existsSync(reportPath)) {
        return normalizeResult('skip', 'report_missing_today');
    }

    const report = readJsonFileSafe(reportPath, null);
    const articles = Array.isArray(report) ? report : (Array.isArray(report?.articles) ? report.articles : []);
    if (!report || articles.length === 0) {
        return normalizeResult('skip', 'report_invalid_today', { reportPath });
    }

    const fingerprint = createFileFingerprint(reportPath);
    if (state?.markdown?.last_uploaded_fingerprint === fingerprint) {
        return normalizeResult('skip', 'same_fingerprint', { reportPath, fingerprint });
    }

    const markdown = buildNewsMarkdown({ date, report });
    const digest = buildWechatDigest(markdown.replace(/^# .+$/m, '').replace(/\n+/g, ' '));
    const stagingPath = path.join(stagingDir, `${date}-news.md`);
    writeTextFile(stagingPath, markdown);

    const publishResult = await publisher.publishMarkdownDraft({
        kind: 'markdown',
        title: formatWechatTitle(date),
        markdown,
        digest
    });

    return normalizeResult('uploaded', 'report_ready_today', {
        reportPath,
        fingerprint,
        stagingPath,
        mediaId: publishResult.media_id || null
    });
}

async function maybePublishPodcast({
    date,
    podcastMetadataDir,
    stagingDir,
    state,
    publisher,
    podcastFormatter,
    enabledTypes,
    siteBaseUrl
}) {
    if (!enabledTypes.has('podcast')) {
        return normalizeResult('skip', 'podcast_disabled');
    }

    const metadataPath = path.join(podcastMetadataDir, `${date}.json`);
    if (!fs.existsSync(metadataPath)) {
        return normalizeResult('skip', 'podcast_missing_today');
    }

    const metadata = readJsonFileSafe(metadataPath, null);
    if (!metadata || metadata.status !== 'ready') {
        return normalizeResult('skip', 'podcast_not_ready', { metadataPath });
    }

    const formatterFingerprint = typeof podcastFormatter.getFingerprint === 'function'
        ? (podcastFormatter.getFingerprint() || '')
        : '';
    const fingerprint = createPodcastFingerprint(metadata, formatterFingerprint);
    if (state?.podcast?.last_uploaded_fingerprint === fingerprint) {
        return normalizeResult('skip', 'same_fingerprint', { metadataPath, fingerprint });
    }

    const podcastTitle = formatWechatPodcastTitle(date);
    const sourceMarkdown = buildPodcastMarkdown({ date, metadata, siteBaseUrl });
    let markdown = sourceMarkdown;
    let digest = buildWechatDigest(metadata.summary || markdown);
    let formatterFallbackReason = null;

    try {
        const formatted = await podcastFormatter.formatForWechat({
            title: podcastTitle,
            summary: metadata.summary || '',
            scriptMarkdown: sourceMarkdown,
            wechatCopy: metadata.wechat_copy || ''
        });

        markdown = formatted.markdown;
        digest = formatted.digest || buildWechatDigest(metadata.summary || markdown);
    } catch (error) {
        formatterFallbackReason = error?.message || 'unknown_formatter_error';
        console.warn(`[wechat-autogen] podcast formatter failed, fallback to source markdown: ${formatterFallbackReason}`);
    }
    const stagingPath = path.join(stagingDir, `${date}-podcast.md`);
    writeTextFile(stagingPath, markdown);

    const publishResult = await publisher.publishMarkdownDraft({
        kind: 'podcast',
        title: podcastTitle,
        markdown,
        digest
    });

    return normalizeResult('uploaded', 'podcast_ready_today', {
        metadataPath,
        fingerprint,
        stagingPath,
        mediaId: publishResult.media_id || null,
        formatterFallbackReason
    });
}

async function maybePublishPodcastAudio({
    date,
    podcastMetadataDir,
    state,
    publisher,
    podcastAudioDownloader,
    podcastAudioSynthesizer,
    enabledTypes,
    siteBaseUrl
}) {
    if (!enabledTypes.has('podcast_audio')) {
        return normalizeResult('skip', 'podcast_audio_disabled');
    }

    const metadataPath = path.join(podcastMetadataDir, `${date}.json`);
    if (!fs.existsSync(metadataPath)) {
        return normalizeResult('skip', 'podcast_missing_today');
    }

    const metadata = readJsonFileSafe(metadataPath, null);
    if (!metadata || metadata.status !== 'ready') {
        return normalizeResult('skip', 'podcast_not_ready', { metadataPath });
    }

    const preferRemoteAudio = metadata.audio_storage !== 'local';
    let audioPath = preferRemoteAudio ? null : resolveLocalPodcastAudioPath(podcastMetadataDir, metadata);
    let audioUrl = preferRemoteAudio ? toAbsoluteUrl(siteBaseUrl, metadata.audio_url || '') : '';
    let audioBuffer = null;
    let fileName = audioPath ? path.basename(audioPath) : '';
    const shortVoiceText = buildPodcastVoiceMessageText(metadata);

    if (shortVoiceText) {
        try {
            const synthesized = await podcastAudioSynthesizer.synthesizeTextToAudioBuffer(shortVoiceText);
            audioBuffer = synthesized.audioBuffer;
            fileName = synthesized.fileName || `podcast-${date}.mp3`;
            audioPath = null;
            audioUrl = '';
        } catch (error) {
            console.warn(`[wechat-autogen] podcast audio short tts failed, fallback to existing audio source: ${error.message}`);
        }
    }

    if (!audioBuffer && !audioPath && !audioUrl && metadata?.tts_file_id) {
        const downloaded = await podcastAudioDownloader.downloadAudioBufferFromFileId(metadata.tts_file_id);
        audioBuffer = downloaded.audioBuffer;
        fileName = downloaded.fileName || `podcast-${date}.mp3`;
    }

    if (!audioPath && !audioUrl && !audioBuffer) {
        return normalizeResult('skip', 'podcast_audio_missing', { metadataPath });
    }

    const deliveryFingerprint = typeof publisher.getAudioDeliveryFingerprint === 'function'
        ? (publisher.getAudioDeliveryFingerprint() || '')
        : '';
    const fingerprint = createPodcastAudioFingerprint(metadata, deliveryFingerprint, shortVoiceText);
    if (state?.podcast_audio?.last_uploaded_fingerprint === fingerprint) {
        return normalizeResult('skip', 'same_fingerprint', { metadataPath, fingerprint });
    }

    const publishResult = await publisher.publishPodcastAudio({
        date,
        title: formatWechatTitle(date),
        audioPath,
        audioUrl,
        audioBuffer,
        fileName: fileName || (audioUrl ? path.basename(new URL(audioUrl).pathname || 'podcast.mp3') : `podcast-${date}.mp3`)
    });

    return normalizeResult('sent', 'podcast_audio_ready_today', {
        metadataPath,
        fingerprint,
        audioPath,
        audioUrl: audioUrl || null,
        mediaId: publishResult.voice_media_id || null,
        messageId: publishResult.msg_id || null,
        deliveryMode: publishResult.delivery_mode || null
    });
}

async function runWechatAutogenOnce(options = {}) {
    const reportDir = options.reportDir || getArg('--report-dir') || DEFAULT_REPORT_DIR;
    const podcastMetadataDir = options.podcastMetadataDir || getArg('--podcast-metadata-dir') || DEFAULT_PODCAST_METADATA_DIR;
    const stateFile = options.stateFile || getArg('--state-file') || DEFAULT_STATE_FILE;
    const stagingDir = options.stagingDir || getArg('--staging-dir') || DEFAULT_STAGING_DIR;
    const timeZone = options.timeZone || getArg('--timezone') || DEFAULT_TIMEZONE;
    const startHour = Number(options.startHour ?? getArg('--start-hour') ?? DEFAULT_START_HOUR);
    const startMinute = Number(options.startMinute ?? getArg('--start-minute') ?? DEFAULT_START_MINUTE);
    const siteBaseUrl = options.siteBaseUrl || getArg('--site-base-url') || DEFAULT_SITE_BASE_URL;
    const enabled = isFeatureEnabled(options.enabled ?? getArg('--enabled') ?? DEFAULT_ENABLED, DEFAULT_ENABLED);
    const enabledTypes = new Set((options.enabledTypes || DEFAULT_ENABLED_TYPES).map((value) => String(value).toLowerCase()));
    const now = options.now || new Date();
    const dateInfo = getCurrentDateInfo(timeZone, now);
    const state = readJsonFileSafe(stateFile, {}) || {};

    state.last_scan_at = now.toISOString();
    state.last_scan_date = dateInfo.date;

    if (!enabled) {
        state.last_skip_reason = 'disabled';
        writeJsonFile(stateFile, state);
        return {
            ok: true,
            action: 'skip',
            reason: 'disabled',
            date: dateInfo.date,
            report: normalizeResult('skip', 'disabled'),
            podcast: normalizeResult('skip', 'disabled'),
            podcastAudio: normalizeResult('skip', 'disabled')
        };
    }

    if (!isWithinScanWindow(dateInfo, startHour, startMinute)) {
        state.last_skip_reason = 'outside_scan_window';
        writeJsonFile(stateFile, state);
        return {
            ok: true,
            action: 'skip',
            reason: 'outside_scan_window',
            date: dateInfo.date
        };
    }

    let publisher = options.publisher || null;
    let podcastFormatter = options.podcastFormatter || null;
    let podcastAudioDownloader = options.podcastAudioDownloader || null;
    let podcastAudioSynthesizer = options.podcastAudioSynthesizer || null;
    function getPublisher() {
        if (!publisher) {
            publisher = createWechatPublisher(options.publisherOptions || {});
        }
        return publisher;
    }
    function getPodcastFormatter() {
        if (!podcastFormatter) {
            podcastFormatter = createWechatPodcastFormatter(options.podcastFormatterOptions || {});
        }
        return podcastFormatter;
    }
    function getPodcastAudioDownloader() {
        if (!podcastAudioDownloader) {
            podcastAudioDownloader = createMinimaxAudioClient(options.podcastAudioDownloaderOptions || {});
        }
        return podcastAudioDownloader;
    }
    function getPodcastAudioSynthesizer() {
        if (!podcastAudioSynthesizer) {
            podcastAudioSynthesizer = createMinimaxTtsClient(options.podcastAudioSynthesizerOptions || {});
        }
        return podcastAudioSynthesizer;
    }
    const reportResult = await maybePublishReport({
        date: dateInfo.date,
        reportDir,
        stagingDir,
        state,
        publisher: {
            publishMarkdownDraft(payload) {
                return getPublisher().publishMarkdownDraft(payload);
            }
        },
        enabledTypes
    });
    const podcastResult = await maybePublishPodcast({
        date: dateInfo.date,
        podcastMetadataDir,
        stagingDir,
        state,
        publisher: {
            publishMarkdownDraft(payload) {
                return getPublisher().publishMarkdownDraft(payload);
            }
        },
        podcastFormatter: {
            getFingerprint() {
                return typeof getPodcastFormatter().getFingerprint === 'function'
                    ? getPodcastFormatter().getFingerprint()
                    : '';
            },
            formatForWechat(payload) {
                return getPodcastFormatter().formatForWechat(payload);
            }
        },
        enabledTypes,
        siteBaseUrl
    });
    const podcastAudioResult = await maybePublishPodcastAudio({
        date: dateInfo.date,
        podcastMetadataDir,
        state,
        publisher: {
            getAudioDeliveryFingerprint() {
                return typeof getPublisher().getAudioDeliveryFingerprint === 'function'
                    ? getPublisher().getAudioDeliveryFingerprint()
                    : '';
            },
            publishPodcastAudio(payload) {
                return getPublisher().publishPodcastAudio(payload);
            }
        },
        podcastAudioDownloader: {
            downloadAudioBufferFromFileId(fileId) {
                return getPodcastAudioDownloader().downloadAudioBufferFromFileId(fileId);
            }
        },
        podcastAudioSynthesizer: {
            synthesizeTextToAudioBuffer(text) {
                return getPodcastAudioSynthesizer().synthesizeTextToAudioBuffer(text);
            }
        },
        enabledTypes,
        siteBaseUrl
    });

    state.last_skip_reason = null;
    state.markdown = {
        last_attempted_date: dateInfo.date,
        last_uploaded_fingerprint: reportResult.action === 'uploaded' ? reportResult.fingerprint : (state.markdown?.last_uploaded_fingerprint || null),
        last_result: reportResult.action,
        last_reason: reportResult.reason,
        last_media_id: reportResult.mediaId || null,
        last_error: null
    };
    state.podcast = {
        last_attempted_date: dateInfo.date,
        last_uploaded_fingerprint: podcastResult.action === 'uploaded' ? podcastResult.fingerprint : (state.podcast?.last_uploaded_fingerprint || null),
        last_result: podcastResult.action,
        last_reason: podcastResult.reason,
        last_media_id: podcastResult.mediaId || null,
        last_error: null
    };
    state.podcast_audio = {
        last_attempted_date: dateInfo.date,
        last_uploaded_fingerprint: podcastAudioResult.action === 'sent' ? podcastAudioResult.fingerprint : (state.podcast_audio?.last_uploaded_fingerprint || null),
        last_result: podcastAudioResult.action,
        last_reason: podcastAudioResult.reason,
        last_media_id: podcastAudioResult.mediaId || null,
        last_message_id: podcastAudioResult.messageId || null,
        last_delivery_mode: podcastAudioResult.deliveryMode || null,
        last_error: null
    };
    writeJsonFile(stateFile, state);

    return {
        ok: true,
        date: dateInfo.date,
        report: reportResult,
        podcast: podcastResult,
        podcastAudio: podcastAudioResult
    };
}

if (require.main === module) {
    runWechatAutogenOnce()
        .then((result) => {
            if (result.action === 'skip' || hasFlag('--verbose')) {
                console.log(`[wechat-autogen] ${JSON.stringify(result)}`);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error(`[wechat-autogen] failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = {
    createFileFingerprint,
    createPodcastAudioFingerprint,
    createPodcastFingerprint,
    getCurrentDateInfo,
    isFeatureEnabled,
    isWithinScanWindow,
    runWechatAutogenOnce
};
