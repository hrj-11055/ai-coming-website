import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../admin-analytics.html', import.meta.url), 'utf8');

test('admin analytics page exposes interaction click stats', () => {
    assert.match(html, /交互点击统计/, 'Expected admin analytics to show interaction stats section');
    assert.match(html, /\/api\/interaction\/summary/, 'Expected admin analytics to load interaction summary API');
    assert.match(html, /\/api\/interaction\/recent/, 'Expected admin analytics to load recent interaction API');
    assert.match(html, /uniqueVisitors/, 'Expected admin analytics to render unique visitor counts');
    assert.match(html, /podcast_play/, 'Expected admin analytics to label podcast play events');
});
