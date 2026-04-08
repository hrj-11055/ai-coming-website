const nodemailer = require('nodemailer');

function normalizeBoolean(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return String(value).trim().toLowerCase() === 'true';
}

function createEmailConfigFromEnv(env = process.env) {
    return {
        host: String(env.SMTP_HOST || '').trim(),
        port: Number(env.SMTP_PORT || 0),
        secure: normalizeBoolean(env.SMTP_SECURE, false),
        auth: {
            user: String(env.SMTP_USER || '').trim(),
            pass: String(env.SMTP_PASS || '').trim()
        },
        from: String(env.SMTP_FROM || '').trim()
    };
}

function isEmailConfigured(config = {}) {
    return Boolean(
        config.host &&
        Number.isFinite(Number(config.port)) &&
        Number(config.port) > 0 &&
        config.auth?.user &&
        config.auth?.pass &&
        config.from
    );
}

function createEmailSender({
    config = createEmailConfigFromEnv(process.env),
    createTransport = nodemailer.createTransport
} = {}) {
    let transporter = null;

    function getTransporter() {
        if (!isEmailConfigured(config)) {
            throw new Error('缺少 SMTP 配置');
        }

        if (!transporter) {
            transporter = createTransport({
                host: config.host,
                port: Number(config.port),
                secure: Boolean(config.secure),
                auth: {
                    user: config.auth.user,
                    pass: config.auth.pass
                }
            });
        }

        return transporter;
    }

    return {
        isConfigured() {
            return isEmailConfigured(config);
        },
        async sendEmail({
            to,
            subject,
            text,
            html = null,
            attachments = []
        }) {
            if (!String(to || '').trim()) {
                throw new Error('邮件发送缺少收件人');
            }

            if (!String(subject || '').trim()) {
                throw new Error('邮件发送缺少主题');
            }

            return getTransporter().sendMail({
                from: config.from,
                to,
                subject,
                text: String(text || '').trim(),
                html: html || undefined,
                attachments
            });
        }
    };
}

module.exports = {
    createEmailConfigFromEnv,
    createEmailSender,
    isEmailConfigured
};
