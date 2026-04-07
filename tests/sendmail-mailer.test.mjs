import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    buildMimeMessage,
    createSendmailMailer,
    normalizeAddressList
} = require('../server/services/sendmail-mailer.js');

test('normalizeAddressList supports comma and semicolon separated recipients', () => {
    assert.deepEqual(
        normalizeAddressList('alpha@example.com; beta@example.com, gamma@example.com'),
        ['alpha@example.com', 'beta@example.com', 'gamma@example.com']
    );
});

test('buildMimeMessage includes text and binary attachments', () => {
    const raw = buildMimeMessage({
        from: 'AIcoming Podcast <no-reply@example.com>',
        to: ['noel@example.com'],
        subject: '2026-04-08 官网AI播客',
        text: '正文',
        attachments: [
            {
                fileName: '2026-04-08-podcast.mp3',
                mimeType: 'audio/mpeg',
                content: Buffer.from('fake-mp3')
            },
            {
                fileName: '2026-04-08-script.txt',
                mimeType: 'text/plain; charset=UTF-8',
                content: Buffer.from('口播稿', 'utf8')
            }
        ]
    });

    assert.match(raw, /Content-Type: multipart\/mixed/);
    assert.match(raw, /filename="2026-04-08-podcast\.mp3"/);
    assert.match(raw, /filename="2026-04-08-script\.txt"/);
    assert.match(raw, /ZmFrZS1tcDM=/);
});

test('createSendmailMailer writes the MIME payload to sendmail', () => {
    const calls = [];
    const mailer = createSendmailMailer({
        from: 'AIcoming Podcast <no-reply@example.com>',
        to: 'noel@example.com',
        subjectPrefix: '[AIcoming Podcast]',
        sendmailPath: '/usr/sbin/sendmail',
        spawnSyncImpl: (cmd, args, options) => {
            calls.push({ cmd, args, input: options.input });
            return {
                status: 0,
                stderr: '',
                stdout: ''
            };
        }
    });

    const result = mailer.sendMail({
        subject: '2026-04-08 官网AI播客',
        text: '正文',
        attachments: [
            {
                fileName: '2026-04-08-script.txt',
                mimeType: 'text/plain; charset=UTF-8',
                content: Buffer.from('附件正文', 'utf8')
            }
        ]
    });

    assert.equal(result.ok, true);
    assert.equal(result.subject, '[AIcoming Podcast] 2026-04-08 官网AI播客');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].cmd, '/usr/sbin/sendmail');
    assert.deepEqual(calls[0].args, ['-t', '-i', '-f', 'no-reply@example.com']);
    assert.match(calls[0].input, /Subject:/);
    assert.match(calls[0].input, /To: noel@example\.com/);
});
