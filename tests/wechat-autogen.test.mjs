import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import autogenModule from '../scripts/run-wechat-autogen-once.js';

const {
    runWechatAutogenOnce
} = autogenModule;

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

test('runWechatAutogenOnce skips report upload when today report json is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-missing-'));
    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir: path.join(root, 'podcasts'),
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        publisher: {
            async publishMarkdownDraft() {
                throw new Error('should not run');
            }
        }
    });

    assert.equal(result.date, '2026-04-02');
    assert.equal(result.report.action, 'skip');
    assert.equal(result.report.reason, 'report_missing_today');
    assert.equal(result.podcast.action, 'skip');
});

test('runWechatAutogenOnce uploads only todays ready podcast and never falls back to older metadata', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-podcast-'));
    const reportDir = path.join(root, 'report');
    const podcastMetadataDir = path.join(root, 'podcasts');
    const calls = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-01.json'), {
        status: 'ready',
        summary: '旧播客',
        script_markdown: '旧内容',
        audio_url: '/api/podcast/news/2026-04-01/audio'
    });
    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        summary: '今播播客摘要',
        script_markdown: '今播播客正文',
        wechat_copy: '今日转发文案',
        audio_url: '/api/podcast/news/2026-04-02/audio'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir,
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        siteBaseUrl: 'https://ai-coming.example.com',
        publisher: {
            async publishMarkdownDraft(payload) {
                calls.push(payload.kind);
                return { media_id: `${payload.kind}-draft` };
            }
        }
    });

    assert.deepEqual(calls, ['podcast']);
    assert.equal(result.podcast.action, 'uploaded');
    assert.equal(result.podcast.reason, 'podcast_ready_today');
    assert.equal(result.report.action, 'skip');
});
