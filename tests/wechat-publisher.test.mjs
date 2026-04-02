import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    fetchAccessToken,
    publishDraft
} = require('../server/services/wechat-publisher.js');

test('fetchAccessToken returns token from wechat api response', async () => {
    const fetchCalls = [];
    const token = await fetchAccessToken({
        appId: 'id',
        appSecret: 'secret',
        fetchImpl: async (url) => {
            fetchCalls.push(url);
            return {
                ok: true,
                json: async () => ({ access_token: 'token-123' })
            };
        }
    });

    assert.equal(token, 'token-123');
    assert.equal(fetchCalls.length, 1);
});

test('publishDraft sends fixed title and thumb media id to draft add api', async () => {
    let requestBody = null;

    const result = await publishDraft({
        accessToken: 'token-123',
        article: {
            title: '04月02日AI资讯早报',
            author: 'AIcoming',
            digest: '摘要',
            content: '<p>日报版</p>',
            thumbMediaId: 'thumb-1'
        },
        fetchImpl: async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({ media_id: 'draft-1' })
            };
        }
    });

    assert.equal(result.media_id, 'draft-1');
    assert.equal(requestBody.articles[0].title, '04月02日AI资讯早报');
    assert.equal(requestBody.articles[0].thumb_media_id, 'thumb-1');
});
