import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createWechatPublisher,
    fetchAccessToken,
    publishDraft,
    publishPreviewVoice,
    publishSendAllVoice,
    uploadVoice
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

test('uploadVoice uploads voice media through temporary media api', async () => {
    const calls = [];
    const result = await uploadVoice({
        accessToken: 'token-123',
        fileName: 'podcast.mp3',
        fileBuffer: Buffer.from('fake-mp3'),
        fetchImpl: async (url, options) => {
            calls.push({ url, headers: options.headers, body: options.body });
            return {
                ok: true,
                json: async () => ({ media_id: 'voice-1' })
            };
        }
    });

    assert.equal(result.media_id, 'voice-1');
    assert.match(calls[0].url, /cgi-bin\/media\/upload\?access_token=token-123&type=voice/);
    assert.match(calls[0].headers['Content-Type'], /multipart\/form-data; boundary=/);
});

test('publishSendAllVoice sends voice message to all followers by default', async () => {
    let requestBody = null;

    const result = await publishSendAllVoice({
        accessToken: 'token-123',
        mediaId: 'voice-1',
        fetchImpl: async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({ msg_id: 1001 })
            };
        }
    });

    assert.equal(result.msg_id, 1001);
    assert.deepEqual(requestBody.filter, { is_to_all: true });
    assert.equal(requestBody.msgtype, 'voice');
    assert.equal(requestBody.voice.media_id, 'voice-1');
});

test('publishPreviewVoice sends voice preview to configured openid', async () => {
    let requestBody = null;

    const result = await publishPreviewVoice({
        accessToken: 'token-123',
        mediaId: 'voice-1',
        openId: 'openid-123',
        fetchImpl: async (_url, options) => {
            requestBody = JSON.parse(options.body);
            return {
                ok: true,
                json: async () => ({ msg_id: 1002 })
            };
        }
    });

    assert.equal(result.msg_id, 1002);
    assert.equal(requestBody.touser, 'openid-123');
    assert.equal(requestBody.msgtype, 'voice');
    assert.equal(requestBody.voice.media_id, 'voice-1');
});

test('createWechatPublisher publishPodcastAudio uploads voice and sendall by default', async () => {
    const fetchCalls = [];
    const publisher = createWechatPublisher({
        appId: 'id',
        appSecret: 'secret',
        audioSendMode: 'sendall',
        fetchImpl: async (url, options = {}) => {
            fetchCalls.push({ url, options });

            if (url.includes('/cgi-bin/token')) {
                return {
                    ok: true,
                    json: async () => ({ access_token: 'token-123' })
                };
            }

            if (url.includes('/cgi-bin/media/upload')) {
                return {
                    ok: true,
                    json: async () => ({ media_id: 'voice-1' })
                };
            }

            if (url.includes('/cgi-bin/message/mass/sendall')) {
                return {
                    ok: true,
                    json: async () => ({ msg_id: 1003 })
                };
            }

            throw new Error(`unexpected url: ${url}`);
        }
    });

    const result = await publisher.publishPodcastAudio({
        audioPath: '/tmp/fake.mp3',
        audioBuffer: Buffer.from('fake-mp3'),
        fileName: 'podcast.mp3'
    });

    assert.equal(result.msg_id, 1003);
    assert.equal(result.voice_media_id, 'voice-1');
    assert.equal(result.delivery_mode, 'sendall');
    assert.equal(fetchCalls.length, 3);
});

test('uploadNewsImage 上传图片 Buffer 到微信并返回 URL', async () => {
    const { uploadNewsImage } = require('../server/services/wechat-publisher.js');
    const calls = [];
    const fakeBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);  // PNG magic bytes

    const result = await uploadNewsImage({
        accessToken: 'fake-token',
        imageBuffer: fakeBuffer,
        fetchImpl: async (url, opts) => {
            calls.push({ url, contentType: opts.headers['Content-Type'] });
            return new Response(JSON.stringify({ url: 'https://mmbiz.qpic.cn/test.png' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    });

    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /uploadimg/);
    assert.match(calls[0].url, /fake-token/);
    assert.match(calls[0].contentType, /multipart\/form-data/);
    assert.equal(result, 'https://mmbiz.qpic.cn/test.png');
});

test('uploadNewsImage 在微信返回 errcode 时抛出', async () => {
    const { uploadNewsImage } = require('../server/services/wechat-publisher.js');
    await assert.rejects(
        () => uploadNewsImage({
            accessToken: 'tok',
            imageBuffer: Buffer.from('x'),
            fetchImpl: async () => new Response(JSON.stringify({ errcode: 40001, errmsg: 'invalid credential' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        }),
        /invalid credential/
    );
});

test('uploadNewsImage rejects images over the WeChat 1MB content limit before upload', async () => {
    const { uploadNewsImage } = require('../server/services/wechat-publisher.js');
    await assert.rejects(
        () => uploadNewsImage({
            accessToken: 'tok',
            imageBuffer: Buffer.alloc((1024 * 1024) + 1),
            fetchImpl: async () => {
                throw new Error('should not upload oversized image');
            }
        }),
        /1MB/
    );
});
