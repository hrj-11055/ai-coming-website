import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../news.html', import.meta.url), 'utf8');
const indexScript = readFileSync(new URL('../frontend/index-page.js', import.meta.url), 'utf8');

test('prompt expert uses the shared nav container pattern', () => {
    assert.match(html, /<div class="nav-container"[^>]*>/, 'Expected prompt expert to use nav-container markup');
});

test('prompt expert right rail stacks onboarding above examples', () => {
    const rightRailMatch = html.match(/<div class="right-rail"[\s\S]*?<\/div>\s*<!-- 页脚 -->/);

    assert.ok(rightRailMatch, 'Expected a right-rail wrapper before the footer');

    const rightRailHtml = rightRailMatch[0];
    const onboardingIndex = rightRailHtml.indexOf('aria-label="首页新手引导"');
    const casesIndex = rightRailHtml.indexOf('aria-label="示例案例"');

    assert.notEqual(onboardingIndex, -1, 'Expected onboarding panel inside the right rail');
    assert.notEqual(casesIndex, -1, 'Expected cases panel inside the right rail');
    assert.ok(onboardingIndex < casesIndex, 'Expected onboarding panel to appear above the cases panel');
});

test('prompt expert onboarding panel no longer shows the old quick-start heading', () => {
    assert.doesNotMatch(html, /3 步快速使用/, 'Expected the quick-start heading to be removed from the prompt expert onboarding panel');
});

test('prompt expert right rail uses the wider and higher desktop placement', () => {
    const rightRailRuleMatch = html.match(/\.right-rail\s*\{[\s\S]*?\}/);

    assert.ok(rightRailRuleMatch, 'Expected a right-rail CSS rule');

    const rightRailRule = rightRailRuleMatch[0];

    assert.match(rightRailRule, /top:\s*92px;/, 'Expected the right rail to move higher on desktop');
    assert.match(rightRailRule, /width:\s*300px;/, 'Expected the right rail to be wider on desktop');
});

test('prompt expert footer keeps filing text without the shared dark footer treatment', () => {
    assert.match(html, /<div class="footer footer-minimal">/, 'Expected prompt expert footer to opt into a minimal variant');
});

test('prompt expert hero prompt area moves up by 30px on desktop', () => {
    const searchContainerRuleMatch = html.match(/\.search-container\s*\{[\s\S]*?\}/);

    assert.ok(searchContainerRuleMatch, 'Expected a search-container CSS rule');
    assert.match(
        searchContainerRuleMatch[0],
        /padding:\s*80px 0 28px;/,
        'Expected the prompt expert hero area to move up by 30px on desktop'
    );
});

test('prompt expert minimal footer is fixed to the viewport bottom', () => {
    const minimalFooterRuleMatch = html.match(/\.footer\.footer-minimal\s*\{[\s\S]*?\}/);

    assert.ok(minimalFooterRuleMatch, 'Expected a minimal footer CSS rule');

    const footerRule = minimalFooterRuleMatch[0];

    assert.match(footerRule, /position:\s*fixed;/, 'Expected the minimal footer to be fixed');
    assert.match(footerRule, /bottom:\s*0;/, 'Expected the minimal footer to sit at the viewport bottom');
    assert.match(footerRule, /left:\s*0;/, 'Expected the minimal footer to start from the left edge');
    assert.match(footerRule, /width:\s*100%;/, 'Expected the minimal footer to span the viewport width');
});

test('prompt expert logo moves down and prompt expert badge shifts left', () => {
    const logoRuleMatch = html.match(/\.logo-container\s*\{[\s\S]*?\}/);
    const promptRowRuleMatch = html.match(/\.prompt-icon-row\s*\{[\s\S]*?\}/);

    assert.ok(logoRuleMatch, 'Expected a logo-container CSS rule');
    assert.ok(promptRowRuleMatch, 'Expected a prompt-icon-row CSS rule');

    assert.match(logoRuleMatch[0], /top:\s*20px;/, 'Expected the prompt expert logo container to move down by 20px');
    assert.match(promptRowRuleMatch[0], /left:\s*-40px;/, 'Expected the prompt expert badge row to move left by 40px');
});

test('prompt expert stream loading state sets a clear wait-time expectation', () => {
    assert.match(
        indexScript,
        /AI 正在思考中，预计 1 分钟内生成，请稍候\.\.\./,
        'Expected the prompt expert compact loading state to explain the estimated generation time'
    );
});
