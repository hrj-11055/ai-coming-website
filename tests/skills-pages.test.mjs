import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const NAV_PAGES = ['index.html', 'news.html', 'tools.html', 'skills.html'];

function readProjectFile(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('all primary nav pages include the Agent Skills entry', () => {
    for (const page of NAV_PAGES) {
        const html = readProjectFile(page);
        assert.match(
            html,
            /<a href="skills\.html"[^>]*>\s*AI 能力库\s*<\/a>/,
            `Expected ${page} to link to skills.html in the primary navigation`
        );
    }
});

test('skills catalog exposes only the curated ten featured skills', async () => {
    const { SKILL_MODULES, ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    assert.deepEqual(
        SKILL_MODULES.map((module) => ({
            id: module.id,
            title: module.title,
            count: module.skills.length
        })),
        [
            { id: 'document-processing', title: '文档处理', count: 4 },
            { id: 'efficiency-tools', title: '效率工具', count: 2 },
            { id: 'research-content', title: '研究与内容', count: 3 },
            { id: 'mcp-starter', title: 'MCP 入门', count: 1 }
        ],
        'Expected the skills page to expose four curated groups'
    );

    assert.equal(ALL_SKILLS.length, 10, 'Expected only ten featured skills to remain online');

    for (const module of SKILL_MODULES) {
        for (const skill of module.skills) {
            assert.match(
                skill.detailUrl,
                /^skill-detail\.html\?slug=[a-z0-9-]+$/,
                `Expected ${skill.name} to point to the shared skill detail template`
            );
        }
    }
});

test('skills catalog keeps the requested featured skill order', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    assert.deepEqual(
        ALL_SKILLS.map((skill) => skill.slug),
        [
            'docx',
            'pptx',
            'pdf',
            'xlsx',
            'brainstorming',
            'search-first',
            'market-research',
            'content-engine',
            'douyin-video-downloader',
            'mcp-server-fetch'
        ],
        'Expected the curated skills to follow the requested order'
    );
});

test('featured skills expose user-facing Chinese names', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    assert.deepEqual(
        ALL_SKILLS.map((skill) => skill.name),
        [
            'Word 文档生成',
            'PPT 演示文稿生成',
            'PDF 文档生成',
            'Excel 表格生成',
            '深度头脑风暴',
            '先搜索再动手',
            '市场调研与竞品分析',
            '多平台内容改写',
            '抖音无水印视频下载',
            '网页内容抓取（MCP）'
        ],
        'Expected featured skill cards to use Chinese names that explain the skill purpose'
    );
});

test('featured skills expose install commands, prompt examples, and non-placeholder source links', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    for (const skill of ALL_SKILLS) {
        assert.ok(skill.installCommand, `Expected ${skill.name} to expose an install command`);
        assert.ok(skill.promptExample, `Expected ${skill.name} to expose a copy-friendly prompt example`);
        assert.ok(skill.sourceUrl, `Expected ${skill.name} to expose a source URL`);
        assert.notEqual(
            skill.sourceUrl,
            'https://ai.codefather.cn/skills',
            `Expected ${skill.name} to stop using the placeholder reference URL`
        );
    }
});

test('brainstorming and douyin featured skills include practical walkthrough media', async () => {
    const { getSkillBySlug } = await import('../frontend/modules/skills-catalog.js');

    const brainstorming = getSkillBySlug('brainstorming');
    const douyin = getSkillBySlug('douyin-video-downloader');

    assert.ok(brainstorming?.gallery?.length, 'Expected brainstorming to include at least one walkthrough image');
    assert.equal(
        brainstorming.gallery[0].src,
        '/pic/skills-guides/brainstorming-example.png',
        'Expected brainstorming to point at the copied walkthrough asset'
    );

    assert.ok(douyin?.gallery?.length, 'Expected douyin-video-downloader to include at least one walkthrough image');
    assert.equal(
        douyin.gallery[0].src,
        '/pic/skills-guides/douyin-video-downloader-example.png',
        'Expected douyin-video-downloader to point at the copied walkthrough asset'
    );
});

test('mcp-server-fetch now behaves like a shared skill detail page entry', async () => {
    const { getSkillBySlug } = await import('../frontend/modules/skills-catalog.js');
    const skill = getSkillBySlug('mcp-server-fetch');

    assert.ok(skill, 'Expected the mcp-server-fetch skill to exist');
    assert.equal(
        skill.detailUrl,
        'skill-detail.html?slug=mcp-server-fetch',
        'Expected mcp-server-fetch to use the shared skill detail template'
    );
    assert.equal(
        skill.installCommand,
        'claude mcp add search -- npx -y @modelcontextprotocol/server-fetch',
        'Expected mcp-server-fetch to expose the tested Claude MCP install command'
    );
});

