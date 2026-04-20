import test from 'node:test';
import assert from 'node:assert/strict';

const {
    buildInteractionPayload,
    getPrimaryNavLabel
} = await import('../frontend/modules/interaction-tracker.js');

test('getPrimaryNavLabel maps primary html pages to user-facing labels', () => {
    assert.equal(getPrimaryNavLabel('index.html'), '首页');
    assert.equal(getPrimaryNavLabel('/news.html'), 'AI资讯');
    assert.equal(getPrimaryNavLabel('tools.html'), 'AI工具集');
    assert.equal(getPrimaryNavLabel('/skills.html?from=nav'), 'AI 能力库');
    assert.equal(getPrimaryNavLabel('/about.html'), '关于我们');
    assert.equal(getPrimaryNavLabel('/admin-login.html'), '');
});

test('buildInteractionPayload normalizes event payload with current page context', () => {
    const payload = buildInteractionPayload({
        eventType: 'podcast_play',
        eventLabel: '今日播客',
        target: '2026-04-20',
        locationLike: {
            pathname: '/news.html',
            search: '?tab=today'
        },
        documentLike: {
            referrer: 'https://example.com/',
            title: 'AI资讯'
        }
    });

    assert.deepEqual(payload, {
        eventType: 'podcast_play',
        eventLabel: '今日播客',
        target: '2026-04-20',
        pagePath: '/news.html?tab=today',
        referrer: 'https://example.com/',
        pageTitle: 'AI资讯'
    });
});
