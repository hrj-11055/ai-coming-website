#!/usr/bin/env node

const { spawn } = require('child_process');

const HOST = '127.0.0.1';
const PORT = process.env.SMOKE_PORT || '3000';
const BASE = process.env.SMOKE_BASE_URL || `http://${HOST}:${PORT}`;
const TIMEOUT_MS = 30000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, options);
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }
    return { status: res.status, data };
}

async function waitForServer() {
    const start = Date.now();
    while (Date.now() - start < TIMEOUT_MS) {
        try {
            const res = await request('/api/stats');
            if (res.status === 200) return;
        } catch {
            // Server not ready yet.
        }
        await sleep(500);
    }
    throw new Error(`Server not ready at ${BASE}`);
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    const spawnServer = process.env.SMOKE_SPAWN_SERVER === '1';
    let child = null;
    let logs = '';

    if (spawnServer) {
        child = spawn('node', ['server-json.js'], {
            env: {
                ...process.env,
                HOST,
                PORT
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        child.stdout.on('data', (d) => {
            logs += d.toString();
        });
        child.stderr.on('data', (d) => {
            logs += d.toString();
        });
    }

    try {
        await waitForServer();

        const news = await request('/api/news');
        assert(news.status === 200, `GET /api/news expected 200 got ${news.status}`);
        assert(Array.isArray(news.data), 'GET /api/news expected JSON array');

        const settings = await request('/api/settings');
        assert(settings.status === 200, `GET /api/settings expected 200 got ${settings.status}`);
        assert(settings.data && typeof settings.data === 'object', 'GET /api/settings expected object');

        const badLogin = await request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'invalid', password: 'invalid' })
        });
        assert(badLogin.status === 401, `POST /api/auth/login invalid expected 401 got ${badLogin.status}`);

        const adminUser = process.env.SMOKE_ADMIN_USERNAME || process.env.DEFAULT_ADMIN_USERNAME || 'admin';
        const adminPass = process.env.SMOKE_ADMIN_PASSWORD || process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456';
        const login = await request('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: adminUser, password: adminPass })
        });
        assert(login.status === 200, `POST /api/auth/login valid expected 200 got ${login.status}`);
        assert(login.data && login.data.token, 'POST /api/auth/login valid expected token');

        const authHeader = { Authorization: `Bearer ${login.data.token}` };

        const dates = await request('/api/archive/dates?type=daily', { headers: authHeader });
        assert(dates.status === 200, `GET /api/archive/dates expected 200 got ${dates.status}`);
        assert(dates.data && Array.isArray(dates.data.dates), 'GET /api/archive/dates expected {dates: []}');

        const invalidType = await request('/api/archive/dates?type=invalid', { headers: authHeader });
        assert(invalidType.status === 400, `GET /api/archive/dates invalid type expected 400 got ${invalidType.status}`);

        const invalidDate = await request('/api/archive/%2e%2e%2fsettings?type=daily', { headers: authHeader });
        assert(invalidDate.status === 400, `GET /api/archive/:date traversal expected 400 got ${invalidDate.status}`);

        console.log('Smoke test passed: auth/news/settings/archive');
    } finally {
        if (child) {
            child.kill('SIGTERM');
            await sleep(300);
            if (!child.killed) {
                child.kill('SIGKILL');
            }
        }
        if (process.env.SMOKE_DEBUG_LOGS === '1' && logs) {
            console.log(logs);
        }
    }
}

run().catch((err) => {
    console.error(`Smoke test failed: ${err.message}`);
    process.exit(1);
});
