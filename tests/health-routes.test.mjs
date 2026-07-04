import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createHealthRouter } = require('../server/routes/health.js');

function invokeRouter(router, method, url) {
    return new Promise((resolve, reject) => {
        const req = {
            method,
            url,
            originalUrl: url,
            headers: {},
            app: {},
            baseUrl: '',
            path: url,
            query: {}
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(body) {
                resolve({ statusCode: this.statusCode, body });
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

test('health route returns a lightweight ok response', async () => {
    const response = await invokeRouter(createHealthRouter(), 'GET', '/health');

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.equal(typeof response.body.uptime, 'number');
    assert.match(response.body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});
