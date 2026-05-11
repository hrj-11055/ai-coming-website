import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');

function makeTempDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

test('sync-json-news refuses to import yesterday when today report is missing', () => {
    const root = makeTempDir('report-sync-today-only-');
    const sourceDir = path.join(root, 'source');
    const projectDir = path.join(root, 'project');
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(projectDir, { recursive: true });
    writeJson(path.join(sourceDir, '2026-04-27.json'), {
        articles: [{ title: 'old report' }]
    });

    const result = spawnSync('bash', [path.join(repoRoot, 'sync-json-news.sh')], {
        env: {
            ...process.env,
            REPORT_SOURCE_DIR: sourceDir,
            PROJECT_DIR: projectDir,
            SYNC_REPORT_DATE: '2026-04-28'
        },
        encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr);
    const log = fs.readFileSync(path.join(projectDir, 'logs', 'json-sync.log'), 'utf8');
    assert.match(log, /当天日报不存在/);
    assert.equal(fs.existsSync(path.join(projectDir, 'data', 'news-2026-04-27.json')), false);
});

test('watch-report-to-data can copy only the requested report date', () => {
    const root = makeTempDir('report-watch-date-');
    const sourceDir = path.join(root, 'source');
    const targetDir = path.join(root, 'target');
    fs.mkdirSync(sourceDir, { recursive: true });
    writeJson(path.join(sourceDir, '2026-04-27.json'), {
        articles: [{ title: 'old report' }]
    });
    writeJson(path.join(sourceDir, '2026-04-28.json'), {
        articles: [{ title: 'today report' }]
    });

    const result = spawnSync('bash', [path.join(repoRoot, 'scripts', 'watch-report-to-data.sh'), '--once'], {
        env: {
            ...process.env,
            REPORT_SOURCE_DIR: sourceDir,
            TARGET_DATA_DIR: targetDir,
            REPORT_WATCH_LOG_FILE: path.join(root, 'watch.log'),
            REPORT_WATCH_DATE: '2026-04-28'
        },
        encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(targetDir, 'news-2026-04-28.json')), true);
    assert.equal(fs.existsSync(path.join(targetDir, 'news-2026-04-27.json')), false);
});

test('check-daily-report-ready starts upstream service when today report is missing', () => {
    const root = makeTempDir('report-ready-check-');
    const sourceDir = path.join(root, 'source');
    const logFile = path.join(root, 'check.log');
    const callsFile = path.join(root, 'systemctl-calls.log');
    const fakeSystemctl = path.join(root, 'systemctl');
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.writeFileSync(fakeSystemctl, `#!/usr/bin/env bash\necho "$@" >> "${callsFile}"\n`, { mode: 0o755 });

    const result = spawnSync('bash', [path.join(repoRoot, 'scripts', 'check-daily-report-ready.sh')], {
        env: {
            ...process.env,
            REPORT_SOURCE_DIR: sourceDir,
            REPORT_CHECK_DATE: '2026-04-28',
            REPORT_CHECK_LOG_FILE: logFile,
            REPORT_REMEDY_SERVICE: 'ai-rss-daily.service',
            SYSTEMCTL_BIN: fakeSystemctl
        },
        encoding: 'utf8'
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(fs.readFileSync(callsFile, 'utf8'), /start ai-rss-daily\.service/);
    assert.match(fs.readFileSync(logFile, 'utf8'), /MISSING 2026-04-28\.json/);
});
