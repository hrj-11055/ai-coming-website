import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createWeeklyKeywordsAiConfigFromEnv
} = require('../server/services/ai-proxy.js');

test('createWeeklyKeywordsAiConfigFromEnv defaults DeepSeek to V4 Flash', () => {
    const config = createWeeklyKeywordsAiConfigFromEnv({
        DEEPSEEK_API_KEY: 'deepseek-key'
    });

    assert.equal(config.apiKey, 'deepseek-key');
    assert.equal(config.apiUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(config.model, 'deepseek-v4-flash');
});
