import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInfographicGenerator, buildImagePromptSystemMessage } = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 使用直给式图片指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.equal(msg, '请基于下面播客文字稿画一幅《小元说 AI日报》图片。');
});

test('generateInfographic 直接把固定指令和播客稿发给 gpt-image-2-official，并轮询获取结果和下载图片', async () => {
    const calls = [];
    const generator = createInfographicGenerator({
        config: {
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://example.com',
            pollIntervalMs: 1 // Fast polling in tests
        },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            calls.push({ url, method, body: opts?.body ? JSON.parse(opts.body) : null });

            if (method === 'POST' && url.endsWith('/v1/images/generations')) {
                return new Response(JSON.stringify({
                    code: 200,
                    data: { task_id: 'task-test-123' }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            if (method === 'GET' && url.endsWith('/v1/tasks/task-test-123')) {
                const callCount = calls.filter(c => c.url.endsWith('/v1/tasks/task-test-123')).length;
                if (callCount === 1) {
                    return new Response(JSON.stringify({
                        code: 200,
                        data: { id: 'task-test-123', status: 'processing' }
                    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else {
                    return new Response(JSON.stringify({
                        code: 200,
                        data: {
                            id: 'task-test-123',
                            status: 'completed',
                            result: {
                                images: [{ url: ['https://example.com/generated-image.png'] }]
                            }
                        }
                    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }
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

    // We expect:
    // 1. POST /v1/images/generations
    // 2. GET /v1/tasks/task-test-123 (processing status check)
    // 3. GET /v1/tasks/task-test-123 (completed status check)
    // 4. GET https://example.com/generated-image.png (image download)
    assert.equal(calls.length, 4);

    assert.equal(calls[0].method, 'POST');
    assert.match(calls[0].url, /\/v1\/images\/generations/);
    assert.equal(calls[0].body.model, 'gpt-image-2-official');
    assert.equal(calls[0].body.prompt, '请基于下面播客文字稿画一幅《小元说 AI日报》图片。\n\n## 今日播客\n三大AI新闻...');
    assert.equal(calls[0].body.n, 1);
    assert.equal(calls[0].body.size, '16:9');
    assert.equal(calls[0].body.resolution, '2k');
    assert.equal(calls[0].body.quality, 'high');

    assert.equal(calls[1].method, 'GET');
    assert.match(calls[1].url, /\/v1\/tasks\/task-test-123/);

    assert.equal(calls[2].method, 'GET');
    assert.match(calls[2].url, /\/v1\/tasks\/task-test-123/);

    assert.equal(calls[3].method, 'GET');
    assert.equal(calls[3].url, 'https://example.com/generated-image.png');

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 不再要求 DeepSeek key', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: '', gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com', pollIntervalMs: 1 },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            if (method === 'POST') {
                return new Response(JSON.stringify({ code: 200, data: { task_id: 'task-key-test' } }), { status: 200 });
            }
            if (method === 'GET' && url.includes('/v1/tasks/task-key-test')) {
                return new Response(JSON.stringify({
                    code: 200,
                    data: { status: 'completed', result: { images: [{ url: 'https://x.com/img.png' }] } }
                }), { status: 200 });
            }
            if (method === 'GET' && url === 'https://x.com/img.png') {
                return new Response(Buffer.from('fake-png-bytes'), { status: 200 });
            }
            throw new Error(`Unexpected request: ${url}`);
        }
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

test('generateInfographic 在 APIMart 未返回 task_id 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => new Response(JSON.stringify({
            code: 200,
            data: {}
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /未返回 task_id/);
});

test('generateInfographic 在 APIMart 任务失败时抛出错误', async () => {
    const generator = createInfographicGenerator({
        config: { gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com', pollIntervalMs: 1 },
        fetchImpl: async (url, opts) => {
            const method = opts?.method || 'GET';
            if (method === 'POST') {
                return new Response(JSON.stringify({ code: 200, data: { task_id: 'task-fail' } }), { status: 200 });
            }
            if (method === 'GET' && url.includes('/v1/tasks/task-fail')) {
                return new Response(JSON.stringify({
                    code: 200,
                    data: { status: 'failed', result: { message: 'Generation failed' } }
                }), { status: 200 });
            }
            throw new Error(`Unexpected request: ${url}`);
        }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /Generation failed/);
});