test('skills page hero copy reflects the curated newcomer-friendly positioning', () => {
    const html = readProjectFile('skills.html');

    assert.match(html, /10 个真正跑通过的 Skill/, 'Expected the curated hero headline');
    assert.match(html, /精选实测/, 'Expected the new curated hero kicker');
    assert.match(html, /AI 能力库/, 'Expected the page to preserve the AI 能力库 name');
});

test('skills page keeps the left navigation scrollable when groups exceed the viewport', () => {
    const html = readProjectFile('skills.html');

    assert.match(
        html,
        /\.skills-sidebar\s*\{[\s\S]*max-height:\s*calc\(100vh - var\(--skills-nav-height\) - 28px\);[\s\S]*overflow:\s*hidden;/,
        'Expected the skills sidebar to constrain its height on desktop'
    );

    assert.match(
        html,
        /\.skills-nav-list\s*\{[\s\S]*overflow-y:\s*auto;/,
        'Expected the skills nav list to scroll vertically when it overflows'
    );
});

test('skill detail page includes a copy button for install commands and prompt examples', () => {
    const html = readProjectFile('skill-detail.html');
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.match(html, /detail-copy-btn/, 'Expected detail page styles for the copy button');
    assert.match(
        script,
        /class="detail-copy-btn"/,
        'Expected the detail page renderer to output a copy button'
    );
    assert.match(
        script,
        /直接复制的提示词/,
        'Expected the detail page renderer to include the prompt-copy panel'
    );
});

test('skill detail page renders newcomer-focused sections and gallery support', () => {
    const html = readProjectFile('skill-detail.html');
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.match(html, /\.detail-starter-note\s*\{/, 'Expected newcomer note styling on the detail page');
    assert.match(html, /\.detail-gallery-grid\s*\{/, 'Expected gallery styling on the detail page');
    assert.match(script, /<h2>使用前准备<\/h2>/, 'Expected the detail renderer to include the preparation section');
    assert.match(script, /<h2>运行后你会看到什么<\/h2>/, 'Expected the detail renderer to include the result section');
    assert.match(script, /<h2>实操截图<\/h2>/, 'Expected the detail renderer to include the walkthrough gallery section');
});

test('skill detail page no longer renders the old hero action links', () => {
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.doesNotMatch(script, /查看使用说明/, 'Expected the detail page renderer to remove the old usage CTA');
    assert.doesNotMatch(script, /参考来源/, 'Expected the detail page renderer to remove the old source CTA');
});

test('skill detail page provides the shared slug-driven shell', () => {
    const html = readProjectFile('skill-detail.html');

    assert.match(html, /id="skillDetailPage"/, 'Expected the skill detail page root container');
    assert.match(html, /id="skillDetailContent"/, 'Expected a dedicated detail content mount point');
    assert.match(
        html,
        /src="frontend\/skill-detail-page\.js"/,
        'Expected the shared detail page script to be loaded'
    );
});

test('skill detail page renders an upstream repository entry when sourceUrl exists', () => {
    const html = readProjectFile('skill-detail.html');
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.match(html, /\.detail-source-btn\s*\{/, 'Expected the skill detail page to style the upstream repository button');
    assert.match(script, /<h2>上游仓库<\/h2>/, 'Expected the skill detail renderer to include an upstream repository panel');
    assert.match(script, /查看 GitHub 仓库/, 'Expected the skill detail renderer to expose a GitHub repository link label');
    assert.match(script, /class="detail-source-btn"/, 'Expected the skill detail renderer to output a source button class');
});

test('mcp detail page still provides the shared slug-driven shell for legacy links', () => {
    const html = readProjectFile('mcp-detail.html');
    const script = readProjectFile('frontend/mcp-detail-page.js');

    assert.match(html, /id="mcpDetailPage"/, 'Expected the MCP detail page root container');
    assert.match(html, /id="mcpDetailContent"/, 'Expected a dedicated MCP detail content mount point');
    assert.match(
        html,
        /src="frontend\/mcp-detail-page\.js"/,
        'Expected the shared MCP detail page script to be loaded'
    );
    assert.match(script, /class="detail-copy-btn"/, 'Expected the MCP detail renderer to output a copy button');
});
