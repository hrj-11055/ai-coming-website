import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    buildPodcastSourceMarkdown,
    buildReportInputFilePath,
    createPodcastScriptService,
    parsePodcastScriptMarkdown
} = require('../server/services/podcast-script.js');

test('buildPodcastSourceMarkdown renders a structured markdown digest for daily news', () => {
    const markdown = buildPodcastSourceMarkdown({
        date: '2026-03-18',
        articles: [
            {
                title: 'Open source agent framework gains enterprise adoption',
                source_name: 'TechCrunch',
                category: 'Agents',
                importance_score: 5,
                key_point: 'Large enterprises are piloting agent workflows.',
                summary: 'Adoption is shifting from experiments to internal process deployment.',
                source_url: 'https://example.com/a'
            }
        ]
    });

    assert.match(markdown, /^# AIcoming Daily News \| 2026-03-18/m);
    assert.match(markdown, /## 1\. Open source agent framework gains enterprise adoption/);
    assert.match(markdown, /\- 来源：TechCrunch/);
    assert.match(markdown, /\- 分类：Agents/);
    assert.match(markdown, /\- 重要性：⭐⭐⭐⭐⭐/);
    assert.match(markdown, /\- 要点：Large enterprises are piloting agent workflows\./);
    assert.match(markdown, /\- 深度摘要：Adoption is shifting from experiments to internal process deployment\./);
    assert.match(markdown, /\- 原文链接：https:\/\/example\.com\/a/);
});

test('parsePodcastScriptMarkdown extracts publish copy, selected titles, exclusions, and pure tts text', () => {
    const markdown = `# 小元说AI · 口播文稿 | 2026.03.18

**字数**：约2800字 | **预计时长**：约11分钟
**朋友圈文案**：【硅基生存指南】2026.03.18，AI 公司开始抢企业工作流入口，每天听10分钟AI故事，悦读生存智慧。#小元说AI
**排除旧闻**：
- OpenAI 1100亿美元融资（旧闻，不再报道）
- 某发布会预告（纯活动预告）

## 开场钩子
今天最值得注意的是，AI 公司正在从拼模型参数，转向争夺企业真实工作流入口。好，今天从全球150多条情报里，提炼10个最值得关注的信号。

## 十个信号
**信号1：AI 开始抢入口**

这件事意味着平台竞争进入新阶段。说白话就是，大家都在争谁先接管用户真正每天会打开的工作界面。

**信号2：企业买单标准变了**

企业现在更关注能不能真的嵌进流程，而不是单次演示有多惊艳。

## 生存智慧
**第一件，从 AI 开始抢入口 说起。**

对职场人来说，更重要的不是追最热的模型，而是看清你所在岗位的关键流程会先被谁重构。

**第二件，从 企业买单标准变了 说起。**

对管理者来说，下一阶段更值钱的是把工具接进组织，而不是只做一场漂亮试点。

欢迎大家订阅小元说 AI 的公众号和视频号
`;

    const parsed = parsePodcastScriptMarkdown(markdown);

    assert.equal(parsed.wechat_copy, '【硅基生存指南】2026.03.18，AI 公司开始抢企业工作流入口，每天听10分钟AI故事，悦读生存智慧。#小元说AI');
    assert.deepEqual(parsed.excluded_items, [
        'OpenAI 1100亿美元融资（旧闻，不再报道）',
        '某发布会预告（纯活动预告）'
    ]);
    assert.deepEqual(parsed.selected_titles, [
        'AI 开始抢入口',
        '企业买单标准变了'
    ]);
    assert.match(parsed.script_tts_text, /今天最值得注意的是/);
    assert.match(parsed.script_tts_text, /^大家好，我是小元，欢迎收听今天的硅基生存指南/m);
    assert.match(parsed.script_tts_text, /欢迎大家订阅小元说 AI 的公众号和视频号$/);
    assert.doesNotMatch(parsed.script_tts_text, /今天的内容就到这里/);
    assert.doesNotMatch(parsed.script_tts_text, /朋友圈文案/);
    assert.doesNotMatch(parsed.script_tts_text, /排除旧闻/);
});

test('parsePodcastScriptMarkdown removes structural section labels from spoken text and keeps a fixed spoken intro', () => {
    const markdown = `# 小元说AI · 口播文稿 | 2026.03.28

# 硅基生存指南

**朋友圈文案**：测试文案

## 开场钩子
大家好，我是小元，欢迎收听3月28号的 AI 早报。今天最值得关注的一件事，是企业级 AI 工具开始从演示场走向真实工作流。

## 十个信号
**信号1：企业 AI 开始拼落地**

真正的竞争点，开始从模型能力转向谁能进入组织流程。

## 生存智慧
今天的内容就到这里，欢迎大家订阅小元说AI的视频号，我们明天再见。
`;

    const parsed = parsePodcastScriptMarkdown(markdown);

    assert.match(parsed.script_tts_text, /^大家好，我是小元，欢迎收听今天的硅基生存指南/m);
    assert.match(parsed.script_tts_text, /欢迎大家订阅小元说 AI 的公众号和视频号$/);
    assert.doesNotMatch(parsed.script_tts_text, /AI 早报/);
    assert.doesNotMatch(parsed.script_tts_text, /今天的内容就到这里/);
    assert.doesNotMatch(parsed.script_tts_text, /(^|\n)硅基生存指南(\n|$)/);
    assert.doesNotMatch(parsed.script_tts_text, /(^|\n)开场钩子(\n|$)/);
    assert.doesNotMatch(parsed.script_tts_text, /(^|\n)十个信号(\n|$)/);
    assert.doesNotMatch(parsed.script_tts_text, /(^|\n)生存智慧(\n|$)/);
});

test('buildReportInputFilePath resolves the fixed JSON report input path', () => {
    assert.equal(
        buildReportInputFilePath('2026-03-18', '/var/www/json/report'),
        path.join('/var/www/json/report', '2026-03-18.json')
    );
});

test('createPodcastScriptService reads the fixed JSON input file and sends OpenAI-compatible payload', async () => {
    let capturedBody = null;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-script-test-'));
    const promptFile = path.join(root, 'podcast-prompt.md');
    const inputDir = path.join(root, 'report');
    fs.mkdirSync(inputDir, { recursive: true });
    fs.writeFileSync(promptFile, 'system prompt');
    fs.writeFileSync(path.join(inputDir, '2026-03-18.json'), JSON.stringify({
        report_date: '2026-03-18',
        articles: [{ title: '测试新闻' }]
    }, null, 2));

    const service = createPodcastScriptService({
        config: {
            apiKey: 'deepseek-key',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-chat',
            inputDir,
            timeoutMs: 5000,
            maxTokens: 2200,
            systemPromptFile: promptFile
        },
        fetchImpl: async (_url, options) => {
            capturedBody = JSON.parse(options.body);
            return {
                ok: true,
                status: 200,
                headers: { get: () => null },
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: `# 小元说AI · 口播文稿 | 2026.03.18

**朋友圈文案**：测试文案

## 开场钩子
今天开始。

## 生存智慧
今天结束。`
                            }
                        }
                    ]
                })
            };
        }
    });

    try {
        const result = await service.generateScript({ date: '2026-03-18', articles: [] });
        assert.equal(result.script_input_file, path.join(inputDir, '2026-03-18.json'));
        assert.equal(result.script_attempts, 1);
        assert.equal(result.last_http_status, 200);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }

    assert.ok(capturedBody);
    assert.equal(capturedBody.messages[0].role, 'system');
    assert.equal(capturedBody.messages[1].role, 'user');
    assert.equal(Object.hasOwn(capturedBody.messages[0], 'name'), false);
    assert.equal(Object.hasOwn(capturedBody.messages[1], 'name'), false);
    assert.equal(capturedBody.max_tokens, 2200);
    assert.match(capturedBody.messages[1].content, /"report_date": "2026-03-18"/);
});

