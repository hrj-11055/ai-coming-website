import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    buildWechatPodcastFormattingPrompt,
    createWechatPodcastFormatter
} = require('../server/services/wechat-podcast-formatter.js');

test('buildWechatPodcastFormattingPrompt asks for light wechat packaging and forbids listening-entry style output', () => {
    const prompt = buildWechatPodcastFormattingPrompt();
    assert.match(prompt, /轻包装/);
    assert.match(prompt, /微信公众号/);
    assert.match(prompt, /不要输出音频链接/);
    assert.doesNotMatch(prompt, /点击收听今日播客/);
});

test('createWechatPodcastFormatter calls deepseek and returns packaged markdown plus digest', async () => {
    const calls = [];
    const formatter = createWechatPodcastFormatter({
        config: {
            apiKey: 'deepseek-key',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-v4-flash',
            timeoutMs: 30000
        },
        fetchImpl: async (url, options) => {
            calls.push({ url, body: JSON.parse(options.body) });
            return new Response(JSON.stringify({
                choices: [
                    {
                        message: {
                            content: '## 开场\n\n这是轻包装后的播客文字版。\n\n## 今日内容\n\n保留原始观点。\n\n## 推荐转发\n\n欢迎转发。'
                        }
                    }
                ]
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    });

    const result = await formatter.formatForWechat({
        title: '04月02日AI资讯早报',
        summary: '今天整理 12 条 AI 快讯。',
        scriptMarkdown: '## 开场钩子\n今天我们来看三件大事。',
        wechatCopy: '欢迎转发'
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions');
    assert.equal(calls[0].body.model, 'deepseek-v4-flash');
    assert.deepEqual(calls[0].body.thinking, { type: 'disabled' });
    assert.match(result.markdown, /这是轻包装后的播客文字版/);
    assert.ok(result.digest.length <= 120);
    assert.match(formatter.getFingerprint(), /^[a-f0-9]{40}$/);
});

test('createWechatPodcastFormatter normalizes plain text section labels into markdown headings', async () => {
    const formatter = createWechatPodcastFormatter({
        config: {
            apiKey: 'deepseek-key',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-v4-flash',
            timeoutMs: 30000
        },
        fetchImpl: async () => new Response(JSON.stringify({
            choices: [
                {
                    message: {
                        content: [
                            '开场导语',
                            '今天我们来看10条最值得关注的AI资讯。',
                            '',
                            '今日内容',
                            'OpenAI重组，Brockman亲自掌管三大核心产品线',
                            'OpenAI今天宣布了一项关键的组织调整。',
                            '',
                            'AI生成虚假新闻网络曝光，成本仅需10美元',
                            '美国媒体曝光了一个由AI驱动的虚假新闻网络。',
                            '',
                            '第一件，从Codex赚钱这件事说起。',
                            '这件事最值得关注的不是金额，而是完整闭环。',
                            '',
                            '推荐转发文案',
                            '今天的AI资讯值得收藏。'
                        ].join('\n')
                    }
                }
            ]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    });

    const result = await formatter.formatForWechat({
        title: '硅基生存指南 2026.05.17.',
        summary: '今天整理 10 条 AI 快讯。',
        scriptMarkdown: '原始播客内容',
        wechatCopy: '今天的AI资讯值得收藏。'
    });

    assert.match(result.markdown, /^## 开场导语/m);
    assert.match(result.markdown, /^## 今日内容/m);
    assert.match(result.markdown, /^### OpenAI重组，Brockman亲自掌管三大核心产品线/m);
    assert.match(result.markdown, /^### AI生成虚假新闻网络曝光，成本仅需10美元/m);
    assert.match(result.markdown, /^#### 第一件，从Codex赚钱这件事说起。/m);
    assert.match(result.markdown, /^## 推荐转发文案/m);
});

test('createWechatPodcastFormatter exposes fingerprint even when api key is missing', () => {
    const formatter = createWechatPodcastFormatter({
        config: {
            apiKey: '',
            model: 'deepseek-chat'
        },
        fetchImpl: async () => {
            throw new Error('should not run');
        }
    });

    assert.match(formatter.getFingerprint(), /^[a-f0-9]{40}$/);
});
