import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createPodcastEmailConfigFromEnv,
    createPodcastEmailFingerprint,
    createPodcastEmailService
} = require('../server/services/podcast-email.js');

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

test('createPodcastEmailFingerprint is stable for same metadata payload', () => {
    const metadata = {
        generation_signature: 'sig-1',
        audio_url: 'https://cdn.example.com/audio.mp3',
        script_hash: 'hash-1'
    };

    const left = createPodcastEmailFingerprint({
        date: '2026-04-08',
        metadata,
        recipient: 'noel.huang@aicoming.cn'
    });
    const right = createPodcastEmailFingerprint({
        date: '2026-04-08',
        metadata,
        recipient: 'noel.huang@aicoming.cn'
    });

    assert.equal(left, right);
});

test('createPodcastEmailConfigFromEnv defaults email sending to disabled until explicitly enabled', () => {
    const config = createPodcastEmailConfigFromEnv({});

    assert.equal(config.enabled, false);
    assert.equal(config.to, 'noel.huang@aicoming.cn');
});

test('sendReadyPodcastEmail sends once and skips duplicate same fingerprint', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-local-'));
    const metadataDir = path.join(root, 'podcasts', 'news');
    const audioDir = path.join(metadataDir, 'audio');
    const stateFile = path.join(root, 'podcast-email-state.json');
    const sent = [];

    fs.mkdirSync(audioDir, { recursive: true });
    fs.writeFileSync(path.join(audioDir, '2026-04-08.mp3'), 'fake-mp3');

    const service = createPodcastEmailService({
        metadataDir,
        stateFile,
        config: {
            enabled: true,
            to: 'noel.huang@aicoming.cn'
        },
        emailSender: {
            async sendEmail(payload) {
                sent.push(payload);
                return { messageId: 'mid-1' };
            }
        }
    });

    const metadata = {
        status: 'ready',
        title: 'AI资讯日报播客',
        summary: '今天的摘要',
        script_tts_text: '今天的完整口播稿。',
        audio_storage: 'local',
        audio_file: '2026-04-08.mp3',
        audio_mime_type: 'audio/mpeg',
        audio_url: '/api/podcast/news/2026-04-08/audio',
        generation_signature: 'sig-1',
        script_hash: 'hash-1'
    };

    const first = await service.sendReadyPodcastEmail({
        date: '2026-04-08',
        metadata
    });
    const second = await service.sendReadyPodcastEmail({
        date: '2026-04-08',
        metadata
    });

    assert.equal(first.action, 'sent');
    assert.equal(second.action, 'skip');
    assert.equal(second.reason, 'same_fingerprint');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'noel.huang@aicoming.cn');
    assert.match(sent[0].subject, /2026-04-08/);
    assert.match(sent[0].text, /完整口播稿/);
    assert.equal(sent[0].attachments.length, 1);
    assert.equal(sent[0].attachments[0].filename, '2026-04-08.mp3');

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.ok(state.dates['2026-04-08'].last_success_at);
    assert.equal(state.dates['2026-04-08'].last_error, null);
});

test('sendReadyPodcastEmail records error when mail send fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-fail-'));
    const metadataDir = path.join(root, 'podcasts', 'news');
    const stateFile = path.join(root, 'podcast-email-state.json');

    const service = createPodcastEmailService({
        metadataDir,
        stateFile,
        config: {
            enabled: true,
            to: 'noel.huang@aicoming.cn'
        },
        emailSender: {
            async sendEmail() {
                throw new Error('smtp unavailable');
            }
        }
    });

    const metadata = {
        status: 'ready',
        title: 'AI资讯日报播客',
        summary: '今天的摘要',
        script_tts_text: '今天的完整口播稿。',
        audio_storage: 'oss',
        audio_url: 'https://cdn.example.com/audio.mp3',
        generation_signature: 'sig-2',
        script_hash: 'hash-2'
    };

    await assert.rejects(
        service.sendReadyPodcastEmail({
            date: '2026-04-08',
            metadata
        }),
        /smtp unavailable/
    );

    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(state.dates['2026-04-08'].last_error, 'smtp unavailable');
    assert.equal(state.dates['2026-04-08'].last_success_at, null);
});

test('sendReadyPodcastEmail keeps audio url in email body when remote attachment fetch fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-remote-'));
    const metadataDir = path.join(root, 'podcasts', 'news');
    const stateFile = path.join(root, 'podcast-email-state.json');
    const sent = [];

    const service = createPodcastEmailService({
        metadataDir,
        stateFile,
        config: {
            enabled: true,
            to: 'noel.huang@aicoming.cn'
        },
        emailSender: {
            async sendEmail(payload) {
                sent.push(payload);
                return { messageId: 'mid-2' };
            }
        },
        fetchImpl: async () => {
            throw new Error('download failed');
        }
    });

    const metadata = {
        status: 'ready',
        title: 'AI资讯日报播客',
        summary: '今天的摘要',
        script_tts_text: '今天的完整口播稿。',
        audio_storage: 'oss',
        audio_mime_type: 'audio/mpeg',
        audio_url: 'https://cdn.example.com/audio.mp3',
        generation_signature: 'sig-3',
        script_hash: 'hash-3'
    };

    const result = await service.sendReadyPodcastEmail({
        date: '2026-04-08',
        metadata
    });

    assert.equal(result.action, 'sent');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].attachments.length, 0);
    assert.match(sent[0].text, /https:\/\/cdn\.example\.com\/audio\.mp3/);
});
