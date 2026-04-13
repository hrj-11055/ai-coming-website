import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    createAiUsageService,
    normalizeUsage,
    calculateUsageCost
} = require('../server/services/ai-usage.js');
const { createAiRouter } = require('../server/routes/ai.js');

function createMemoryStore(initial = []) {
    let data = initial;
    return {
        readData() {
            return data;
        },
        writeData(_file, nextData) {
            data = nextData;
            return true;
        },
        getData() {
            return data;
        }
    };
}

function invokeRouter(router, method, url, body = {}) {
    return new Promise((resolve, reject) => {
        const req = {
            method,
            url,
            originalUrl: url,
            headers: {
                'x-forwarded-for': '203.0.113.8'
            },
            connection: {},
            app: {},
            baseUrl: '',
            path: url,
            query: {},
            body
        };

        const res = {
            statusCode: 200,
            headers: {},
            locals: {},
            status(code) {
                this.statusCode = code;
                return this;
            },
            setHeader(name, value) {
                this.headers[name] = value;
            },
            json(responseBody) {
                resolve({ statusCode: this.statusCode, body: responseBody });
                return this;
            }
        };

        router.handle(req, res, (error) => {
            if (error) {
                reject(error);
                return;
            }

            reject(new Error(`Route not handled: ${method} ${url}`));
        });
    });
}

test('normalizes compatible usage shapes and calculates fixed-model cost', () => {
    const usage = normalizeUsage({
        prompt_tokens: 1200,
        completion_tokens: 800
    });

    assert.deepEqual(usage, {
        promptTokens: 1200,
        completionTokens: 800,
        totalTokens: 2000
    });

    assert.deepEqual(calculateUsageCost(usage, {
        inputPricePerMillionTokens: 2,
        outputPricePerMillionTokens: 4
    }), {
        inputCost: 0.0024,
        outputCost: 0.0032,
        totalCost: 0.0056
    });
});

test('records usage with hashed ip and aggregates daily totals', () => {
    const store = createMemoryStore();
    const service = createAiUsageService({
        readData: store.readData,
        writeData: store.writeData,
        usageFile: 'usage.json',
        ipHashSalt: 'test-salt',
        now: () => Date.parse('2026-04-13T02:00:00.000Z'),
        config: {
            model: 'qwen3.5-plus',
            currency: 'USD',
            timeZone: 'Asia/Shanghai',
            inputPricePerMillionTokens: 2,
            outputPricePerMillionTokens: 4
        }
    });

    service.recordUsage({
        ip: '203.0.113.8',
        status: 'success',
        stream: true,
        requestChars: 20,
        latencyMs: 1500,
        usage: {
            prompt_tokens: 1000,
            completion_tokens: 500,
            total_tokens: 1500
        }
    });
    service.recordUsage({
        ip: '203.0.113.8',
        status: 'error',
        stream: true,
        requestChars: 12,
        latencyMs: 300,
        error: 'HTTP 429'
    });

    const records = store.getData();
    assert.equal(records.length, 2);
    assert.equal(records[0].date, '2026-04-13');
    assert.equal(records[0].ipHash.startsWith('sha256:'), true);
    assert.equal(records[0].ipHash.includes('203.0.113.8'), false);
    assert.equal(records[0].totalCost, 0.004);
    assert.equal(records[1].status, 'error');

    const summary = service.getSummary({
        from: '2026-04-13',
        to: '2026-04-13'
    });
    assert.equal(summary.today.requestCount, 2);
    assert.equal(summary.today.successCount, 1);
    assert.equal(summary.today.errorCount, 1);
    assert.equal(summary.today.totalTokens, 1500);
    assert.equal(summary.today.totalCost, 0.004);

    const daily = service.getDailyUsage({
        from: '2026-04-13',
        to: '2026-04-13'
    });
    assert.equal(daily.length, 1);
    assert.equal(daily[0].requestCount, 2);
    assert.equal(daily[0].averageLatencyMs, 900);
});

test('ai route records non-stream usage after successful model response', async () => {
    const originalFetch = globalThis.fetch;
    const store = createMemoryStore();
    const service = createAiUsageService({
        readData: store.readData,
        writeData: store.writeData,
        usageFile: 'usage.json',
        ipHashSalt: 'route-test',
        now: () => Date.parse('2026-04-13T02:00:00.000Z'),
        config: {
            model: 'qwen3.5-plus',
            currency: 'USD',
            timeZone: 'Asia/Shanghai',
            inputPricePerMillionTokens: 1,
            outputPricePerMillionTokens: 3
        }
    });

    globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
            choices: [{ message: { content: 'ok' } }],
            usage: {
                prompt_tokens: 600,
                completion_tokens: 200,
                total_tokens: 800
            }
        })
    });

    try {
        const router = createAiRouter({
            systemPrompt: 'system',
            aiConfig: {
                apiKey: 'sk-test',
                apiUrl: 'https://example.com/chat/completions',
                model: 'qwen3.5-plus'
            },
            aiUsageService: service
        });

        const response = await invokeRouter(router, 'POST', '/ai/chat', {
            query: '什么是 AI?',
            stream: false
        });

        assert.equal(response.statusCode, 200);
        assert.equal(response.body.usage.total_tokens, 800);

        const records = store.getData();
        assert.equal(records.length, 1);
        assert.equal(records[0].status, 'success');
        assert.equal(records[0].stream, false);
        assert.equal(records[0].requestChars, 7);
        assert.equal(records[0].totalTokens, 800);
        assert.equal(records[0].totalCost, 0.0012);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
