import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createEmailConfigFromEnv,
    createEmailSender,
    isEmailConfigured
} = require('../server/services/email-sender.js');

test('createEmailConfigFromEnv maps smtp env values', () => {
    const config = createEmailConfigFromEnv({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_USER: 'bot@example.com',
        SMTP_PASS: 'secret',
        SMTP_FROM: 'AIcoming <bot@example.com>'
    });

    assert.equal(config.host, 'smtp.example.com');
    assert.equal(config.port, 465);
    assert.equal(config.secure, true);
    assert.equal(config.auth.user, 'bot@example.com');
    assert.equal(config.auth.pass, 'secret');
    assert.equal(config.from, 'AIcoming <bot@example.com>');
    assert.equal(isEmailConfigured(config), true);
});

test('createEmailSender sends message through injected transporter', async () => {
    const sentMessages = [];
    const sender = createEmailSender({
        createTransport(config) {
            assert.equal(config.host, 'smtp.example.com');
            assert.equal(config.port, 465);
            return {
                async sendMail(payload) {
                    sentMessages.push(payload);
                    return { messageId: 'mid-1' };
                }
            };
        },
        config: {
            host: 'smtp.example.com',
            port: 465,
            secure: true,
            auth: {
                user: 'bot@example.com',
                pass: 'secret'
            },
            from: 'AIcoming <bot@example.com>'
        }
    });

    const result = await sender.sendEmail({
        to: 'noel.huang@aicoming.cn',
        subject: 'Daily podcast',
        text: 'hello world'
    });

    assert.equal(result.messageId, 'mid-1');
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].to, 'noel.huang@aicoming.cn');
    assert.equal(sentMessages[0].subject, 'Daily podcast');
    assert.equal(sentMessages[0].from, 'AIcoming <bot@example.com>');
});
