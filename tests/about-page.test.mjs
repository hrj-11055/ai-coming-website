import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readProjectFile(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('about page includes the AI资讯日报 product case section between method and team', () => {
    const html = readProjectFile('about.html');

    const methodIndex = html.indexOf('我们怎么做');
    const caseIndex = html.indexOf('科技产品案例');
    const titleIndex = html.indexOf('AI资讯日报');
    const teamIndex = html.indexOf('<!-- ===== TEAM ===== -->');

    assert.ok(methodIndex !== -1, 'Expected the method section to exist');
    assert.ok(caseIndex !== -1, 'Expected the product case label to exist');
    assert.ok(titleIndex !== -1, 'Expected the AI资讯日报 title to exist');
    assert.ok(teamIndex !== -1, 'Expected the team section marker to exist');

    assert.ok(caseIndex > methodIndex, 'Expected the case section after the method section');
    assert.ok(caseIndex < teamIndex, 'Expected the case section before the team section');

    assert.match(
        html,
        /<a href="news\.html"[^>]*>\s*查看 AI资讯日报\s*<\/a>/,
        'Expected the case section CTA to point to news.html'
    );

    assert.match(html, /持续运营的一款 AI 内容产品/, 'Expected the main product description');
    assert.match(html, /每日 AI 资讯/, 'Expected the case section to mention daily news');
    assert.match(html, /热点关键词/, 'Expected the case section to mention hot keywords');
    assert.match(html, /今日播客/, 'Expected the case section to mention the podcast capability');
});
