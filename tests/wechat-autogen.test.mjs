import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import './setup-env.mjs';
import autogenModule from '../scripts/run-wechat-autogen-once.js';

const {
    runWechatAutogenOnce
} = autogenModule;

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

test('runWechatAutogenOnce publishes one newspic draft with ten report-driven core items', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-newspic-'));
    const reportDir = path.join(root, 'report');
    const podcastMetadataDir = path.join(root, 'podcasts');
    const generatedPrompts = [];
    const composedImages = [];
    const uploads = [];

    writeJson(path.join(reportDir, '2026-06-04.json'), {
        articles: [
            {
                title: 'Anthropic 提交 IPO 申请，年化收入 470 亿美元',
                key_point: 'Anthropic 已秘密提交 IPO 申请。',
                importance_score: 9
            },
            {
                title: 'Anthropic 秘密提交 IPO 招股书，最快 Q4 上市',
                key_point: 'Anthropic 向 SEC 秘密提交 S-1 表格。',
                importance_score: 9
            },
            {
                title: 'MiniMax 启动 A 股 IPO',
                key_point: 'MiniMax 商业化速度加快。',
                importance_score: 8
            },
            {
                title: 'OpenAI 推出企业级 Agent',
                key_point: 'OpenAI 面向复杂工作流推出新 Agent。',
                importance_score: 7
            },
            {
                title: '谷歌发布新一代 TPU',
                key_point: '谷歌发布面向推理和训练的新芯片。',
                importance_score: 6
            },
            { title: '微软发布推理模型', key_point: '办公场景推理能力继续增强。', importance_score: 5 },
            { title: '苹果扩展端侧 AI', key_point: '隐私计算成为产品卖点。', importance_score: 4 },
            { title: '英伟达开源世界模型', key_point: '物理 AI 训练效率提升。', importance_score: 3 },
            { title: 'Meta 调整 AI 组织', key_point: '基础模型团队进入重组期。', importance_score: 2 },
            { title: '亚马逊发布企业 AI 芯片服务', key_point: '云厂商继续争夺 AI 基础设施。', importance_score: 1 },
            { title: '百度升级智能体开发平台', key_point: '国产 Agent 工具链继续完善。', importance_score: 0 },
            { title: '第十一条不应出现', key_point: '超过十条。', importance_score: -1 }
        ]
    });
    writeJson(path.join(podcastMetadataDir, '2026-06-04.json'), {
        status: 'error',
        script_markdown: '这段播客口播稿绝不能被上传到贴图草稿。'
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-06-04T02:00:00.000Z'),
        reportDir,
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['newspic'],
        infographicGenerator: {
            async generateInfographic({ prompt }) {
                generatedPrompts.push(prompt);
                return Buffer.from('generated-daily-background');
            }
        },
        imageComposer: async ({ backgroundBuffer, content }) => {
            assert.deepEqual(backgroundBuffer, Buffer.from('generated-daily-background'));
            assert.match(content, /Anthropic 提交 IPO/);
            composedImages.push(content);
            return Buffer.from('composed-daily-image');
        },
        publisher: {
            async publishNewspicDraft(payload) {
                uploads.push(payload);
                return {
                    media_id: 'newspic-draft-1',
                    image_media_id: 'image-media-1'
                };
            }
        },
    });

    assert.equal(generatedPrompts.length, 1);
    assert.match(generatedPrompts[0], /高质量中文 AI 日报一览图底图/);
    assert.match(generatedPrompts[0], /内容主题清单/);
    assert.match(generatedPrompts[0], /后期准确排版/);
    assert.match(generatedPrompts[0], /百度升级智能体开发平台/);
    assert.doesNotMatch(generatedPrompts[0], /第十一条不应出现/);
    assert.doesNotMatch(generatedPrompts[0], /这段播客口播稿/);
    assert.equal(composedImages.length, 1);
    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].title, '06月04日AI资讯早报');
    assert.deepEqual(uploads[0].imageBuffer, Buffer.from('composed-daily-image'));
    assert.match(uploads[0].content, /Anthropic 提交 IPO/);
    assert.match(uploads[0].content, /MiniMax 启动 A 股 IPO/);
    assert.match(uploads[0].content, /OpenAI 推出企业级 Agent/);
    assert.match(uploads[0].content, /谷歌发布新一代 TPU/);
    assert.match(uploads[0].content, /百度升级智能体开发平台/);
    assert.doesNotMatch(uploads[0].content, /第十一条不应出现/);
    assert.doesNotMatch(uploads[0].content, /这段播客口播稿/);
    assert.equal(result.newspic.action, 'uploaded');
    assert.equal(result.newspic.reason, 'newspic_ready_today');
    assert.equal(result.podcast.reason, 'podcast_disabled');

    const savedState = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8'));
    assert.equal(savedState.newspic.last_media_id, 'newspic-draft-1');
    assert.equal(savedState.newspic.last_image_media_id, 'image-media-1');

    const second = await runWechatAutogenOnce({
        now: new Date('2026-06-04T02:01:00.000Z'),
        reportDir,
        podcastMetadataDir,
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['newspic'],
        infographicGenerator: {
            async generateInfographic() {
                throw new Error('should skip before generating image');
            }
        },
        publisher: {
            async publishNewspicDraft() {
                throw new Error('should not publish duplicate newspic');
            }
        }
    });
    const savedAfterSkip = JSON.parse(fs.readFileSync(path.join(root, 'state.json'), 'utf8'));
    assert.equal(second.newspic.reason, 'same_fingerprint');
    assert.equal(savedAfterSkip.newspic.last_media_id, 'newspic-draft-1');
    assert.equal(savedAfterSkip.newspic.last_image_media_id, 'image-media-1');
});

