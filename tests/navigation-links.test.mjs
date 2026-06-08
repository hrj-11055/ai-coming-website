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

test('AI news is the homepage and prompt expert is the second navigation tab', () => {
    const homepage = readProjectFile('index.html');
    const promptExpert = readProjectFile('news.html');

    assert.match(homepage, /frontend\/bootstrap\.js/, 'Expected the homepage to load the AI news frontend');
    assert.match(promptExpert, /frontend\/index-page\.js/, 'Expected the second tab to load the prompt expert frontend');

    for (const page of NAV_PAGES) {
        const html = readProjectFile(page);

        assert.match(html, /href="index\.html"[^>]*>首页<\/a>/, `Expected ${page} to link to the homepage`);
        assert.match(html, /href="news\.html"[^>]*>提示生成专家<\/a>/, `Expected ${page} to show prompt expert as the second tab`);
    }

    assert.match(homepage, /href="index\.html" class="nav-link active"/, 'Expected homepage tab to be active on AI news');
    assert.match(promptExpert, /href="news\.html" class="nav-link active"/, 'Expected prompt expert tab to be active');
});
