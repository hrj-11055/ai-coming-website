import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createPodcastRouter } = require('../server/routes/podcast.js');

function invokeRouter(router, method, url) {
    return new Promise((resolve, reject) => {
        const req = {
            method,
            url,
            originalUrl: url,
            headers: {},
            app: {},
            baseUrl: '',
            path: url,
            query: {}
        };

        const res = {
            statusCode: 200,
            headers: {},
            locals: {},
            status(code) {
                this.statusCode = code;
                return this;
            },
            setHeader(name, value) {
                this.headers[name] = value;
            },
            type(value) {
                this.headers['content-type'] = value;
                return this;
            },
            json(body) {
                resolve({ statusCode: this.statusCode, body });
                return this;
            },
            sendFile() {
                reject(new Error('sendFile should not be called in this test'));
            }
        };

        router.handle(req, res, (error) => {
            if (error) {
                reject(error);
                return;
            }

            reject(new Error(`Route not handled: ${method} ${url}`));
        });
    });
}

test('podcast minimax task route returns normalized task status', async () => {
    const router = createPodcastRouter({
        podcastService: {
            async queryMinimaxTaskStatus(taskId) {
                assert.equal(taskId, 'task-123');
                return {
                    task_id: 'task-123',
                    status: 'Success',
                    file_id: 998,
                    duration_seconds: 61,
                    is_complete: true,
                    is_failed: false
                };
            },
            getCurrentMetadata() {
                throw new Error('not used');
            },
            getAudioFileForDate() {
                throw new Error('not used');
            },
            generateNewsPodcast() {
                throw new Error('not used');
            }
        }
    });

    const response = await invokeRouter(router, 'GET', '/podcast/minimax/tasks/task-123');
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, {
        task_id: 'task-123',
        status: 'Success',
        file_id: 998,
        duration_seconds: 61,
        is_complete: true,
        is_failed: false
    });
});

test('podcast minimax task route surfaces service errors as json', async () => {
    const router = createPodcastRouter({
        podcastService: {
            async queryMinimaxTaskStatus() {
                throw new Error('MiniMax 异步 TTS 查询能力尚未配置完成');
            },
            getCurrentMetadata() {
                throw new Error('not used');
            },
            getAudioFileForDate() {
                throw new Error('not used');
            },
            generateNewsPodcast() {
                throw new Error('not used');
            }
        }
    });

    const response = await invokeRouter(router, 'GET', '/podcast/minimax/tasks/task-123');
    assert.equal(response.statusCode, 400);
    assert.equal(response.body.error, 'podcast_minimax_task_query_failed');
    assert.equal(response.body.message, 'MiniMax 异步 TTS 查询能力尚未配置完成');
});
