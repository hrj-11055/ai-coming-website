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
    buildPodcastVoiceMessageText
} = require('../server/services/wechat-content.js');

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

test('buildPodcastMarkdown renders fixed podcast title, marker, summary, and wechat copy', () => {
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

    assert.match(markdown, /^# 硅基生存指南/m);
    assert.match(markdown, /播客版/);
    assert.match(markdown, /今天整理 12 条 AI 快讯。/);
    assert.match(markdown, /转发文案/);
    assert.doesNotMatch(markdown, /https:\/\/ai-coming\.example\.com\/api\/podcast\/news\/2026-04-02\/audio/);
});

test('buildWechatDigest truncates long text and formatWechatTitle keeps mm月dd日 format', () => {
    assert.equal(formatWechatTitle('2026-11-09'), '11月09日AI资讯早报');
    assert.equal(formatWechatPodcastTitle('2026-11-09'), '硅基生存指南');
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
