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

test('skills catalog defines the requested modules and keeps MCP at the bottom', async () => {
    const { SKILL_MODULES } = await import('../frontend/modules/skills-catalog.js');

    assert.equal(SKILL_MODULES.length, 9, 'Expected nine modules after adding MCP');

    const expectedTitles = [
        'Claude官方',
        '文档处理',
        '效率工具',
        '内容与媒体',
        '数据与分析',
        '商业与营销',
        '软件开发',
        '开发运维',
        'MCP'
    ];

    assert.deepEqual(
        SKILL_MODULES.map((module) => module.title),
        expectedTitles,
        'Expected skill modules to keep the requested order'
    );

    for (const module of SKILL_MODULES) {
        if (module.id === 'mcp') {
            assert.equal(module.skills.length, 15, 'Expected MCP to expose the requested fifteen entries');
            for (const skill of module.skills) {
                assert.match(
                    skill.detailUrl,
                    /^mcp-detail\.html\?slug=[a-z0-9-]+$/,
                    `Expected ${skill.name} to point to the MCP detail template`
                );
            }
            continue;
        }

        assert.equal(module.skills.length, 6, `Expected ${module.title} to expose six skills`);
        for (const skill of module.skills) {
            assert.match(
                skill.detailUrl,
                /^skill-detail\.html\?slug=[a-z0-9-]+$/,
                `Expected ${skill.name} to point to the shared detail template`
            );
        }
    }
});

test('claude official module uses six official Anthropic skills without doc duplicates', async () => {
    const { getModuleById } = await import('../frontend/modules/skills-catalog.js');
    const module = getModuleById('claude-official');

    assert.ok(module, 'Expected the claude-official module to exist');
    assert.deepEqual(
        module.skills.map((skill) => skill.slug),
        [
            'claude-api',
            'frontend-design',
            'mcp-builder',
            'skill-creator',
            'webapp-testing',
            'web-artifacts-builder'
        ],
        'Expected Claude官方 to use the selected official Anthropic skills'
    );

    for (const skill of module.skills) {
        assert.match(
            skill.sourceUrl || '',
            /^https:\/\/github\.com\/anthropics\/skills\/tree\/main\/skills\//,
            `Expected ${skill.name} to point back to the official Anthropic skills repo`
        );
    }
});

test('pptx skill exposes install guidance and skills markdown context', async () => {
    const { getSkillBySlug } = await import('../frontend/modules/skills-catalog.js');
    const skill = getSkillBySlug('pptx');

    assert.ok(skill, 'Expected the pptx skill to exist');
    assert.match(skill.installCommand || '', /^npx add-skill /, 'Expected pptx to expose an install command');
    assert.match(skill.skillDocPurpose || '', /Skills\.md|SKILL\.md/, 'Expected pptx to explain Skills markdown purpose');
});

test('document processing skills all expose install guidance and skills markdown context', async () => {
    const { getModuleById } = await import('../frontend/modules/skills-catalog.js');
    const module = getModuleById('document-processing');

    assert.ok(module, 'Expected the document-processing module to exist');
    assert.equal(module.skills.length, 6, 'Expected six document-processing skills');

    for (const skill of module.skills) {
        assert.ok(skill.installCommand, `Expected ${skill.name} to expose an install command`);
        assert.match(
            skill.skillDocPurpose || '',
            /Skills\.md|SKILL\.md/,
            `Expected ${skill.name} to explain Skills.md purpose`
        );
    }
});

test('non-MCP skills expose npm or npx installation commands and upstream source URLs', async () => {
    const { ALL_SKILLS } = await import('../frontend/modules/skills-catalog.js');

    const skills = ALL_SKILLS.filter((skill) => skill.detailType !== 'mcp');

    for (const skill of skills) {
        assert.match(
            skill.installCommand || '',
            /^(npx|npm)\b/,
            `Expected ${skill.name} to expose an npm/npx-first installation command`
        );
        assert.notEqual(
            skill.sourceUrl,
            'https://ai.codefather.cn/skills',
            `Expected ${skill.name} to point to an upstream repository instead of the placeholder source`
        );
    }
});

