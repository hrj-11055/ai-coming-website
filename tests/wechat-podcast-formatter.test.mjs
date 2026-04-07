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
            model: 'deepseek-chat',
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
    assert.equal(calls[0].body.model, 'deepseek-chat');
    assert.match(result.markdown, /这是轻包装后的播客文字版/);
    assert.ok(result.digest.length <= 120);
    assert.match(formatter.getFingerprint(), /^[a-f0-9]{40}$/);
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
