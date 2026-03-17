import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../tools.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../frontend/tools-page.js', import.meta.url), 'utf8');

test('tools sidebar defines category tone styles for layered navigation', () => {
    assert.match(
        html,
        /\.category-link\[data-tone=/,
        'Expected tools sidebar CSS to define tone-specific category styles'
    );
});

test('tools sidebar renderer assigns a tone to each category item', () => {
    assert.match(
        js,
        /const CATEGORY_TONE_MAP = \{/,
        'Expected tools page script to define category tone mappings'
    );

    assert.match(
        js,
        /data-tone="\$\{tone\}"/,
        'Expected rendered category links to include a tone attribute'
    );
});
