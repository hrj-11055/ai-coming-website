const crypto = require('crypto');
const { spawnSync } = require('child_process');

function normalizeAddressList(value) {
    if (Array.isArray(value)) {
        return value
            .flatMap((item) => normalizeAddressList(item))
            .filter(Boolean);
    }

    return String(value || '')
        .split(/[;,]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function sanitizeHeaderValue(value) {
    return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

function encodeHeaderValue(value) {
    const sanitized = sanitizeHeaderValue(value);
    if (!sanitized) {
        return '';
    }

    return /^[\x20-\x7E]*$/.test(sanitized)
        ? sanitized
        : `=?UTF-8?B?${Buffer.from(sanitized, 'utf8').toString('base64')}?=`;
}

function inferMimeType(fileName, fallback = 'application/octet-stream') {
    const normalized = String(fileName || '').toLowerCase();
    if (normalized.endsWith('.txt')) {
        return 'text/plain; charset=UTF-8';
    }
    if (normalized.endsWith('.md')) {
        return 'text/markdown; charset=UTF-8';
    }
    if (normalized.endsWith('.mp3')) {
        return 'audio/mpeg';
    }
    if (normalized.endsWith('.wav')) {
        return 'audio/wav';
    }
    if (normalized.endsWith('.m4a')) {
        return 'audio/mp4';
    }
    if (normalized.endsWith('.json')) {
        return 'application/json';
    }

    return fallback;
}

function wrapBase64(buffer) {
    return Buffer.from(buffer)
        .toString('base64')
        .replace(/.{1,76}/g, '$&\r\n')
        .trimEnd();
}

function buildMimeMessage({
    from,
    to,
    subject,
    text,
    attachments = [],
    messageIdDomain = 'localhost'
}) {
    const recipients = normalizeAddressList(to);
    if (recipients.length === 0) {
        throw new Error('收件人为空，无法发送邮件');
    }

    const boundary = `----aicoming-${crypto.randomBytes(8).toString('hex')}`;
    const messageId = `<${Date.now().toString(16)}.${crypto.randomBytes(6).toString('hex')}@${sanitizeHeaderValue(messageIdDomain) || 'localhost'}>`;
    const lines = [
        `From: ${sanitizeHeaderValue(from || 'AIcoming Podcast <no-reply@localhost>')}`,
        `To: ${recipients.join(', ')}`,
        `Subject: ${encodeHeaderValue(subject || 'AIcoming Podcast')}`,
        `Date: ${new Date().toUTCString()}`,
        `Message-ID: ${messageId}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    ];

    attachments.forEach((attachment) => {
        const fileName = sanitizeHeaderValue(attachment.fileName || 'attachment.bin');
        const mimeType = attachment.mimeType || inferMimeType(fileName);
        const disposition = attachment.disposition || 'attachment';
        lines.push(
            '',
            `--${boundary}`,
            `Content-Type: ${mimeType}; name="${fileName}"`,
            `Content-Disposition: ${disposition}; filename="${fileName}"`,
            'Content-Transfer-Encoding: base64',
            '',
            wrapBase64(attachment.content || Buffer.alloc(0))
        );
    });

    lines.push('', `--${boundary}--`, '');
    return lines.join('\r\n');
}

function extractEnvelopeFrom(headerValue) {
    const source = sanitizeHeaderValue(headerValue);
    const angleMatch = source.match(/<([^>]+)>/);
    if (angleMatch) {
        return angleMatch[1].trim();
    }

    if (/\S+@\S+/.test(source)) {
        return source.trim();
    }

    return '';
}

function sendRawEmail({
    sendmailPath = '/usr/sbin/sendmail',
    rawMessage,
    from,
    spawnSyncImpl = spawnSync
}) {
    const args = ['-t', '-i'];
    const envelopeFrom = extractEnvelopeFrom(from);
    if (envelopeFrom) {
        args.push('-f', envelopeFrom);
    }

    const result = spawnSyncImpl(sendmailPath, args, {
        input: rawMessage,
        encoding: 'utf8'
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        const stderr = String(result.stderr || '').trim();
        throw new Error(`sendmail 发送失败: ${stderr || `exit ${result.status}`}`);
    }

    return {
        ok: true,
        exitCode: result.status,
        stderr: String(result.stderr || '').trim()
    };
}

function createSendmailMailer(options = {}) {
    const sendmailPath = options.sendmailPath || process.env.PODCAST_EMAIL_SENDMAIL_PATH || '/usr/sbin/sendmail';
    const defaultFrom = options.from || process.env.PODCAST_EMAIL_FROM || 'AIcoming Podcast <no-reply@localhost>';
    const defaultTo = normalizeAddressList(options.to || process.env.PODCAST_EMAIL_TO || '');
    const subjectPrefix = sanitizeHeaderValue(options.subjectPrefix || process.env.PODCAST_EMAIL_SUBJECT_PREFIX || '[AIcoming Podcast]');
    const messageIdDomain = options.messageIdDomain || process.env.PODCAST_EMAIL_MESSAGE_ID_DOMAIN || 'localhost';
    const spawnSyncImpl = options.spawnSyncImpl || spawnSync;

    return {
        getDeliveryFingerprint() {
            return crypto.createHash('sha1').update(JSON.stringify({
                sendmailPath,
                from: defaultFrom,
                to: defaultTo,
                subjectPrefix
            })).digest('hex');
        },
        sendMail(payload = {}) {
            const recipients = normalizeAddressList(payload.to && payload.to.length ? payload.to : defaultTo);
            const subject = payload.subjectPrefix === ''
                ? sanitizeHeaderValue(payload.subject || '')
                : `${sanitizeHeaderValue(payload.subjectPrefix || subjectPrefix)} ${sanitizeHeaderValue(payload.subject || '')}`.trim();
            const rawMessage = buildMimeMessage({
                from: payload.from || defaultFrom,
                to: recipients,
                subject,
                text: payload.text || '',
                attachments: payload.attachments || [],
                messageIdDomain: payload.messageIdDomain || messageIdDomain
            });

            return {
                ...sendRawEmail({
                    sendmailPath: payload.sendmailPath || sendmailPath,
                    rawMessage,
                    from: payload.from || defaultFrom,
                    spawnSyncImpl
                }),
                to: recipients,
                subject
            };
        }
    };
}

module.exports = {
    buildMimeMessage,
    createSendmailMailer,
    inferMimeType,
    normalizeAddressList,
    sendRawEmail
};