test('runWechatAutogenOnce falls back to a composed image when TokenGo image generation fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-newspic-image-fail-'));
    const reportDir = path.join(root, 'report');
    const uploads = [];

    writeJson(path.join(reportDir, '2026-06-04.json'), {
        articles: [
            { title: '第一条', key_point: '一', importance_score: 9 },
            { title: '第二条', key_point: '二', importance_score: 8 },
            { title: '第三条', key_point: '三', importance_score: 7 },
            { title: '第四条', key_point: '四', importance_score: 6 },
            { title: '第五条', key_point: '五', importance_score: 5 },
            { title: '第六条', key_point: '六', importance_score: 4 },
            { title: '第七条', key_point: '七', importance_score: 3 },
            { title: '第八条', key_point: '八', importance_score: 2 },
            { title: '第九条', key_point: '九', importance_score: 1 },
            { title: '第十条', key_point: '十', importance_score: 0 }
        ]
    });

    const result = await runWechatAutogenOnce({
        now: new Date('2026-06-04T02:00:00.000Z'),
        reportDir,
        podcastMetadataDir: path.join(root, 'podcasts'),
        stateFile: path.join(root, 'state.json'),
        stagingDir: path.join(root, 'staging'),
        enabled: true,
        enabledTypes: ['newspic'],
        infographicGenerator: {
            async generateInfographic() {
                throw new Error('image generation unavailable');
            }
        },
        fallbackBackgroundCreator: async ({ content }) => {
            assert.match(content, /第一条/);
            return Buffer.from('fallback-background');
        },
        imageComposer: async ({ backgroundBuffer, content }) => {
            assert.deepEqual(backgroundBuffer, Buffer.from('fallback-background'));
            assert.match(content, /第十条/);
            return Buffer.from('fallback-composed-image');
        },
        publisher: {
            async publishNewspicDraft(payload) {
                uploads.push(payload);
                return {
                    media_id: 'fallback-draft-1',
                    image_media_id: 'fallback-image-1'
                };
            }
        }
    });

    assert.equal(result.newspic.action, 'uploaded');
    assert.equal(result.newspic.imageSource, 'fallback');
    assert.equal(result.newspic.imageError, 'image generation unavailable');
    assert.equal(uploads.length, 1);
    assert.deepEqual(uploads[0].imageBuffer, Buffer.from('fallback-composed-image'));
});

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
        originalArticleUrl: 'https://aicoming.cn/news.html',
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
                calls.push({
                    kind: payload.kind,
                    title: payload.title,
                    contentSourceUrl: payload.contentSourceUrl,
                    markdown: payload.markdown
                });
                assert.doesNotMatch(payload.markdown, /https:\/\/ai-coming\.example\.com\/api\/podcast\/news\/2026-04-02\/audio/);
                return { media_id: `${payload.kind}-draft` };
            }
        }
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].kind, 'podcast');
    assert.equal(calls[0].title, '小元说 AI日报 2026.04.02.');
    assert.equal(calls[0].contentSourceUrl, 'https://aicoming.cn/news.html');
    assert.match(calls[0].markdown, /\[打开播客播放页\]\(https:\/\/ai-coming\.example\.com\/podcast\.html\?date=2026-04-02\)/);
    assert.equal(packagingCalls.length, 1);
    assert.equal(packagingCalls[0].title, '小元说 AI日报 2026.04.02.');
    assert.match(packagingCalls[0].scriptMarkdown, /今播播客正文/);
    assert.equal(result.podcast.action, 'uploaded');
    assert.equal(result.podcast.reason, 'podcast_ready_today');
    assert.equal(result.podcast.originalArticleUrl, 'https://aicoming.cn/news.html');
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

