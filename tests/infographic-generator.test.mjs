import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInfographicGenerator, buildImagePromptSystemMessage } = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 使用日报一览图指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.match(msg, /日报一览图/);
    assert.doesNotMatch(msg, /播客文字稿/);
});

test('generateInfographic calls official OpenAI Images API and decodes b64_json', async () => {
    const calls = [];
    const generator = createInfographicGenerator({
        config: {
            openaiApiKey: 'openai-key'
        },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            calls.push({ url, method, body: opts?.body ? JSON.parse(opts.body) : null });
            return new Response(JSON.stringify({
                data: [{ b64_json: Buffer.from('fake-image-bytes').toString('base64') }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    });

    const buffer = await generator.generateInfographic({
        prompt: '画一张只有三条核心信息的日报一览图'
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].url, 'https://api.openai.com/v1/images/generations');
    assert.equal(calls[0].body.model, 'gpt-image-2');
    assert.match(calls[0].body.prompt, /只有三条核心信息/);
    assert.equal(calls[0].body.n, 1);
    assert.equal(calls[0].body.size, '1024x1536');
    assert.equal(calls[0].body.quality, 'high');
    assert.equal(calls[0].body.output_format, 'jpeg');
    assert.equal(calls[0].body.output_compression, 80);
    assert.equal(calls[0].body.response_format, undefined);

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-image-bytes'));
});

test('generateInfographic rejects non-official base URL configuration', async () => {
    const generator = createInfographicGenerator({
        config: {
            openaiApiKey: 'openai-key',
            openaiBaseUrl: 'https://intermediary.example.com'
        },
        fetchImpl: async () => {
            throw new Error('should not call intermediary');
        }
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /官方 OpenAI/);
});

test('generateInfographic 在缺少 OPENAI_API_KEY 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { openaiApiKey: '' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /OPENAI_API_KEY/);
});

test('generateInfographic 在 Images API 未返回图片时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { openaiApiKey: 'openai-key' },
        fetchImpl: async () => new Response(JSON.stringify({
            data: []
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /b64_json/);
});

test('generateInfographic 透传 Images API 错误', async () => {
    const generator = createInfographicGenerator({
        config: { openaiApiKey: 'openai-key' },
        fetchImpl: async () => new Response(JSON.stringify({
            error: { message: 'Generation failed' }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /Generation failed/);
});