test('mcp module exposes the requested entries with configuration guidance', async () => {
    const { getModuleById } = await import('../frontend/modules/skills-catalog.js');
    const module = getModuleById('mcp');

    assert.ok(module, 'Expected the MCP module to exist');
    assert.deepEqual(
        module.skills.map((skill) => skill.name),
        [
            'GitHub MCP Server',
            'Git MCP',
            'Playwright MCP Server',
            'Browserbase MCP',
            'Firecrawl MCP',
            'Fetch MCP Server',
            'Free Web Search Ultimate',
            'Notion MCP',
            'Mem0 MCP',
            'Desktop Commander MCP',
            'Jupyter Notebook MCP',
            'Anyquery MCP',
            'Semgrep MCP',
            'Sequential Thinking MCP',
            'Apify Actors MCP Server'
        ],
        'Expected MCP cards to follow the requested order'
    );

    for (const skill of module.skills) {
        assert.ok(skill.installCommand, `Expected ${skill.name} to expose an MCP config snippet`);
        assert.ok(skill.mcpConfigPurpose, `Expected ${skill.name} to explain what the MCP config does`);
    }
});

test('claude official and MCP modules expose valid sidebar icons', async () => {
    const { getModuleById } = await import('../frontend/modules/skills-catalog.js');
    const script = readProjectFile('frontend/skills-page.js');

    for (const moduleId of ['claude-official', 'mcp']) {
        const module = getModuleById(moduleId);
        assert.ok(module, `Expected ${moduleId} module to exist`);
        assert.match(
            module.icon || '',
            /^fa-/,
            `Expected ${moduleId} to expose a fontawesome icon class`
        );
    }

    assert.match(
        script,
        /skill-nav-icon/,
        'Expected the skills page renderer to output sidebar icon markup'
    );
});

test('skill detail page includes a copy button for install commands', () => {
    const html = readProjectFile('skill-detail.html');
    const script = readProjectFile('frontend/skill-detail-page.js');

    assert.match(html, /detail-copy-btn/, 'Expected detail page styles for the copy button');
    assert.match(
        script,
        /class="detail-copy-btn"/,
        'Expected the detail page renderer to output a copy button'
    );
});

test('skills page keeps the left navigation scrollable when modules exceed the viewport', () => {
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

test('skills page sidebar removes aggregate stats and per-module item counts', () => {
    const html = readProjectFile('skills.html');
    const script = readProjectFile('frontend/skills-page.js');

    assert.doesNotMatch(
        html,
        /skills-sidebar-stats|skillsModuleCount|skillsItemCount/,
        'Expected the sidebar aggregate stats block to be removed from the skills page shell'
    );

    assert.doesNotMatch(
        script,
        /module\.skills\.length|renderStats|个\s*\$\{itemLabel\}/,
        'Expected the sidebar renderer to stop outputting per-module counts and aggregate stat updates'
    );
});

test('skills page removes redundant sidebar intro copy and duplicate section kickers', () => {
    const html = readProjectFile('skills.html');
    const script = readProjectFile('frontend/skills-page.js');

    assert.doesNotMatch(
        html,
        /Skill Directory|按模块集中浏览高频实用的 Skill 与 MCP/,
        'Expected the skills sidebar intro eyebrow and helper copy to be removed'
    );

    assert.doesNotMatch(
        html,
        /\.skill-section-kicker\s*\{/,
        'Expected the duplicate section kicker styles to be removed from the skills page'
    );

    assert.doesNotMatch(
        script,
        /skill-section-kicker/,
        'Expected the section renderer to stop outputting duplicate module kickers'
    );
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

test('mcp detail page provides the shared slug-driven shell', () => {
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
    assert.match(html, /\.detail-source-btn\s*\{/, 'Expected the MCP detail page to style the repository button');
    assert.match(script, /class="detail-source-btn"/, 'Expected the MCP detail renderer to output a source button class');
});
