import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    formatWechatTitle,
    buildWechatDigest,
    buildNewsMarkdown,
    buildPodcastMarkdown
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

test('buildPodcastMarkdown renders fixed title, podcast marker, summary, wechat copy, and audio link', () => {
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

    assert.match(markdown, /^# 04月02日AI资讯早报/m);
    assert.match(markdown, /播客版/);
    assert.match(markdown, /今天整理 12 条 AI 快讯。/);
    assert.match(markdown, /转发文案/);
    assert.match(markdown, /https:\/\/ai-coming\.example\.com\/api\/podcast\/news\/2026-04-02\/audio/);
});

test('buildWechatDigest truncates long text and formatWechatTitle keeps mm月dd日 format', () => {
    assert.equal(formatWechatTitle('2026-11-09'), '11月09日AI资讯早报');
    const digest = buildWechatDigest('这是一段很长的摘要'.repeat(30));
    assert.ok(digest.length <= 120);
});
