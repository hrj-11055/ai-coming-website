import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const NAV_PAGES = [
    'index.html',
    'about.html',
    'news.html',
    'tools.html',
    'skills.html',
    'skill-detail.html',
    'mcp-detail.html'
];

function readProjectFile(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('public navigation no longer exposes the practice page entry', () => {
    for (const page of NAV_PAGES) {
        const html = readProjectFile(page);

        assert.doesNotMatch(
            html,
            /href="practice\.html"/,
            `Expected ${page} navigation to stop linking to practice.html`
        );
    }
});

test('practice page file has been removed from the site root', () => {
    assert.equal(
        existsSync(new URL('../practice.html', import.meta.url)),
        false,
        'Expected practice.html to be removed from the repository root'
    );
});
