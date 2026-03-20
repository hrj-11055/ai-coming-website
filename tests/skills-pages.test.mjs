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
            /<a href="skills\.html"[^>]*>\s*Agent Skills\s*<\/a>/,
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
            assert.equal(module.skills.length, 9, 'Expected MCP to expose the requested nine entries');
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

test('mcp module exposes the requested entries with configuration guidance', async () => {
    const { getModuleById } = await import('../frontend/modules/skills-catalog.js');
    const module = getModuleById('mcp');

    assert.ok(module, 'Expected the MCP module to exist');
    assert.deepEqual(
        module.skills.map((skill) => skill.name),
        [
            'GitHub MCP Server',
            'Context7',
            'cdm（Chrome DevTools MCP）',
            'Playwright MCP Server',
            'Notion MCP',
            'Claudesidian',
            'n8n MCP',
            '高德地图 MCP',
            'MiniMax MCP'
        ],
        'Expected MCP cards to follow the requested order'
    );

    for (const skill of module.skills) {
        assert.ok(skill.installCommand, `Expected ${skill.name} to expose an MCP config snippet`);
        assert.ok(skill.mcpConfigPurpose, `Expected ${skill.name} to explain what the MCP config does`);
    }
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
});
