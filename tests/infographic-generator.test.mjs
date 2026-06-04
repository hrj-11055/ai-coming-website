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

test('generateInfographic calls TokenGo Images API and downloads the returned URL', async () => {
    const calls = [];
    const generator = createInfographicGenerator({
        config: {
            tokenGoApiKey: 'tokengo-key'
        },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            calls.push({
                url,
                method,
                authorization: opts?.headers?.Authorization,
                body: opts?.body ? JSON.parse(opts.body) : null
            });
            if (method === 'GET') {
                return new Response(Buffer.from('fake-image-bytes'), {
                    status: 200,
                    headers: { 'Content-Type': 'image/jpeg' }
                });
            }
            return new Response(JSON.stringify({
                data: [{ url: 'https://cdn.example.com/daily.jpg' }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    });

    const buffer = await generator.generateInfographic({
        prompt: '画一张只有三条核心信息的日报一览图'
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].url, 'https://ai.ssgoo.net/v1/images/generations');
    assert.equal(calls[0].authorization, 'Bearer tokengo-key');
    assert.equal(calls[0].body.model, 'gpt-image-2');
    assert.match(calls[0].body.prompt, /只有三条核心信息/);
    assert.equal(calls[0].body.n, 1);
    assert.equal(calls[0].body.size, '1024x1536');
    assert.equal(calls[0].body.quality, 'high');
    assert.equal(calls[0].body.output_format, 'jpeg');
    assert.equal(calls[0].body.output_compression, 80);
    assert.equal(calls[0].body.response_format, 'url');
    assert.equal(calls[1].method, 'GET');
    assert.equal(calls[1].url, 'https://cdn.example.com/daily.jpg');

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-image-bytes'));
});

test('generateInfographic supports TokenGo b64_json responses', async () => {
    const generator = createInfographicGenerator({
        config: {
            tokenGoApiKey: 'tokengo-key',
            responseFormat: 'b64_json'
        },
        fetchImpl: async () => new Response(JSON.stringify({
            data: [{ b64_json: Buffer.from('fake-image-bytes').toString('base64') }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });

    const buffer = await generator.generateInfographic({ prompt: 'test' });
    assert.deepEqual(buffer, Buffer.from('fake-image-bytes'));
});

test('generateInfographic 在缺少 TOKENGO_API_KEY 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { tokenGoApiKey: '' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /TOKENGO_API_KEY/);
});

test('generateInfographic 在 Images API 未返回图片时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { tokenGoApiKey: 'tokengo-key' },
        fetchImpl: async () => new Response(JSON.stringify({
            data: []
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /图片 URL 或 b64_json/);
});

test('generateInfographic 透传 Images API 错误', async () => {
    const generator = createInfographicGenerator({
        config: { tokenGoApiKey: 'tokengo-key' },
        fetchImpl: async () => new Response(JSON.stringify({
            error: { message: 'Generation failed' }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ prompt: 'test' }), /Generation failed/);
});
