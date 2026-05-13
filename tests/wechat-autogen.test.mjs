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
        enabled: true,
        enabledTypes: ['markdown', 'podcast'],
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

test('runWechatAutogenOnce is disabled by default and records skip state', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-disabled-'));
    const stateFile = path.join(root, 'state.json');

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-08T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir: path.join(root, 'podcasts'),
        stagingDir: path.join(root, 'staging'),
        stateFile
    });

    assert.equal(result.action, 'skip');
    assert.equal(result.reason, 'disabled');
    assert.equal(result.report.reason, 'disabled');
    assert.equal(result.podcast.reason, 'disabled');
    assert.equal(result.podcastAudio.reason, 'disabled');

    const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(savedState.last_skip_reason, 'disabled');
    assert.equal(savedState.last_scan_date, '2026-04-08');
});

test('runWechatAutogenOnce does not require wechat credentials when todays content is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-no-creds-'));

    const previousAppId = process.env.WECHAT_APP_ID;
    const previousAppSecret = process.env.WECHAT_APP_SECRET;
    delete process.env.WECHAT_APP_ID;
    delete process.env.WECHAT_APP_SECRET;

    try {
        const result = await runWechatAutogenOnce({
            now: new Date('2026-04-02T02:00:00.000Z'),
            reportDir: path.join(root, 'report'),
            podcastMetadataDir: path.join(root, 'podcasts'),
            stagingDir: path.join(root, 'staging'),
            stateFile: path.join(root, 'state.json'),
            enabled: true,
            enabledTypes: ['markdown', 'podcast']
        });

        assert.equal(result.report.reason, 'report_missing_today');
        assert.equal(result.podcast.reason, 'podcast_missing_today');
    } finally {
        if (typeof previousAppId === 'string') {
            process.env.WECHAT_APP_ID = previousAppId;
        } else {
            delete process.env.WECHAT_APP_ID;
        }

        if (typeof previousAppSecret === 'string') {
            process.env.WECHAT_APP_SECRET = previousAppSecret;
        } else {
            delete process.env.WECHAT_APP_SECRET;
        }
    }
});

test('runWechatAutogenOnce uploads only todays ready podcast and never falls back to older metadata', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-podcast-'));
    const reportDir = path.join(root, 'report');
    const podcastMetadataDir = path.join(root, 'podcasts');
    const calls = [];
    const packagingCalls = [];

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
        enabled: true,
        enabledTypes: ['markdown', 'podcast'],
        podcastFormatter: {
            async formatForWechat({ title, summary, scriptMarkdown, wechatCopy }) {
                packagingCalls.push({ title, summary, scriptMarkdown, wechatCopy });
                return {
                    markdown: `# ${title}\n\n播客文字版\n\n${scriptMarkdown}\n\n${wechatCopy}`,
                    digest: summary
                };
            }
        },
        publisher: {
            async publishMarkdownDraft(payload) {
                calls.push({ kind: payload.kind, title: payload.title });
                assert.doesNotMatch(payload.markdown, /https:\/\/ai-coming\.example\.com\/api\/podcast\/news\/2026-04-02\/audio/);
                return { media_id: `${payload.kind}-draft` };
            }
        }
    });

    assert.deepEqual(calls, [{ kind: 'podcast', title: '硅基生存指南 2026.04.02.' }]);
    assert.equal(packagingCalls.length, 1);
    assert.equal(packagingCalls[0].title, '硅基生存指南 2026.04.02.');
    assert.match(packagingCalls[0].scriptMarkdown, /今播播客正文/);
    assert.equal(result.podcast.action, 'uploaded');
    assert.equal(result.podcast.reason, 'podcast_ready_today');
    assert.equal(result.report.action, 'skip');
});

test('runWechatAutogenOnce republishes podcast when formatter fingerprint changes', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-fingerprint-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const stateFile = path.join(root, 'state.json');
    const uploads = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        summary: '今播播客摘要',
        script_markdown: '今播播客正文'
    });
    writeJson(stateFile, {
        podcast: {
            last_uploaded_fingerprint: 'legacy-fingerprint'
        }
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile,
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['podcast'],
        podcastFormatter: {
            getFingerprint() {
                return 'formatter-v2';
            },
            async formatForWechat({ title, scriptMarkdown }) {
                return {
                    markdown: `# ${title}\n\n${scriptMarkdown}`,
                    digest: '今播播客摘要'
                };
            }
        },
        publisher: {
            async publishMarkdownDraft(payload) {
                uploads.push(payload);
                return { media_id: 'podcast-draft' };
            }
        }
    });

    assert.equal(uploads.length, 1);
    assert.equal(result.podcast.action, 'uploaded');
});

