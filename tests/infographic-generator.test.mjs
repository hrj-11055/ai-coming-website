import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInfographicGenerator, buildImagePromptSystemMessage } = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 包含必要的中文指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.match(msg, /信息图/);
    assert.match(msg, /播客文字稿/);
    assert.match(msg, /中文图片生成提示词/);
    assert.match(msg, /只输出提示词/);
});

test('generateInfographic 先调 DeepSeek 再调 gpt-image-2，返回 Buffer', async () => {
    const calls = [];
    const fakeB64 = Buffer.from('fake-png-bytes').toString('base64');
    const generator = createInfographicGenerator({
        config: {
            deepseekApiKey: 'ds-key',
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://example.com'
        },
        fetchImpl: async (url, opts) => {
            const body = JSON.parse(opts.body);
            calls.push({ url, body });
            if (url.includes('chat/completions')) {
                return new Response(JSON.stringify({
                    choices: [{ message: { content: '科技感信息图，今日AI三大热点：GPT-5发布，Gemini升级，开源模型爆发' } }]
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({
                data: [{ b64_json: fakeB64 }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    });

    const buffer = await generator.generateInfographic({
        scriptMarkdown: '## 今日播客\n三大AI新闻...'
    });

    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /chat\/completions/);
    assert.equal(calls[0].body.model, 'deepseek-v4-flash');
    assert.deepEqual(calls[0].body.thinking, { type: 'disabled' });
    assert.ok(calls[0].body.messages.some(m => m.role === 'user' && m.content.includes('今日播客')));

    assert.match(calls[1].url, /\/v1\/images\/generations/);
    assert.equal(calls[1].body.model, 'gpt-image-2');
    assert.equal(calls[1].body.prompt, '科技感信息图，今日AI三大热点：GPT-5发布，Gemini升级，开源模型爆发');
    assert.equal(calls[1].body.n, 1);
    assert.equal(calls[1].body.size, '1024x1024');

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 在缺少 DeepSeek key 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: '', gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /DeepSeek/);
});

test('generateInfographic 在缺少 gpt image key 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: 'ds-key', gptImageApiKey: '', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /GPT Image/);
});

test('generateInfographic 在 DeepSeek 返回空内容时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: 'ds-key', gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async (url) => {
            if (url.includes('completions')) {
                return new Response(JSON.stringify({
                    choices: [{ message: { content: '' } }]
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            throw new Error('should not reach image api');
        }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /未返回图片提示词/);
});