test('createPodcastScriptService retries retryable DeepSeek failures with backoff', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-script-retry-'));
    const promptFile = path.join(root, 'podcast-prompt.md');
    const inputDir = path.join(root, 'report');
    fs.mkdirSync(inputDir, { recursive: true });
    fs.writeFileSync(promptFile, 'system prompt');
    fs.writeFileSync(path.join(inputDir, '2026-03-18.json'), JSON.stringify({
        report_date: '2026-03-18',
        articles: [{ title: '测试新闻' }]
    }, null, 2));

    const delays = [];
    const seenStatuses = [];
    const responseQueue = [
        {
            ok: false,
            status: 429,
            headers: { get: () => '2' },
            json: async () => ({ error: { message: 'rate limited' } })
        },
        {
            ok: false,
            status: 503,
            headers: { get: () => null },
            json: async () => ({ error: { message: 'service unavailable' } })
        },
        {
            ok: true,
            status: 200,
            headers: { get: () => null },
            json: async () => ({
                choices: [
                    {
                        message: {
                            content: `# 小元说AI · 口播文稿 | 2026.03.18

**朋友圈文案**：测试文案

## 开场钩子
今天开始。

## 生存智慧
今天结束。`
                        }
                    }
                ]
            })
        }
    ];

    const service = createPodcastScriptService({
        config: {
            apiKey: 'deepseek-key',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-chat',
            inputDir,
            timeoutMs: 5000,
            maxTokens: 2200,
            maxRetries: 3,
            retryBaseDelayMs: 1000,
            systemPromptFile: promptFile
        },
        fetchImpl: async () => {
            const response = responseQueue.shift();
            seenStatuses.push(response.status);
            return response;
        },
        sleepImpl: async (delayMs) => {
            delays.push(delayMs);
        }
    });

    try {
        const result = await service.generateScript({ date: '2026-03-18', articles: [] });
        assert.equal(result.script_attempts, 3);
        assert.equal(result.last_http_status, 200);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }

    assert.deepEqual(seenStatuses, [429, 503, 200]);
    assert.deepEqual(delays, [2000, 2000]);
});

test('createPodcastScriptService fails clearly when the fixed JSON input file is missing', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-script-missing-'));
    const promptFile = path.join(root, 'podcast-prompt.md');
    const inputDir = path.join(root, 'report');
    fs.mkdirSync(inputDir, { recursive: true });
    fs.writeFileSync(promptFile, 'system prompt');

    const service = createPodcastScriptService({
        config: {
            apiKey: 'deepseek-key',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-chat',
            inputDir,
            timeoutMs: 5000,
            maxTokens: 2200,
            systemPromptFile: promptFile
        }
    });

    try {
        await assert.rejects(
            () => service.generateScript({ date: '2026-03-18', articles: [] }),
            /未找到指定日报输入文件/
        );
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