test('runWechatAutogenOnce skips podcast draft when required infographic fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-infographic-fail-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const stateFile = path.join(root, 'state.json');
    const uploads = [];

    writeJson(path.join(podcastMetadataDir, '2026-05-13.json'), {
        status: 'ready',
        summary: '今播播客摘要',
        script_markdown: '今播播客正文'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-05-13T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile,
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        requireInfographic: true,
        enabledTypes: ['podcast'],
        podcastFormatter: {
            getFingerprint() {
                return 'formatter-v2';
            },
            async formatForWechat({ title, scriptMarkdown }) {
                return {
                    markdown: `# ${title}\n\n${scriptMarkdown}`,
                    digest: '今播播客摘要'
                };
            }
        },
        infographicGenerator: {
            async generateInfographic() {
                throw new Error('image timeout');
            }
        },
        publisher: {
            async uploadNewsImageForContent() {
                throw new Error('should not upload image');
            },
            async publishMarkdownDraft(payload) {
                uploads.push(payload);
                return { media_id: 'podcast-draft' };
            }
        }
    });

    assert.equal(uploads.length, 0);
    assert.equal(result.podcast.action, 'skip');
    assert.equal(result.podcast.reason, 'infographic_failed');
    assert.match(result.podcast.infographicError, /image timeout/);

    const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(savedState.podcast.last_uploaded_fingerprint, null);
    assert.equal(savedState.podcast.last_result, 'skip');
    assert.equal(savedState.podcast.last_reason, 'infographic_failed');
    assert.match(savedState.podcast.last_error, /image timeout/);
});

test('runWechatAutogenOnce injects required infographic before publishing podcast draft', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-infographic-ok-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const uploads = [];

    writeJson(path.join(podcastMetadataDir, '2026-05-13.json'), {
        status: 'ready',
        summary: '今播播客摘要',
        script_markdown: '今播播客正文'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-05-13T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        requireInfographic: true,
        enabledTypes: ['podcast'],
        podcastFormatter: {
            getFingerprint() {
                return 'formatter-v2';
            },
            async formatForWechat({ title, scriptMarkdown }) {
                return {
                    markdown: `# ${title}\n\n${scriptMarkdown}`,
                    digest: '今播播客摘要'
                };
            }
        },
        infographicGenerator: {
            async generateInfographic() {
                return Buffer.from('fake-image');
            }
        },
        publisher: {
            async uploadNewsImageForContent({ imageBuffer }) {
                assert.deepEqual(imageBuffer, Buffer.from('fake-image'));
                return 'https://mmbiz.qpic.cn/test.jpg';
            },
            async publishMarkdownDraft(payload) {
                uploads.push(payload);
                return { media_id: 'podcast-draft' };
            }
        }
    });

    assert.equal(uploads.length, 1);
    assert.match(uploads[0].markdown, /^!\[AI资讯日报信息图\]\(https:\/\/mmbiz\.qpic\.cn\/test\.jpg\)/);
    assert.equal(result.podcast.action, 'uploaded');
    assert.equal(result.podcast.infographicUrl, 'https://mmbiz.qpic.cn/test.jpg');
});

test('runWechatAutogenOnce falls back to source markdown when formatter fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-fallback-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const uploads = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        summary: '今播播客摘要',
        script_markdown: '今播播客正文',
        wechat_copy: '今日转发文案',
        audio_url: '/api/podcast/news/2026-04-02/audio'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['podcast'],
        podcastFormatter: {
            getFingerprint() {
                return 'formatter-v2';
            },
            async formatForWechat() {
                throw new Error('formatter unavailable');
            }
        },
        publisher: {
            async publishMarkdownDraft(payload) {
                uploads.push(payload);
                return { media_id: 'podcast-draft' };
            }
        }
    });

    assert.equal(uploads.length, 1);
    assert.match(uploads[0].markdown, /今日播客正文/);
    assert.match(uploads[0].markdown, /今播播客正文/);
    assert.doesNotMatch(uploads[0].markdown, /点击收听今日播客/);
    assert.equal(result.podcast.action, 'uploaded');
    assert.match(result.podcast.formatterFallbackReason, /formatter unavailable/);
});

test('runWechatAutogenOnce sends only todays ready podcast audio and skips older files', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-audio-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const audioDir = path.join(podcastMetadataDir, 'audio');
    const calls = [];
    const synthCalls = [];

    fs.mkdirSync(audioDir, { recursive: true });
    fs.writeFileSync(path.join(audioDir, '2026-04-02.mp3'), 'fake-mp3');

    writeJson(path.join(podcastMetadataDir, '2026-04-01.json'), {
        status: 'ready',
        audio_storage: 'local',
        audio_file: '2026-04-01.mp3',
        audio_url: '/api/podcast/news/2026-04-01/audio'
    });
    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        audio_storage: 'local',
        audio_file: '2026-04-02.mp3',
        audio_url: '/api/podcast/news/2026-04-02/audio'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['podcast_audio'],
        podcastAudioSynthesizer: {
            async synthesizeTextToAudioBuffer(text) {
                synthCalls.push(text);
                return {
                    audioBuffer: Buffer.from('short-audio'),
                    fileName: 'short.mp3'
                };
            }
        },
        publisher: {
            getAudioDeliveryFingerprint() {
                return 'sendall-all';
            },
            async publishPodcastAudio(payload) {
                calls.push(payload);
                return { msg_id: 2001, voice_media_id: 'voice-1', delivery_mode: 'sendall' };
            }
        }
    });

    assert.equal(calls.length, 1);
    assert.equal(synthCalls.length, 0);
    assert.equal(calls[0].date, '2026-04-02');
    assert.match(calls[0].audioPath, /2026-04-02\.mp3$/);
    assert.equal(result.podcastAudio.action, 'sent');
    assert.equal(result.podcastAudio.reason, 'podcast_audio_ready_today');
});

