import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const NAV_PAGES = ['index.html', 'news.html', 'tools.html', 'skills.html'];

function readProjectFile(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('all primary nav pages include the AI capability library entry', () => {
    for (const page of NAV_PAGES) {
        const html = readProjectFile(page);
        assert.match(
            html,
            /<a href="skills\.html"[^>]*>\s*AI 能力库\s*<\/a>/,
            `Expected ${page} to link to skills.html in the primary navigation`
        );
    }
});

test('skills catalog exposes the curated featured skill and MCP groups', async () => {
    const { SKILL_MODULES, ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    assert.deepEqual(
        SKILL_MODULES.map((module) => ({
            id: module.id,
            title: module.title,
            count: module.skills.length
        })),
        [
            { id: 'ai-coding-assistant', title: '最强AI工具', count: 1 },
            { id: 'document-processing', title: '文档处理', count: 5 },
            { id: 'efficiency-tools', title: '效率工具', count: 3 },
            { id: 'research-content', title: '研究与内容', count: 3 },
            { id: 'mcp-starter', title: 'MCP 入门', count: 5 }
        ],
        'Expected the skills page to expose five curated groups'
    );

    assert.equal(ALL_SKILLS.length, 19, 'Expected nineteen curated entries to remain online');

    for (const module of SKILL_MODULES) {
        for (const skill of module.skills) {
            if (skill.detailType === 'mcp') {
                assert.match(
                    skill.detailUrl,
                    /^mcp-detail\.html\?slug=[a-z0-9-]+$/,
                    `Expected ${skill.name} to point to the shared MCP detail template`
                );
            } else {
                assert.match(
                    skill.detailUrl,
                    /^skill-detail\.html\?slug=[a-z0-9-]+$/,
                    `Expected ${skill.name} to point to the shared skill detail template`
                );
            }
        }
    }
});

test('skills catalog keeps the requested featured skill order', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    assert.deepEqual(
        ALL_SKILLS.map((skill) => skill.slug),
        [
            'claude-code-config',
            'docx',
            'pptx',
            'powerpoint',
            'pdf',
            'xlsx',
            'brainstorming',
            'search-first',
            'creator-skill',
            'market-research',
            'content-engine',
            'douyin-video-downloader',
            'filesystem-mcp',
            'pdf-reader-mcp',
            'playwright-mcp',
            'mermaid-mcp',
            'free-web-search-mcp',
            'superpowers-guide',
            'everything-claude-code-guide'
        ],
        'Expected the curated skills to follow the requested order'
    );
});

test('featured skills expose user-facing Chinese names', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    assert.deepEqual(
        ALL_SKILLS.map((skill) => skill.name),
        [
            'Claude Code + MiniMax 安装配置',
            'Word 文档生成',
            'PPT 演示文稿生成',
            'PowerPoint 读取与改稿',
            'PDF 文档生成',
            'Excel 表格生成',
            '深度头脑风暴',
            '先搜索再动手',
            'Skill 创建助手',
            '市场调研与竞品分析',
            '多平台内容改写',
            '抖音无水印视频下载',
            '文件系统操作（MCP）',
            'PDF 文档解析（MCP）',
            '网页自动化（MCP）',
            '流程图生成（MCP）',
            'Tavily 实时网络搜索（MCP）',
            'Superpowers 星级推荐',
            'Everything Claude Code 星级推荐'
        ],
        'Expected featured skill cards to use Chinese names that explain the skill purpose'
    );
});

