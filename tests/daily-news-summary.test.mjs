import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    MAX_TOTAL_CHARACTERS,
    countCharacters,
    createDailyNewsSummarizer,
    createDailyNewsSummaryConfigFromEnv,
    normalizeDailyNewsSummaryItems,
    validateCachedDailyNewsSummary
} = require('../server/services/daily-news-summary.js');

function buildSourceItems() {
    return Array.from({ length: 10 }, (_, index) => ({
        title: `原始新闻标题${index + 1}`,
        originalTitle: `原始新闻标题${index + 1}`,
        keyPoint: `第${index + 1}条新闻发生了明确变化。`,
        summary: `这是第${index + 1}条新闻的已有摘要，只能据此进行概括。`,
        sourceName: '测试来源',
        sourceUrl: `https://example.com/${index + 1}`,
        importanceScore: 10 - index
    }));
}

function buildApiItems() {
    return Array.from({ length: 10 }, (_, index) => ({
        index: index + 1,
        headline: `这是一个明显超过限制的精简新闻标题${index + 1}`,
        sentence1: `事件已经出现清晰进展并得到多方确认${index + 1}`,
        sentence2: `行业后续影响正在持续显现值得关注${index + 1}`
    }));
}

test('daily news summary config reuses DeepSeek credentials and normalizes base URL', () => {
    const config = createDailyNewsSummaryConfigFromEnv({
        DEEPSEEK_API_KEY: 'deepseek-key',
        DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
        DEEPSEEK_MODEL: 'deepseek-v4-pro'
    });

    assert.equal(config.apiKey, 'deepseek-key');
    assert.equal(config.apiUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(config.model, 'deepseek-v4-pro');
});

test('daily news summarizer requests JSON and returns ten two-sentence items under 500 characters', async () => {
    const calls = [];
    const summarizer = createDailyNewsSummarizer({
        config: {
            apiKey: 'deepseek-key',
            apiUrl: 'https://api.deepseek.com/chat/completions',
            model: 'deepseek-v4-pro',
            timeoutMs: 5000,
            maxRetries: 0
        },
        fetchImpl: async (url, init) => {
            calls.push({ url, init, body: JSON.parse(init.body) });
            return new Response(JSON.stringify({
                model: 'deepseek-v4-pro',
                choices: [{
                    message: {
                        content: JSON.stringify({ items: buildApiItems() })
                    }
                }],
                usage: {
                    prompt_tokens: 320,
                    completion_tokens: 180,
                    total_tokens: 500
                }
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    });

    const result = await summarizer.summarizeDailyNews({
        date: '2026-08-10',
        items: buildSourceItems()
    });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions');
    assert.equal(calls[0].body.model, 'deepseek-v4-pro');
    assert.deepEqual(calls[0].body.response_format, { type: 'json_object' });
    assert.deepEqual(calls[0].body.thinking, { type: 'disabled' });
    assert.match(calls[0].body.messages[1].content, /必须输出 10 条/);
    assert.equal(result.items.length, 10);
    result.items.forEach((item) => {
        assert.match(item.keyPoint, /^[^。]+。[^。]+。$/);
        assert.ok(item.sentence1);
        assert.ok(item.sentence2);
        assert.ok(countCharacters(item.title) <= 14);
        assert.ok(countCharacters(item.sentence1) <= 13);
        assert.ok(countCharacters(item.sentence2) <= 13);
    });
    assert.equal(result.characterCount, countCharacters(result.content));
    assert.ok(result.characterCount <= MAX_TOTAL_CHARACTERS);
    assert.equal(result.usage.total_tokens, 500);
});

test('daily news summary rejects missing items and validates matching cache fingerprints', () => {
    assert.throws(
        () => normalizeDailyNewsSummaryItems({ items: buildApiItems().slice(0, 9) }, buildSourceItems()),
        /必须返回 10 条/
    );

    const normalized = normalizeDailyNewsSummaryItems({ items: buildApiItems() }, buildSourceItems());
    const cache = {
        source_fingerprint: 'source-1',
        model: 'deepseek-v4-pro',
        usage: { total_tokens: 500 },
        generated_at: '2026-08-10T01:00:00.000Z',
        items: normalized.items
    };

    const hit = validateCachedDailyNewsSummary(cache, 'source-1');
    assert.equal(hit.items.length, 10);
    assert.equal(hit.content, normalized.content);
    assert.equal(validateCachedDailyNewsSummary(cache, 'source-2'), null);
});
