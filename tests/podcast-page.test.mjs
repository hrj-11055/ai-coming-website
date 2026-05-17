import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('podcast landing page loads metadata and exposes a long-audio player', () => {
    const html = readFileSync(new URL('../podcast.html', import.meta.url), 'utf8');
    const js = readFileSync(new URL('../frontend/podcast-page.js', import.meta.url), 'utf8');

    assert.match(html, /id="podcast-audio"/);
    assert.match(html, /pic\/AIcoming_zixunye\.png/);
    assert.match(js, /\/api\/podcast\/news\/\$\{date\}/);
    assert.match(js, /audio_url/);
    assert.match(js, /podcast\.html\?date=/);
});
