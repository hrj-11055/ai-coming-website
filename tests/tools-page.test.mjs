import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readProjectFile(relativePath) {
    return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('tools page styles support both font icons and custom SVG category icons', () => {
    const html = readProjectFile('tools.html');

    assert.match(
        html,
        /\.category-link \.category-icon\s*\{/,
        'Expected the tools page to define a shared category icon wrapper'
    );
    assert.match(
        html,
        /\.category-link \.category-icon svg\s*\{/,
        'Expected the tools page to size SVG category icons explicitly'
    );
});

test('AI collaboration category uses a custom inline SVG icon', () => {
    const script = readProjectFile('frontend/tools-page.js');

    assert.match(script, /const AI_COLLAB_ICON = `[\s\S]*<svg/, 'Expected a dedicated AI collaboration SVG icon');
    assert.match(script, /sectionId === 'ai-collab'/, 'Expected the AI collaboration category to render the custom icon');
    assert.match(script, /<span class="category-icon">\$\{AI_COLLAB_ICON\}<\/span>/, 'Expected the custom icon to use the shared category icon wrapper');
});
