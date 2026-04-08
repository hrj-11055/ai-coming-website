const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
    createEmailSender
} = require('./email-sender');

const DEFAULT_RECIPIENT = 'noel.huang@aicoming.cn';

function hashText(value) {
    return crypto.createHash('sha1').update(String(value || '')).digest('hex');
}

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

function normalizeBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return String(value).trim().toLowerCase() === 'true';
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
    if (!baseUrl) {
        return input;
    }

    return `${baseUrl}${input.startsWith('/') ? '' : '/'}${input}`;
}

function inferAudioFilename(date, metadata, fallbackExtension = 'mp3') {
    const existingFile = String(metadata?.audio_file || '').trim();
    if (existingFile) {
        return path.basename(existingFile);
    }

    const remotePath = String(metadata?.audio_url || '').trim();
    if (remotePath) {
        try {
            const parsed = new URL(remotePath);
            const fileName = path.basename(parsed.pathname || '');
            if (fileName) {
                return fileName;
            }
        } catch {
            const fileName = path.basename(remotePath);
            if (fileName && fileName !== '.' && fileName !== '/') {
                return fileName;
            }
        }
    }

    return `${date}-podcast.${fallbackExtension}`;
}

function createPodcastEmailConfigFromEnv(env = process.env) {
    return {
        enabled: normalizeBoolean(env.PODCAST_EMAIL_ENABLED, true),
        to: String(env.PODCAST_EMAIL_TO || DEFAULT_RECIPIENT).trim() || DEFAULT_RECIPIENT,
        stateFile: env.PODCAST_EMAIL_STATE_FILE || path.join(process.cwd(), 'data', 'podcast-email-state.json'),
        siteBaseUrl: env.PODCAST_EMAIL_SITE_BASE_URL || env.WECHAT_AUTOGEN_SITE_BASE_URL || ''
    };
}

function createPodcastEmailFingerprint({
    date,
    metadata,
    recipient
}) {
    return hashText(JSON.stringify({
        date,
        recipient: String(recipient || '').trim().toLowerCase(),
        generation_signature: metadata?.generation_signature || '',
        audio_url: metadata?.audio_url || '',
        script_hash: metadata?.script_hash || hashText(metadata?.script_tts_text || metadata?.transcript || '')
    }));
}

function buildPodcastEmailSubject({
    date,
    metadata
}) {
    return `[AIcoming播客] ${date} ${metadata?.title || 'AI资讯日报播客'}`;
}

function buildPodcastEmailText({
    date,
    metadata,
    audioUrl,
    attachmentWarning = ''
}) {
    const transcript = String(metadata?.script_tts_text || metadata?.transcript || '').trim();
    const lines = [
        `日期：${date}`,
        `标题：${metadata?.title || 'AI资讯日报播客'}`,
        '',
        '摘要：',
        String(metadata?.summary || '无摘要').trim(),
        '',
        '完整口播稿：',
        transcript || '无口播稿',
        '',
        '音频链接：',
        audioUrl || '无可用音频链接'
    ];

    if (attachmentWarning) {
        lines.push('', `附件说明：${attachmentWarning}`);
    }

    return lines.join('\n');
}

function resolveLocalAudioPath(metadataDir, metadata) {
    if (!metadataDir || metadata?.audio_storage !== 'local' || !metadata?.audio_file) {
        return null;
    }

    const audioDir = path.join(metadataDir, 'audio');
    const resolvedPath = path.resolve(audioDir, metadata.audio_file);
    const relativePath = path.relative(audioDir, resolvedPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath) || !fs.existsSync(resolvedPath)) {
        return null;
    }

    return resolvedPath;
}

function createInitialState() {
    return {
        dates: {}
    };
}

function getDateState(state, date) {
    return state?.dates?.[date] || {
        last_attempt_at: null,
        last_attempt_date: null,
        last_success_at: null,
        last_success_date: null,
        last_error: null,
        last_fingerprint: null,
        last_audio_url: null,
        last_generation_signature: null,
        last_recipient: null
    };
}

