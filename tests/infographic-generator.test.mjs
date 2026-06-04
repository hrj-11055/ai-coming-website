import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInfographicGenerator, buildImagePromptSystemMessage } = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 使用直给式图片指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.equal(msg, '请基于下面播客文字稿画一幅《小元说 AI日报》图片。');
});

test('generateInfographic 通过 ssgoo Images API 生成并下载图片', async () => {
    const calls = [];
    const generator = createInfographicGenerator({
        config: {
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://ai.ssgoo.net/'
        },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            calls.push({ url, method, body: opts?.body ? JSON.parse(opts.body) : null });

            if (method === 'POST' && url.endsWith('/v1/images/generations')) {
                return new Response(JSON.stringify({
                    created: 1770000000,
                    data: [{ url: 'https://example.com/generated-image.png' }]
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            if (method === 'GET' && url === 'https://example.com/generated-image.png') {
                return new Response(Buffer.from('fake-png-bytes'), { status: 200 });
            }

            throw new Error(`Unexpected request: ${method} ${url}`);
        }
    });

    const buffer = await generator.generateInfographic({
        scriptMarkdown: '## 今日播客\n三大AI新闻...'
    });

    assert.equal(calls.length, 2);

    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].url, 'https://ai.ssgoo.net/v1/images/generations');
    assert.equal(calls[0].body.model, 'gpt-image-2');
    assert.equal(calls[0].body.prompt, '请基于下面播客文字稿画一幅《小元说 AI日报》图片。\n\n## 今日播客\n三大AI新闻...');
    assert.equal(calls[0].body.n, 1);
    assert.equal(calls[0].body.size, '1024x1024');
    assert.equal(calls[0].body.quality, 'low');
    assert.equal(calls[0].body.output_format, 'jpeg');
    assert.equal(calls[0].body.output_compression, 70);
    assert.equal(calls[0].body.response_format, 'url');
    assert.equal(calls[0].body.resolution, undefined);

    assert.equal(calls[1].method, 'GET');
    assert.equal(calls[1].url, 'https://example.com/generated-image.png');

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 支持 b64_json 图片响应', async () => {
    const generator = createInfographicGenerator({
        config: {
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://ai.ssgoo.net',
            responseFormat: 'b64_json'
        },
        fetchImpl: async () => new Response(JSON.stringify({
            data: [{ b64_json: Buffer.from('fake-png-bytes').toString('base64') }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    const buffer = await generator.generateInfographic({ scriptMarkdown: 'test' });
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 压缩超过微信 1MB 限制的图片', async () => {
    let compressed = false;
    const oversizedImage = Buffer.alloc((1024 * 1024) + 1);
    const compressedImage = Buffer.from('compressed-jpeg');
    const generator = createInfographicGenerator({
        config: {
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://ai.ssgoo.net'
        },
        compressImage: async (imageBuffer) => {
            assert.equal(imageBuffer.length, oversizedImage.length);
            compressed = true;
            return compressedImage;
        },
        fetchImpl: async (url, opts) => {
            if (opts?.method === 'POST') {
                return new Response(JSON.stringify({
                    data: [{ url: 'https://example.com/oversized.png' }]
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(oversizedImage, { status: 200 });
        }
    });

    const buffer = await generator.generateInfographic({ scriptMarkdown: 'test' });

    assert.equal(compressed, true);
    assert.deepEqual(buffer, compressedImage);
});

test('generateInfographic 在缺少 gpt image key 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: 'ds-key', gptImageApiKey: '', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /GPT Image/);
});

test('generateInfographic 在 Images API 未返回图片时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => new Response(JSON.stringify({
            data: []
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /未返回有效的图片/);
});

test('generateInfographic 透传 Images API 错误', async () => {
    const generator = createInfographicGenerator({
        config: { gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => new Response(JSON.stringify({
            error: { message: 'Generation failed' }
        }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /Generation failed/);
});
