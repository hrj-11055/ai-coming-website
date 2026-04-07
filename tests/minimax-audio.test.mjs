import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createMinimaxAudioClient
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
    assert.equal(result.fileName, 'podcast-output.tar');
    assert.equal(String(result.audioBuffer), 'ID3fake-audio-buffer');
});
