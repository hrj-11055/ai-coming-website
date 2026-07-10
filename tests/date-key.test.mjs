import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getShanghaiDateKey } from '../frontend/modules/date-key.js';

test('getShanghaiDateKey uses the Shanghai calendar day after local midnight', () => {
    const afterShanghaiMidnight = new Date('2026-07-09T16:30:00.000Z');

    assert.equal(getShanghaiDateKey(afterShanghaiMidnight), '2026-07-10');
});

test('getShanghaiDateKey keeps the same day before Shanghai midnight', () => {
    const beforeShanghaiMidnight = new Date('2026-07-09T15:30:00.000Z');

    assert.equal(getShanghaiDateKey(beforeShanghaiMidnight), '2026-07-09');
});

test('news and podcast pages use the shared Shanghai date key', () => {
    const newsSource = readFileSync(new URL('../frontend/modules/core-news.js', import.meta.url), 'utf8');
    const podcastSource = readFileSync(new URL('../frontend/podcast-page.js', import.meta.url), 'utf8');

    assert.match(newsSource, /getShanghaiDateKey/);
    assert.doesNotMatch(newsSource, /toISOString\(\)\.split\('T'\)\[0\]/);
    assert.match(podcastSource, /getShanghaiDateKey/);
    assert.doesNotMatch(podcastSource, /toISOString\(\)\.slice\(0, 10\)/);
});
