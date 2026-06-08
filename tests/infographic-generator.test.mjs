import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    buildDailyNewspicOverlaySvg,
    buildImagePromptSystemMessage,
    composeDailyNewspicImage,
    createDailyNewspicFallbackBackground,
    createInfographicGenerator
} = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 使用图生图日报报纸版式指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.match(msg, /高质量中文 AI 日报一览图/);
    assert.match(msg, /参考图/);
    assert.match(msg, /报纸/);
    assert.match(msg, /竖版/);
});

test('generateInfographic calls TokenGo image edits API with reference image and downloads the returned URL', async () => {
    const calls = [];
    const generator = createInfographicGenerator({
        config: {
            tokenGoApiKey: 'tokengo-key',
            referenceImageBuffer: Buffer.from('reference-image-bytes')
        },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            const body = opts?.body || null;
            calls.push({
                url,
                method,
                authorization: opts?.headers?.Authorization,
                contentType: opts?.headers?.['Content-Type'] || null,
                body
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
        prompt: '生成一张 2026年6月4日 的高质量中文 AI 日报一览图，只展示以下 10 条核心信息。'
    });

    assert.equal(calls.length, 2);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].url, 'https://ai.ssgoo.net/v1/images/edits');
    assert.equal(calls[0].authorization, 'Bearer tokengo-key');
    assert.equal(calls[0].contentType, null);
    assert.ok(calls[0].body instanceof FormData);
    assert.equal(calls[0].body.get('model'), 'gpt-image-2');
    assert.match(calls[0].body.get('prompt'), /高质量中文 AI 日报一览图/);
    assert.match(calls[0].body.get('prompt'), /参考图/);
    assert.match(calls[0].body.get('prompt'), /10 条核心信息/);
    assert.equal(calls[0].body.get('size'), '1024x1536');
    assert.equal(calls[0].body.get('quality'), 'high');
    assert.equal(calls[0].body.get('output_format'), 'png');
    assert.equal(calls[0].body.get('response_format'), 'url');
    assert.equal(calls[0].body.get('input_fidelity'), 'high');
    assert.ok(calls[0].body.get('image') instanceof Blob);
    assert.deepEqual(
        Buffer.from(await calls[0].body.get('image').arrayBuffer()),
        Buffer.from('reference-image-bytes')
    );
    assert.equal(calls[1].method, 'GET');
    assert.equal(calls[1].url, 'https://cdn.example.com/daily.jpg');

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-image-bytes'));
});

test('generateInfographic supports TokenGo b64_json responses', async () => {
    const generator = createInfographicGenerator({
        config: {
            tokenGoApiKey: 'tokengo-key',
            responseFormat: 'b64_json',
            referenceImageBuffer: Buffer.from('reference-image-bytes')
        },
        fetchImpl: async () => new Response(JSON.stringify({
            data: [{ b64_json: Buffer.from('fake-image-bytes').toString('base64') }]
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });

    const buffer = await generator.generateInfographic({ prompt: 'test' });
    assert.deepEqual(buffer, Buffer.from('fake-image-bytes'));
});

test('composeDailyNewspicImage overlays exact newspic text onto the final image', async () => {
    const onePixelPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
        'base64'
    );
    const content = Array.from({ length: 10 }, (_, index) => (
        `${index + 1}. 第${index + 1}条标题：这是第${index + 1}条来自文章正文的核心信息。`
    )).join('\n\n');

    const overlaySvg = buildDailyNewspicOverlaySvg({ date: '2026-06-05', content }).toString('utf8');
    assert.match(overlaySvg, /小元说 AI日报/);
    assert.match(overlaySvg, /2026\.06\.05/);
    assert.match(overlaySvg, /第1条标题/);
    assert.match(overlaySvg, /第10条标题/);

    const buffer = await composeDailyNewspicImage({
        backgroundBuffer: onePixelPng,
        date: '2026-06-05',
        content
    });
    assert.ok(Buffer.isBuffer(buffer));
    assert.equal(buffer.subarray(0, 2).toString('hex'), 'ffd8');
    assert.ok(buffer.length <= 1024 * 1024);
});

test('createDailyNewspicFallbackBackground creates a WeChat-sized JPEG background', async () => {
    const buffer = await createDailyNewspicFallbackBackground();
    assert.ok(Buffer.isBuffer(buffer));
    assert.equal(buffer.subarray(0, 2).toString('hex'), 'ffd8');
    assert.ok(buffer.length <= 1024 * 1024);
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
