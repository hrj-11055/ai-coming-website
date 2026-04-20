import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInteractionRouter } = require('../server/routes/interaction.js');

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

function invokeRouter(router, method, url, body = {}, headers = {}) {
    return new Promise((resolve, reject) => {
        const [pathOnly, queryString = ''] = url.split('?');
        const query = Object.fromEntries(new URLSearchParams(queryString));
        const req = {
            method,
            url,
            originalUrl: url,
            headers: {
                'x-forwarded-for': '203.0.113.8',
                'user-agent': 'node-test',
                ...headers
            },
            connection: {},
            app: {},
            baseUrl: '',
            path: pathOnly,
            query,
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

test('interaction tracking records events and summarizes clicks with unique visitors', async () => {
    const store = createMemoryStore();
    const router = createInteractionRouter({
        readData: store.readData,
        writeData: store.writeData,
        interactionEventsFile: 'interaction-events.json',
        authenticateToken: (_req, _res, next) => next(),
        now: () => new Date('2026-04-20T02:00:00.000Z')
    });

    const first = await invokeRouter(router, 'POST', '/interaction/track', {
        eventType: 'nav_click',
        eventLabel: 'AI工具集',
        target: 'tools.html',
        pagePath: '/news.html'
    });
    assert.equal(first.statusCode, 200);
    assert.equal(first.body.success, true);

    await invokeRouter(router, 'POST', '/interaction/track', {
        eventType: 'nav_click',
        eventLabel: 'AI工具集',
        target: 'tools.html',
        pagePath: '/index.html'
    });
    await invokeRouter(router, 'POST', '/interaction/track', {
        eventType: 'podcast_play',
        eventLabel: '今日播客',
        target: '2026-04-20',
        pagePath: '/news.html'
    }, { 'x-forwarded-for': '203.0.113.9' });

    const records = store.getData();
    assert.equal(records.length, 3);
    assert.equal(records[0].date, '2026-04-20');
    assert.equal(records[0].eventType, 'nav_click');
    assert.equal(records[0].eventLabel, 'AI工具集');
    assert.equal(records[0].ip, '203.0.113.8');

    const summary = await invokeRouter(router, 'GET', '/interaction/summary?from=2026-04-20&to=2026-04-20');
    assert.equal(summary.statusCode, 200);
    assert.equal(summary.body.summary.length, 2);

    const nav = summary.body.summary.find((item) => item.eventType === 'nav_click');
    assert.equal(nav.eventLabel, 'AI工具集');
    assert.equal(nav.clicks, 2);
    assert.equal(nav.uniqueVisitors, 1);

    const podcast = summary.body.summary.find((item) => item.eventType === 'podcast_play');
    assert.equal(podcast.clicks, 1);
    assert.equal(podcast.uniqueVisitors, 1);
});

test('interaction tracking rejects invalid event types', async () => {
    const store = createMemoryStore();
    const router = createInteractionRouter({
        readData: store.readData,
        writeData: store.writeData,
        interactionEventsFile: 'interaction-events.json',
        authenticateToken: (_req, _res, next) => next(),
        now: () => new Date('2026-04-20T02:00:00.000Z')
    });

    const response = await invokeRouter(router, 'POST', '/interaction/track', {
        eventType: '../bad',
        eventLabel: 'bad'
    });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, 'invalid_event_type');
    assert.equal(store.getData().length, 0);
});