async function resolveAudioAttachment({
    date,
    metadata,
    metadataDir,
    siteBaseUrl,
    audioBuffer,
    fetchImpl
}) {
    if (audioBuffer?.length) {
        return {
            attachment: {
                filename: inferAudioFilename(date, metadata),
                content: audioBuffer,
                contentType: metadata?.audio_mime_type || 'audio/mpeg'
            },
            warning: null
        };
    }

    const localAudioPath = resolveLocalAudioPath(metadataDir, metadata);
    if (localAudioPath) {
        return {
            attachment: {
                filename: path.basename(localAudioPath),
                content: fs.readFileSync(localAudioPath),
                contentType: metadata?.audio_mime_type || 'audio/mpeg'
            },
            warning: null
        };
    }

    const audioUrl = toAbsoluteUrl(siteBaseUrl, metadata?.audio_url || '');
    if (!/^https?:\/\//i.test(audioUrl)) {
        return {
            attachment: null,
            warning: null
        };
    }

    try {
        const response = await fetchImpl(audioUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const downloadedAudio = Buffer.from(await response.arrayBuffer());
        return {
            attachment: {
                filename: inferAudioFilename(date, metadata),
                content: downloadedAudio,
                contentType: metadata?.audio_mime_type || response.headers.get('content-type') || 'audio/mpeg'
            },
            warning: null
        };
    } catch (error) {
        return {
            attachment: null,
            warning: `音频附件获取失败，已保留链接（${error.message}）`
        };
    }
}

function createPodcastEmailService({
    metadataDir,
    stateFile = null,
    config = createPodcastEmailConfigFromEnv(process.env),
    emailSender = null,
    fetchImpl = fetch,
    now = () => new Date()
} = {}) {
    const resolvedStateFile = stateFile || config.stateFile;
    const sender = emailSender || createEmailSender();

    function readState() {
        return readJsonFileSafe(resolvedStateFile, createInitialState()) || createInitialState();
    }

    function writeState(nextState) {
        writeJsonFile(resolvedStateFile, nextState);
    }

    return {
        isEnabled() {
            return Boolean(config.enabled);
        },
        async sendReadyPodcastEmail({
            date,
            metadata,
            audioBuffer = null
        }) {
            if (!config.enabled) {
                return {
                    action: 'skip',
                    reason: 'email_disabled'
                };
            }

            if (!metadata || metadata.status !== 'ready') {
                return {
                    action: 'skip',
                    reason: 'podcast_not_ready'
                };
            }

            const state = readState();
            const dateState = getDateState(state, date);
            const recipient = config.to || DEFAULT_RECIPIENT;
            const audioUrl = toAbsoluteUrl(config.siteBaseUrl, metadata.audio_url || '');
            const fingerprint = createPodcastEmailFingerprint({
                date,
                metadata,
                recipient
            });

            if (dateState.last_success_at && dateState.last_fingerprint === fingerprint) {
                return {
                    action: 'skip',
                    reason: 'same_fingerprint',
                    fingerprint
                };
            }

            const attemptAt = now().toISOString();
            const attachmentResult = await resolveAudioAttachment({
                date,
                metadata,
                metadataDir,
                siteBaseUrl: config.siteBaseUrl,
                audioBuffer,
                fetchImpl
            });
            const text = buildPodcastEmailText({
                date,
                metadata,
                audioUrl,
                attachmentWarning: attachmentResult.warning
            });

            try {
                const mailResult = await sender.sendEmail({
                    to: recipient,
                    subject: buildPodcastEmailSubject({ date, metadata }),
                    text,
                    attachments: attachmentResult.attachment ? [attachmentResult.attachment] : []
                });

                state.dates[date] = {
                    ...dateState,
                    last_attempt_at: attemptAt,
                    last_attempt_date: date,
                    last_success_at: attemptAt,
                    last_success_date: date,
                    last_error: null,
                    last_fingerprint: fingerprint,
                    last_audio_url: audioUrl || null,
                    last_generation_signature: metadata.generation_signature || null,
                    last_recipient: recipient
                };
                writeState(state);

                return {
                    action: 'sent',
                    reason: 'email_sent',
                    fingerprint,
                    messageId: mailResult?.messageId || null
                };
            } catch (error) {
                state.dates[date] = {
                    ...dateState,
                    last_attempt_at: attemptAt,
                    last_attempt_date: date,
                    last_success_at: dateState.last_success_at || null,
                    last_success_date: dateState.last_success_date || null,
                    last_error: error.message,
                    last_fingerprint: fingerprint,
                    last_audio_url: audioUrl || null,
                    last_generation_signature: metadata.generation_signature || null,
                    last_recipient: recipient
                };
                writeState(state);
                throw error;
            }
        }
    };
}

module.exports = {
    buildPodcastEmailSubject,
    buildPodcastEmailText,
    createPodcastEmailConfigFromEnv,
    createPodcastEmailFingerprint,
    createPodcastEmailService
};
