import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import podcastEmailOnceModule from '../scripts/run-podcast-email-once.js';

const {
    runPodcastEmailOnce
} = podcastEmailOnceModule;

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

test('runPodcastEmailOnce skips when today metadata is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-once-missing-'));

    const result = await runPodcastEmailOnce({
        now: new Date('2026-04-08T00:10:00.000Z'),
        metadataDir: path.join(root, 'podcasts', 'news'),
        stateFile: path.join(root, 'podcast-email-state.json'),
        podcastEmailService: {
            async sendReadyPodcastEmail() {
                throw new Error('should not run');
            }
        }
    });

    assert.equal(result.action, 'skip');
    assert.equal(result.reason, 'podcast_missing_today');
});

test('runPodcastEmailOnce sends only todays ready podcast email', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-once-send-'));
    const metadataDir = path.join(root, 'podcasts', 'news');
    const calls = [];

    writeJson(path.join(metadataDir, '2026-04-07.json'), {
        status: 'ready',
        generation_signature: 'old-sig'
    });
    writeJson(path.join(metadataDir, '2026-04-08.json'), {
        status: 'ready',
        generation_signature: 'today-sig'
    });

    const result = await runPodcastEmailOnce({
        now: new Date('2026-04-08T00:10:00.000Z'),
        metadataDir,
        stateFile: path.join(root, 'podcast-email-state.json'),
        podcastEmailService: {
            async sendReadyPodcastEmail(payload) {
                calls.push(payload);
                return {
                    action: 'sent',
                    reason: 'email_sent'
                };
            }
        }
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].date, '2026-04-08');
    assert.equal(result.action, 'sent');
    assert.equal(result.reason, 'email_sent');
});

test('runPodcastEmailOnce skips when today metadata is not ready', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-once-pending-'));
    const metadataDir = path.join(root, 'podcasts', 'news');

    writeJson(path.join(metadataDir, '2026-04-08.json'), {
        status: 'pending'
    });

    const result = await runPodcastEmailOnce({
        now: new Date('2026-04-08T00:10:00.000Z'),
        metadataDir,
        stateFile: path.join(root, 'podcast-email-state.json'),
        podcastEmailService: {
            async sendReadyPodcastEmail() {
                throw new Error('should not run');
            }
        }
    });

    assert.equal(result.action, 'skip');
    assert.equal(result.reason, 'podcast_not_ready');
});