test('runWechatAutogenOnce falls back to remote audio url for podcast audio sending', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-audio-url-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const calls = [];
    const synthCalls = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        audio_storage: 'oss',
        audio_url: 'https://cdn.example.com/podcast.mp3',
        script_tts_text: '大家好，欢迎收听今天的AI早报。第一条，Claude已经可以自主生成漏洞利用。第二条，Anthropic营收飙升但算力吃紧。第三条，具身智能进入工业化门槛。后面还有很多内容。'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['podcast_audio'],
        podcastAudioSynthesizer: {
            async synthesizeTextToAudioBuffer(text) {
                synthCalls.push(text);
                return {
                    audioBuffer: Buffer.from('short-audio'),
                    fileName: 'short.mp3'
                };
            }
        },
        publisher: {
            getAudioDeliveryFingerprint() {
                return 'sendall-all';
            },
            async publishPodcastAudio(payload) {
                calls.push(payload);
                return { msg_id: 2002, voice_media_id: 'voice-2', delivery_mode: 'sendall' };
            }
        }
    });

    assert.equal(calls.length, 1);
    assert.equal(synthCalls.length, 1);
    assert.equal(calls[0].audioUrl, '');
    assert.equal(calls[0].audioPath, null);
    assert.equal(String(calls[0].audioBuffer), 'short-audio');
    assert.equal(calls[0].fileName, 'short.mp3');
    assert.equal(result.podcastAudio.action, 'sent');
});

test('runWechatAutogenOnce falls back to minimax file download when podcast audio url is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-audio-fileid-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const calls = [];
    const downloaderCalls = [];
    const synthCalls = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        audio_storage: 'oss',
        audio_url: '',
        tts_file_id: 7788
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['podcast_audio'],
        podcastAudioSynthesizer: {
            async synthesizeTextToAudioBuffer(text) {
                synthCalls.push(text);
                throw new Error('short tts unavailable');
            }
        },
        podcastAudioDownloader: {
            async downloadAudioBufferFromFileId(fileId) {
                downloaderCalls.push(fileId);
                return {
                    audioBuffer: Buffer.from('fake-mp3'),
                    fileName: 'downloaded.mp3'
                };
            }
        },
        publisher: {
            getAudioDeliveryFingerprint() {
                return 'sendall-all';
            },
            async publishPodcastAudio(payload) {
                calls.push(payload);
                return { msg_id: 2003, voice_media_id: 'voice-3', delivery_mode: 'sendall' };
            }
        }
    });

    assert.equal(synthCalls.length, 0);
    assert.deepEqual(downloaderCalls, [7788]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].audioUrl, '');
    assert.equal(calls[0].audioPath, null);
    assert.equal(String(calls[0].audioBuffer), 'fake-mp3');
    assert.equal(calls[0].fileName, 'downloaded.mp3');
    assert.equal(result.podcastAudio.action, 'sent');
});

test('runWechatAutogenOnce prefers synthesized short podcast audio when script exists', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-short-audio-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const calls = [];
    const synthCalls = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        audio_storage: 'oss',
        audio_url: 'https://cdn.example.com/podcast.mp3',
        script_tts_text: '大家好，欢迎收听今天的AI早报。第一条，Claude已经可以自主生成漏洞利用。第二条，Anthropic营收飙升但算力吃紧。第三条，具身智能进入工业化门槛。后面还有很多内容。'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['podcast_audio'],
        podcastAudioSynthesizer: {
            async synthesizeTextToAudioBuffer(text) {
                synthCalls.push(text);
                return {
                    audioBuffer: Buffer.from('short-audio'),
                    fileName: 'short.mp3'
                };
            }
        },
        publisher: {
            getAudioDeliveryFingerprint() {
                return 'sendall-all';
            },
            async publishPodcastAudio(payload) {
                calls.push(payload);
                return { msg_id: 2004, voice_media_id: 'voice-4', delivery_mode: 'sendall' };
            }
        }
    });

    assert.equal(synthCalls.length, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].audioUrl, '');
    assert.equal(calls[0].audioPath, null);
    assert.equal(String(calls[0].audioBuffer), 'short-audio');
    assert.equal(result.podcastAudio.action, 'sent');
});
