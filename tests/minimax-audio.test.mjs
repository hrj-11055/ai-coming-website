import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createMinimaxAudioClient,
    createMinimaxTtsClient
} = require('../server/services/minimax-audio.js');

test('createMinimaxAudioClient downloads audio buffer from minimax file id', async () => {
    const calls = [];
    const client = createMinimaxAudioClient({
        apiKey: 'tts-key',
        fileMetadataApiUrl: 'https://tts.example.com/v1/files/retrieve',
        fetchImpl: async (url) => {
            calls.push(url);

            if (url === 'https://tts.example.com/v1/files/retrieve?file_id=998') {
                return new Response(JSON.stringify({
                    file: {
                        file_id: 998,
                        filename: 'podcast-output.tar',
                        download_url: 'https://download.example.com/podcast-output.tar'
                    },
                    base_resp: {
                        status_code: 0,
                        status_msg: 'success'
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (url === 'https://download.example.com/podcast-output.tar') {
                return new Response(Buffer.from('ID3fake-audio-buffer'), {
                    status: 200,
                    headers: { 'Content-Type': 'audio/mpeg' }
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        }
    });

    const result = await client.downloadAudioBufferFromFileId(998);

    assert.deepEqual(calls, [
        'https://tts.example.com/v1/files/retrieve?file_id=998',
        'https://download.example.com/podcast-output.tar'
    ]);
    assert.equal(result.fileName, 'podcast-output.mp3');
    assert.equal(String(result.audioBuffer), 'ID3fake-audio-buffer');
});

test('createMinimaxTtsClient synthesizes short text and downloads audio buffer', async () => {
    const calls = [];
    const client = createMinimaxTtsClient({
        apiKey: 'tts-key',
        apiUrl: 'https://tts.example.com/v1/t2a_async_v2',
        queryApiUrl: 'https://tts.example.com/v1/query/t2a_async_query_v2',
        fileMetadataApiUrl: 'https://tts.example.com/v1/files/retrieve',
        fetchImpl: async (url, options = {}) => {
            calls.push(url);

            if (url === 'https://tts.example.com/v1/t2a_async_v2') {
                const body = JSON.parse(options.body || '{}');
                assert.match(body.text, /更多内容请看公众号文章/);
                return new Response(JSON.stringify({
                    task_id: 'task-123',
                    file_id: 998,
                    base_resp: {
                        status_code: 0,
                        status_msg: 'success'
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (url === 'https://tts.example.com/v1/query/t2a_async_query_v2?task_id=task-123') {
                return new Response(JSON.stringify({
                    task_id: 'task-123',
                    status: 'Success',
                    file_id: 998,
                    base_resp: {
                        status_code: 0,
                        status_msg: 'success'
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (url === 'https://tts.example.com/v1/files/retrieve?file_id=998') {
                return new Response(JSON.stringify({
                    file: {
                        file_id: 998,
                        filename: 'short-podcast.tar',
                        download_url: 'https://download.example.com/short-podcast.tar'
                    },
                    base_resp: {
                        status_code: 0,
                        status_msg: 'success'
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (url === 'https://download.example.com/short-podcast.tar') {
                return new Response(Buffer.from('ID3short-audio-buffer'), {
                    status: 200,
                    headers: { 'Content-Type': 'audio/mpeg' }
                });
            }

            throw new Error(`Unexpected fetch: ${url}`);
        }
    });

    const result = await client.synthesizeTextToAudioBuffer('这是短版播客。更多内容请看公众号文章。');

    assert.equal(result.taskId, 'task-123');
    assert.equal(result.fileId, 998);
    assert.equal(result.fileName, 'short-podcast.mp3');
    assert.equal(String(result.audioBuffer), 'ID3short-audio-buffer');
});