test('runWechatAutogenOnce republishes podcast when cover image changes', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wechat-autogen-cover-'));
    const podcastMetadataDir = path.join(root, 'podcasts');
    const stateFile = path.join(root, 'state.json');
    const coverImagePath = path.join(root, 'cover.jpg');
    const uploads = [];

    writeJson(path.join(podcastMetadataDir, '2026-04-02.json'), {
        status: 'ready',
        summary: '今播播客摘要',
        script_markdown: '今播播客正文'
    });
    fs.writeFileSync(coverImagePath, 'cover-v1');

    const baseOptions = {
        now: new Date('2026-04-02T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        podcastMetadataDir,
        stateFile,
        stagingDir: path.join(root, 'staging'),
        coverImagePath,
        enabled: true,
        enabledTypes: ['podcast'],
        podcastFormatter: {
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
                return { media_id: `podcast-draft-${uploads.length}` };
            }
        }
    };

    const first = await runWechatAutogenOnce(baseOptions);
    const second = await runWechatAutogenOnce(baseOptions);
    fs.writeFileSync(coverImagePath, 'cover-v2');
    const third = await runWechatAutogenOnce(baseOptions);

    assert.equal(first.podcast.action, 'uploaded');
    assert.equal(second.podcast.action, 'skip');
    assert.equal(second.podcast.reason, 'same_fingerprint');
    assert.equal(third.podcast.action, 'uploaded');
    assert.equal(uploads.length, 2);
});

test('runWechatAutogenOnce uploads podcast draft when required infographic fails', async () => {
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

    assert.equal(uploads.length, 1);
    assert.equal(uploads[0].kind, 'podcast');
    assert.equal(uploads[0].markdown.includes('今播播客正文'), true);
    assert.equal(uploads[0].markdown.includes('小元说 AI日报图片'), false);
    assert.equal(result.podcast.action, 'uploaded');
    assert.equal(result.podcast.reason, 'podcast_ready_today');
    assert.match(result.podcast.infographicError, /image timeout/);

    const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(typeof savedState.podcast.last_uploaded_fingerprint, 'string');
    assert.equal(savedState.podcast.last_result, 'uploaded');
    assert.equal(savedState.podcast.last_reason, 'podcast_ready_today');
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
    assert.match(uploads[0].markdown, /^!\[小元说 AI日报图片\]\(https:\/\/mmbiz\.qpic\.cn\/test\.jpg\)/);
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
