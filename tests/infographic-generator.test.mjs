import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInfographicGenerator, buildImagePromptSystemMessage } = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 使用直给式图片指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.equal(msg, '请基于下面播客文字稿画一幅 AI 资讯日报图片。');
});

test('generateInfographic 直接把固定指令和播客稿发给 gpt-image-2', async () => {
    const calls = [];
    const fakeB64 = Buffer.from('fake-png-bytes').toString('base64');
    const generator = createInfographicGenerator({
        config: {
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://example.com'
        },
        fetchImpl: async (url, opts) => {
            const body = JSON.parse(opts.body);
            calls.push({ url, body });
            return new Response(JSON.stringify({
                data: [{ b64_json: fakeB64 }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    });

    const buffer = await generator.generateInfographic({
        scriptMarkdown: '## 今日播客\n三大AI新闻...'
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/v1\/images\/generations/);
    assert.equal(calls[0].body.model, 'gpt-image-2');
    assert.equal(calls[0].body.prompt, '请基于下面播客文字稿画一幅 AI 资讯日报图片。\n\n## 今日播客\n三大AI新闻...');
    assert.equal(calls[0].body.n, 1);
    assert.equal(calls[0].body.size, '1024x1024');
    assert.equal(calls[0].body.quality, 'medium');
    assert.equal(calls[0].body.output_format, 'jpeg');
    assert.equal(calls[0].body.output_compression, 85);

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 不再要求 DeepSeek key', async () => {
    const fakeB64 = Buffer.from('fake-png-bytes').toString('base64');
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: '', gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => new Response(JSON.stringify({
            data: [{ b64_json: fakeB64 }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    const buffer = await generator.generateInfographic({ scriptMarkdown: 'test' });
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 在缺少 gpt image key 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: 'ds-key', gptImageApiKey: '', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /GPT Image/);
});

test('generateInfographic 在 gpt-image-2 未返回 b64_json 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => new Response(JSON.stringify({
            data: [{}]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /未返回 b64_json/);
});
