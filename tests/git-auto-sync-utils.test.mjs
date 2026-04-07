import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    buildCommitMessage,
    parsePorcelainStatus,
    shouldIgnoreRelativePath
} = require('../scripts/git-auto-sync-utils.js');

test('shouldIgnoreRelativePath ignores repo noise but keeps real source files', () => {
    assert.equal(shouldIgnoreRelativePath('.git/index.lock'), true);
    assert.equal(shouldIgnoreRelativePath('node_modules/express/index.js'), true);
    assert.equal(shouldIgnoreRelativePath('logs/git-auto-sync.log'), true);
    assert.equal(shouldIgnoreRelativePath('about.html'), false);
    assert.equal(shouldIgnoreRelativePath('server/runtime.js'), false);
});

test('parsePorcelainStatus parses regular, untracked, and renamed files', () => {
    const entries = parsePorcelainStatus([
        ' M about.html',
        '?? scripts/git-auto-sync.js',
        'R  old-name.js -> new-name.js'
    ].join('\n'));

    assert.deepEqual(entries, [
        { status: ' M', path: 'about.html' },
        { status: '??', path: 'scripts/git-auto-sync.js' },
        { status: 'R ', path: 'new-name.js' }
    ]);
});

test('buildCommitMessage includes timestamp and a short file preview', () => {
    const message = buildCommitMessage(
        ['about.html', 'scripts/git-auto-sync.js', 'package.json', 'tests/git-auto-sync-utils.test.mjs'],
        new Date('2026-04-08T04:05:06.000Z')
    );

    assert.equal(
        message,
        'chore(auto): sync 2026-04-08 04:05:06Z about.html, scripts/git-auto-sync.js, package.json +1'
    );
});
