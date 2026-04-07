import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readProjectFile(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('about page highlights company-level consulting and training services', () => {
    const html = readProjectFile('about.html');

    assert.match(html, /企业培训与咨询服务/, 'Expected a dedicated enterprise training services section');
    assert.match(html, /AI 战略咨询/, 'Expected the about page to mention AI strategic consulting');
    assert.match(html, /AI 转型咨询/, 'Expected the about page to mention AI transformation consulting');
    assert.match(html, /AI\+GTM/, 'Expected the about page to mention AI+GTM service capability');
    assert.match(html, /企业内训/, 'Expected the about page to emphasize enterprise internal training delivery');
    assert.match(html, /工作坊/, 'Expected the about page to emphasize workshop-style delivery');
    assert.match(html, /训后陪跑/, 'Expected the about page to mention post-training enablement');
    assert.match(html, /管理层/, 'Expected the about page to mention management training');
    assert.match(html, /销售/, 'Expected the about page to mention sales training');
    assert.match(html, /财务/, 'Expected the about page to mention finance training');
    assert.match(html, /组织效能/, 'Expected the about page to mention organization effectiveness training');
    assert.match(html, /50\+ 企业与机构/, 'Expected the about page to include company-level proof points');
    assert.match(html, /11000\+ 学员/, 'Expected the about page to include training reach proof points');
    assert.match(html, /15\+ 行业场景/, 'Expected the about page to include industry coverage proof points');
});

test('about page avoids person-centric credentials in service copy', () => {
    const html = readProjectFile('about.html');

    assert.doesNotMatch(html, /黄兴元/, 'Expected the about page to avoid the personal name');
    assert.doesNotMatch(html, /\bCIO\b/, 'Expected the about page to avoid CIO-style personal titles');
    assert.doesNotMatch(html, /专家评审/, 'Expected the about page to avoid personal credential copy');
    assert.doesNotMatch(html, /央视/, 'Expected the about page to avoid media-credit personal copy');
});
