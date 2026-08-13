import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createCorsOptions, normalizeTrustProxy } = require('../server/app.js');
const { normalizeAiRequest, normalizeModelError } = require('../server/routes/ai.js');
const { isLocalIP } = require('../server/routes/security.js');
const { createJsonFileStore, writeJsonAtomic } = require('../server/services/file-store.js');
const { validateProductionSecurityConfig } = require('../server/runtime.js');

function evaluateCors(options, origin) {
    return new Promise((resolve, reject) => {
        options.origin(origin, (error, allowed) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(allowed);
        });
    });
}

test('CORS defaults to same-origin requests and allows configured origins only', async () => {
    const options = createCorsOptions('https://aicoming.cn, https://www.aicoming.cn');

    assert.equal(await evaluateCors(options, undefined), true);
    assert.equal(await evaluateCors(options, 'https://aicoming.cn'), true);
    assert.equal(await evaluateCors(options, 'https://attacker.example'), false);
});

test('trust proxy accepts safe deployment values', () => {
    assert.equal(normalizeTrustProxy(undefined), 'loopback');
    assert.equal(normalizeTrustProxy('1'), 1);
    assert.equal(normalizeTrustProxy('false'), false);
    assert.equal(normalizeTrustProxy('loopback'), 'loopback');
});

test('private and loopback addresses are recognized across common forms', () => {
    assert.equal(isLocalIP('::ffff:127.0.0.1'), true);
    assert.equal(isLocalIP('172.16.4.2'), true);
    assert.equal(isLocalIP('172.31.255.1'), true);
    assert.equal(isLocalIP('172.32.0.1'), false);
    assert.equal(isLocalIP('203.0.113.9'), false);
});

test('production rejects placeholder secrets and weak bootstrap passwords', () => {
    assert.throws(() => validateProductionSecurityConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'ai-coming-secret-key-please-change-in-production'
    }), /JWT_SECRET/);

    assert.throws(() => validateProductionSecurityConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-unique-production-secret-that-is-long-enough',
        DEFAULT_ADMIN_PASSWORD: 'admin123456'
    }), /DEFAULT_ADMIN_PASSWORD/);

    assert.doesNotThrow(() => validateProductionSecurityConfig({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-unique-production-secret-that-is-long-enough',
        DEFAULT_ADMIN_PASSWORD: 'a-unique-bootstrap-password'
    }));
});

test('AI request normalization enforces query, token, temperature and timeout limits', () => {
    assert.deepEqual(normalizeAiRequest({ query: '   ' }), {
        error: {
            status: 400,
            message: 'query 参数必须是非空字符串'
        }
    });

    assert.equal(normalizeAiRequest({ query: '123456' }, { maxQueryChars: 5 }).error.status, 413);

    const normalized = normalizeAiRequest({
        query: '  hello  ',
        temperature: 99,
        max_tokens: 99999,
        stream: false
    }, {
        maxOutputTokens: 2048,
        timeoutMs: 30000
    });

    assert.deepEqual(normalized, {
        query: 'hello',
        temperature: 2,
        maxTokens: 2048,
        stream: false,
        timeoutMs: 30000
    });
    assert.equal(normalizeModelError({ name: 'TimeoutError' }).status, 504);
});

test('JSON writes replace the target atomically and cached paths flush correctly', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-coming-store-'));
    const directFile = path.join(directory, 'direct.json');
    const cachedFile = path.join(directory, 'nested', 'cached.json');

    try {
        writeJsonAtomic(directFile, { ok: true });
        assert.deepEqual(JSON.parse(fs.readFileSync(directFile, 'utf8')), { ok: true });
        assert.deepEqual(fs.readdirSync(directory).filter((name) => name.endsWith('.tmp')), []);

        const store = createJsonFileStore();
        assert.equal(store.writeJson(cachedFile, [{ id: 1 }], 'api-calls'), true);
        assert.equal(fs.existsSync(cachedFile), false);

        store.flushCache('api-calls');
        assert.deepEqual(JSON.parse(fs.readFileSync(cachedFile, 'utf8')), [{ id: 1 }]);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

test('operational entrypoints do not expose or fall back to the retired default password', () => {
    const repoRoot = path.resolve(import.meta.dirname, '..');
    const operationalFiles = [
        'server/start.js',
        'sync-json-news.sh',
        'scripts/smoke-json.js',
        'scripts/auto-upload-news.js',
        'scripts/auto_upload_news.py',
        'run.sh'
    ];

    for (const relativePath of operationalFiles) {
        const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
        assert.equal(source.includes('admin123456'), false, relativePath);
    }
});