test('featured skills expose install commands, prompt examples, and non-placeholder source links', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    for (const skill of ALL_SKILLS) {
        assert.ok(skill.installCommand, `Expected ${skill.name} to expose an install command`);
        assert.ok(skill.sourceUrl, `Expected ${skill.name} to expose a source URL`);
        assert.notEqual(
            skill.sourceUrl,
            'https://ai.codefather.cn/skills',
            `Expected ${skill.name} to stop using the placeholder reference URL`
        );

        if (skill.promptExample) {
            assert.ok(skill.promptExample, `Expected ${skill.name} to expose a copy-friendly prompt example`);
        } else {
            assert.ok(
                skill.guideHighlights?.length || skill.featuredSkills?.length,
                `Expected ${skill.name} without a prompt example to expose guide content instead`
            );
        }
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

test('claude code configuration tutorial is a markdown-style MiniMax Windows guide', async () => {
    const { getSkillBySlug } = await import('../frontend/modules/skills-catalog.js');
    const skill = getSkillBySlug('claude-code-config');

    assert.ok(skill, 'Expected the Claude Code configuration tutorial entry to exist');
    assert.equal(skill?.moduleTitle, '最强AI工具');
    assert.equal(skill?.detailLayout, 'markdown');
    assert.match(skill?.installCommand || '', /npm install -g @anthropic-ai\/claude-code/);
    assert.match(skill?.installCommand || '', /registry\.npmmirror\.com/);
    assert.match(skill?.installCommand || '', /claude --version/);
    assert.ok(skill?.markdownSections?.length >= 8, 'Expected the tutorial to render a document-style walkthrough');
    assert.match(JSON.stringify(skill), /MiniMax/);
    assert.match(JSON.stringify(skill), /API Key/);
    assert.match(JSON.stringify(skill), /CC-Switch/);
    assert.doesNotMatch(JSON.stringify(skill), /NewAPI|New API/i);
    assert.ok(
        skill?.markdownSections?.some((section) => section.image?.src?.includes('minimax-api-key')),
        'Expected the guide to include the MiniMax API Key screenshot'
    );
    assert.ok(
        skill?.markdownSections?.some((section) => section.images?.length >= 16),
        'Expected the guide to include the Git installation image grid'
    );
});

test('featured MCP entries point to the shared MCP detail template', async () => {
    const { getSkillBySlug, getMcpBySlug } = await import('../frontend/modules/skills-catalog.js');
    const skill = getSkillBySlug('filesystem-mcp');
    const mcp = getMcpBySlug('filesystem-mcp');

    assert.ok(skill, 'Expected the filesystem-mcp entry to exist');
    assert.ok(mcp, 'Expected filesystem-mcp to be retrievable as an MCP entry');
    assert.equal(
        skill.detailUrl,
        'mcp-detail.html?slug=filesystem-mcp',
        'Expected filesystem-mcp to use the shared MCP detail template'
    );
    assert.equal(
        skill.installCommand,
        `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/ABSOLUTE/PATH/TO/WORKSPACE"]
    }
  }
}`,
        'Expected filesystem-mcp to expose the tested MCP config template'
    );
});

test('skills page hero copy reflects the curated newcomer-friendly positioning', () => {
    const html = readProjectFile('skills.html');

    assert.match(html, /一次安装，长期复用/, 'Expected the current curated hero headline');
    assert.match(html, /精选经过验证的 AI 能力入口/, 'Expected the current curated hero copy');
    assert.match(html, /AI 能力库/, 'Expected the page to preserve the AI 能力库 name');
});

test('skills page hero uses valid class attributes for styled typography', () => {
    const html = readProjectFile('skills.html');

    assert.doesNotMatch(html, /[\u201c\u201d]/, 'Expected skills.html to avoid curly quotes that break class attributes');
    assert.match(html, /<section class="skills-hero">/, 'Expected the skills hero section class to be valid HTML');
    assert.match(html, /<div class="skills-hero-metrics">/, 'Expected the hero metrics class to be valid HTML');
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

test('skill detail page renders a source repository entry when sourceUrl exists', () => {
    const html = readProjectFile('skill-detail.html');
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.match(html, /\.detail-source-btn\s*\{/, 'Expected the skill detail page to style the upstream repository button');
    assert.match(script, /sourceIsGithub \? '源码仓库' : '来源页面'/, 'Expected the skill detail renderer to label GitHub and non-GitHub sources clearly');
    assert.match(script, /查看 GitHub 仓库/, 'Expected the skill detail renderer to expose a GitHub repository link label');
    assert.match(script, /class="detail-source-btn"/, 'Expected the skill detail renderer to output a source button class');
});

test('skill detail page supports a markdown document layout for tutorial entries', () => {
    const html = readProjectFile('skill-detail.html');
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.match(html, /\.markdown-guide-article\s*\{/, 'Expected markdown guide article styles');
    assert.match(html, /\.markdown-guide-article h2\s*\{/, 'Expected markdown heading styles');
    assert.match(script, /function renderMarkdownGuideDetail/, 'Expected a markdown detail renderer');
    assert.match(script, /skill\.detailLayout === 'markdown'/, 'Expected detail layout switch');
    assert.match(script, /markdown-guide-code/, 'Expected markdown code block copy support');
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
    assert.match(script, /第一次可以直接复制的测试提示词/, 'Expected the MCP detail renderer to include the prompt-copy panel');
    assert.match(script, /<h2>使用前准备<\/h2>/, 'Expected the MCP detail renderer to include the preparation section');
    assert.match(script, /<h2>运行后你会看到什么<\/h2>/, 'Expected the MCP detail renderer to include the result section');
});
