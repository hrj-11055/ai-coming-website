import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    buildDailyNewspicContent,
    buildDailyNewspicImagePrompt
} = require('../server/services/wechat-content.js');

const CORE_ITEMS = [
    { title: 'Anthropic 提交 IPO', keyPoint: '企业级 AI 商业化得到验证。' },
    { title: '微信上线 AI 助手', keyPoint: '超级应用入口进一步开放。' },
    { title: 'Uber 收紧 AI 调用', keyPoint: '企业 AI 投入进入精算管理期。' }
];

test('newspic copy contains exactly three concise core items', () => {
    const content = buildDailyNewspicContent({
        date: '2026-06-04',
        coreItems: CORE_ITEMS
    });

    assert.equal(content.split('\n\n').length, 3);
    assert.match(content, /Anthropic 提交 IPO/);
    assert.match(content, /微信上线 AI 助手/);
    assert.match(content, /Uber 收紧 AI 调用/);
});

test('newspic image prompt uses the same three items as the primary display', () => {
    const prompt = buildDailyNewspicImagePrompt({
        date: '2026-06-04',
        coreItems: CORE_ITEMS
    });

    assert.match(prompt, /只展示以下 3 条核心信息/);
    assert.match(prompt, /Anthropic 提交 IPO/);
    assert.match(prompt, /微信上线 AI 助手/);
    assert.match(prompt, /Uber 收紧 AI 调用/);
    assert.doesNotMatch(prompt, /播客/);
});
