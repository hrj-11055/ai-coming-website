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
    { title: 'Uber 收紧 AI 调用', keyPoint: '企业 AI 投入进入精算管理期。' },
    { title: '谷歌发布新一代 TPU', keyPoint: '算力基础设施竞争升温。' },
    { title: 'OpenAI 发布企业 Agent', keyPoint: '复杂流程自动化继续加速。' },
    { title: 'MiniMax 启动 IPO', keyPoint: '国产大模型商业化窗口打开。' },
    { title: '微软发布推理模型', keyPoint: '办公场景推理能力继续增强。' },
    { title: '苹果扩展端侧 AI', keyPoint: '隐私计算成为产品卖点。' },
    { title: '英伟达开源世界模型', keyPoint: '物理 AI 训练效率提升。' },
    { title: 'Meta 调整 AI 组织', keyPoint: '基础模型团队进入重组期。' },
    { title: '第十一条不应出现', keyPoint: '这条不应进入正文或图片。' }
];

test('newspic copy contains exactly ten concise core items', () => {
    const content = buildDailyNewspicContent({
        date: '2026-06-04',
        coreItems: CORE_ITEMS
    });

    assert.equal(content.split('\n\n').length, 10);
    assert.match(content, /Anthropic 提交 IPO/);
    assert.match(content, /Meta 调整 AI 组织/);
    assert.doesNotMatch(content, /第十一条不应出现/);
});

test('newspic image prompt uses the same ten items as the primary display', () => {
    const prompt = buildDailyNewspicImagePrompt({
        date: '2026-06-04',
        coreItems: CORE_ITEMS
    });

    assert.match(prompt, /小元说 AI日报/);
    assert.match(prompt, /只展示以下 10 条核心信息/);
    assert.match(prompt, /方形 1:1/);
    assert.match(prompt, /Anthropic 提交 IPO/);
    assert.match(prompt, /Meta 调整 AI 组织/);
    assert.doesNotMatch(prompt, /第十一条不应出现/);
    assert.doesNotMatch(prompt, /播客/);
});
