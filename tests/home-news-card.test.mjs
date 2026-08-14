import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const homepage = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const newsModule = readFileSync(new URL('../frontend/modules/core-news.js', import.meta.url), 'utf8');

test('homepage news cards expose a visible source and safe external link', () => {
    assert.match(newsModule, /class="article-item__source"/);
    assert.match(newsModule, /article\.source_name \|\| '其他'/);
    assert.match(newsModule, /rel="noopener noreferrer" class="article-item__read-more/);
});

test('homepage news cards include mobile overflow and hierarchy safeguards', () => {
    assert.match(homepage, /@media \(max-width: 640px\)/);
    assert.match(homepage, /\.article-item \{[\s\S]*?max-width: 100%;[\s\S]*?overflow: hidden;/);
    assert.match(homepage, /\.article-item__title \{[\s\S]*?font-size: 1\.125rem;/);
    assert.match(homepage, /\.article-item__summary \{[\s\S]*?-webkit-line-clamp: 5;/);
    assert.match(homepage, /\.article-item__source \{[\s\S]*?max-width: 68%;/);
});
