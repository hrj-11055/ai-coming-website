import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    formatWechatTitle,
    formatWechatPodcastTitle,
    buildWechatDigest,
    buildNewsMarkdown,
    buildPodcastMarkdown,
    buildPodcastLandingPageUrl,
    appendPodcastListenCta,
    buildPodcastVoiceMessageText,
    buildDailyNewspicContent,
    buildDailyNewspicImagePrompt,
    selectCoreNewsItems
} = require('../server/services/wechat-content.js');

test('selectCoreNewsItems returns exactly three distinct highest-value stories', () => {
    const report = {
        articles: [
            {
                title: 'Anthropic 提交 IPO 申请，年化收入 470 亿美元',
                key_point: 'Anthropic 已秘密提交 IPO 申请，估值达到 9000 亿美元。',
                importance_score: 9
            },
            {
                title: 'Anthropic 秘密提交 IPO 招股书，最快 Q4 上市',
                key_point: 'Anthropic 向 SEC 秘密提交 S-1 表格。',
                importance_score: 9
            },
            {
                title: 'MiniMax 启动 A 股 IPO',
                key_point: 'MiniMax 启动 A 股 IPO，商业化速度加快。',
                importance_score: 8
            },
            {
                title: 'OpenAI 推出企业级 Agent',
                key_point: 'OpenAI 推出企业级 Agent，面向复杂工作流。',
                importance_score: 7
            }
        ]
    };

    const items = selectCoreNewsItems(report);

    assert.equal(items.length, 3);
    assert.equal(items[0].title, 'Anthropic 提交 IPO 申请，年化收入 470 亿美元');
    assert.equal(items[1].title, 'MiniMax 启动 A 股 IPO');
    assert.equal(items[2].title, 'OpenAI 推出企业级 Agent');
});

test('daily newspic content contains only three core items and image prompt is visual-first', () => {
    const coreItems = [
        { title: '第一条', keyPoint: '第一条核心信息。' },
        { title: '第二条', keyPoint: '第二条核心信息。' },
        { title: '第三条', keyPoint: '第三条核心信息。' }
    ];

    const content = buildDailyNewspicContent({ date: '2026-06-04', coreItems });
    const prompt = buildDailyNewspicImagePrompt({ date: '2026-06-04', coreItems });

    assert.equal(content, '1. 第一条：第一条核心信息。\n\n2. 第二条：第二条核心信息。\n\n3. 第三条：第三条核心信息。');
    assert.match(prompt, /高质量中文 AI 日报一览图/);
    assert.match(prompt, /只展示以下 3 条/);
    assert.match(prompt, /第一条核心信息/);
    assert.doesNotMatch(prompt, /播客口播稿/);
});

test('buildNewsMarkdown renders fixed title and structured sections for today report json', () => {
    const markdown = buildNewsMarkdown({
        date: '2026-04-02',
        report: {
            report_title: '全球AI日报 | 2026-04-02',
            articles: [
                {
                    title: 'OpenAI launches new agent tooling',
                    source_name: 'TechCrunch',
                    category: 'Agents',
                    importance_score: 5,
                    key_point: 'Teams can orchestrate more workflows.',
                    summary: 'Developers can now ship more reliable agent products.',
                    source_url: 'https://example.com/a'
                }
            ]
        }
    });

    assert.match(markdown, /^# 04月02日AI资讯早报/m);
    assert.match(markdown, /## 今日看点/);
    assert.match(markdown, /## 1\. OpenAI launches new agent tooling/);
    assert.match(markdown, /- 来源：TechCrunch/);
    assert.match(markdown, /- 分类：Agents/);
});

test('buildPodcastMarkdown renders dated podcast title, marker, summary, and wechat copy', () => {
    const markdown = buildPodcastMarkdown({
        date: '2026-04-02',
        metadata: {
            status: 'ready',
            summary: '今天整理 12 条 AI 快讯。',
            script_markdown: '## 开场钩子\n今天我们来看三件大事。',
            wechat_copy: '转发文案',
            audio_url: '/api/podcast/news/2026-04-02/audio'
        },
        siteBaseUrl: 'https://ai-coming.example.com'
    });

    assert.match(markdown, /^# 小元说 AI日报 2026\.04\.02\./m);
    assert.match(markdown, /播客版/);
    assert.match(markdown, /今天整理 12 条 AI 快讯。/);
    assert.match(markdown, /转发文案/);
    assert.doesNotMatch(markdown, /https:\/\/ai-coming\.example\.com\/api\/podcast\/news\/2026-04-02\/audio/);
});

test('buildPodcastLandingPageUrl and appendPodcastListenCta point readers to the long audio page', () => {
    const pageUrl = buildPodcastLandingPageUrl({
        date: '2026-04-02',
        siteBaseUrl: 'https://ai-coming.example.com/'
    });
    const markdown = appendPodcastListenCta('## 今日内容\n\n正文', pageUrl);

    assert.equal(pageUrl, 'https://ai-coming.example.com/podcast.html?date=2026-04-02');
    assert.match(markdown, /## 收听完整版音频/);
    assert.match(markdown, /\[打开播客播放页\]\(https:\/\/ai-coming\.example\.com\/podcast\.html\?date=2026-04-02\)/);
});

test('buildWechatDigest truncates long text and formatWechatTitle keeps mm月dd日 format', () => {
    assert.equal(formatWechatTitle('2026-11-09'), '11月09日AI资讯早报');
    assert.equal(formatWechatPodcastTitle('2026-11-09'), '小元说 AI日报 2026.11.09.');
    const digest = buildWechatDigest('这是一段很长的摘要'.repeat(30));
    assert.ok(digest.length <= 120);
});

test('buildPodcastVoiceMessageText builds a short teaser with a fixed outro', () => {
    const text = buildPodcastVoiceMessageText({
        script_tts_text: '大家好，欢迎收听今天的AI早报。第一条，Claude已经可以自主生成漏洞利用。第二条，Anthropic营收飙升但算力吃紧。第三条，具身智能进入工业化门槛。后面还有很多内容。'
    });

    assert.match(text, /更多内容请看公众号文章。/);
    assert.ok(text.length <= 170);
});
