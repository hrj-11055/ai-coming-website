import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    createNewsPodcastService,
    createPodcastConfigFromEnv,
    isPodcastGenerationConfigured
} = require('../server/services/news-podcast.js');

function writeJson(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function createJsonReader() {
    return (filePath) => {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            return [];
        }
    };
}

test('createPodcastConfigFromEnv maps podcast script and minimax env vars', () => {
    const config = createPodcastConfigFromEnv({
        PODCAST_SCRIPT_API_KEY: 'script-key',
        PODCAST_SCRIPT_API_URL: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
        PODCAST_SCRIPT_MODEL: 'MiniMax-M2.5',
        PODCAST_SCRIPT_INPUT_DIR: '/var/www/json/report',
        PODCAST_SCRIPT_TIMEOUT_MS: '120000',
        PODCAST_SCRIPT_MAX_TOKENS: '2200',
        PODCAST_SCRIPT_MAX_RETRIES: '3',
        PODCAST_SCRIPT_RETRY_BASE_DELAY_MS: '1000',
        PODCAST_SCRIPT_SYSTEM_PROMPT_FILE: '/etc/podcast-prompt.md',
        MINIMAX_API_KEY: 'tts-key',
        MINIMAX_TTS_API_URL: 'https://api.minimaxi.com/v1/t2a_async_v2',
        MINIMAX_TTS_QUERY_API_URL: 'https://api.minimaxi.com/v1/query/t2a_async_query_v2',
        MINIMAX_TTS_FILE_METADATA_API_URL: 'https://api.minimaxi.com/v1/files/retrieve',
        MINIMAX_TTS_FILE_API_URL: 'https://api.minimaxi.com/v1/files/retrieve_content',
        MINIMAX_TTS_MODEL: 'speech-2.8-turbo',
        MINIMAX_TTS_VOICE_ID: 'male-qn-jingying',
        MINIMAX_TTS_SPEED: '1.1',
        MINIMAX_TTS_VOLUME: '0.9',
        MINIMAX_TTS_PITCH: '0',
        MINIMAX_TTS_FORMAT: 'mp3',
        MINIMAX_TTS_LANGUAGE_BOOST: 'Chinese',
        MINIMAX_TTS_POLL_INTERVAL_MS: '250',
        MINIMAX_TTS_TIMEOUT_MS: '60000'
    });

    assert.equal(config.script.apiKey, 'script-key');
    assert.equal(config.script.apiUrl, 'https://api.minimax.chat/v1/text/chatcompletion_v2');
    assert.equal(config.script.model, 'MiniMax-M2.5');
    assert.equal(config.script.inputDir, '/var/www/json/report');
    assert.equal(config.script.timeoutMs, 120000);
    assert.equal(config.script.maxTokens, 2200);
    assert.equal(config.script.maxRetries, 3);
    assert.equal(config.script.retryBaseDelayMs, 1000);
    assert.equal(config.script.systemPromptFile, '/etc/podcast-prompt.md');
    assert.equal(config.minimaxTts.apiKey, 'tts-key');
    assert.equal(config.minimaxTts.apiUrl, 'https://api.minimaxi.com/v1/t2a_async_v2');
    assert.equal(config.minimaxTts.queryApiUrl, 'https://api.minimaxi.com/v1/query/t2a_async_query_v2');
    assert.equal(config.minimaxTts.fileMetadataApiUrl, 'https://api.minimaxi.com/v1/files/retrieve');
    assert.equal(config.minimaxTts.fileApiUrl, 'https://api.minimaxi.com/v1/files/retrieve_content');
    assert.equal(config.minimaxTts.model, 'speech-2.8-turbo');
    assert.equal(config.minimaxTts.voiceId, 'male-qn-jingying');
    assert.equal(config.minimaxTts.audioFormat, 'mp3');
    assert.equal(config.minimaxTts.pollIntervalMs, 250);
    assert.equal(config.minimaxTts.timeoutMs, 60000);
});

test('createPodcastConfigFromEnv falls back to DeepSeek chat config for podcast scripts', () => {
    const config = createPodcastConfigFromEnv({
        DEEPSEEK_API_KEY: 'deepseek-key',
        DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
        DEEPSEEK_MODEL: 'deepseek-chat',
        PODCAST_SCRIPT_SYSTEM_PROMPT_FILE: '/etc/podcast-prompt.md',
        MINIMAX_API_KEY: 'tts-key',
        MINIMAX_TTS_API_URL: 'https://api.minimaxi.com/v1/t2a_async_v2',
        MINIMAX_TTS_MODEL: 'speech-2.8-turbo',
        MINIMAX_TTS_VOICE_ID: 'male-qn-jingying'
    });

    assert.equal(config.script.apiKey, 'deepseek-key');
    assert.equal(config.script.apiUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(config.script.model, 'deepseek-chat');
    assert.equal(config.script.systemPromptFile, '/etc/podcast-prompt.md');
});

test('createPodcastConfigFromEnv defaults podcast scripts to deepseek-chat', () => {
    const config = createPodcastConfigFromEnv({
        DEEPSEEK_API_KEY: 'deepseek-key',
        MINIMAX_API_KEY: 'tts-key',
        MINIMAX_TTS_VOICE_ID: 'male-qn-jingying'
    });

    assert.equal(config.script.model, 'deepseek-chat');
});

test('isPodcastGenerationConfigured requires both script and minimax tts configuration', () => {
    assert.equal(isPodcastGenerationConfigured({
        script: {
            apiKey: 'script-key',
            apiUrl: 'https://script.example.com',
            model: 'MiniMax-M2.5',
            systemPromptFile: '/tmp/prompt.md'
        },
        minimaxTts: {
            apiKey: 'tts-key',
            apiUrl: 'https://tts.example.com',
            model: 'speech-2.8-turbo',
            voiceId: 'male-qn-jingying'
        }
    }), true);

    assert.equal(isPodcastGenerationConfigured({
        script: {
            apiKey: '',
            apiUrl: 'https://script.example.com',
            model: 'MiniMax-M2.5',
            systemPromptFile: '/tmp/prompt.md'
        },
        minimaxTts: {
            apiKey: 'tts-key',
            apiUrl: 'https://tts.example.com',
            model: 'speech-2.8-turbo',
            voiceId: 'male-qn-jingying'
        }
    }), false);
});

test('generateNewsPodcast persists async minimax transcript metadata and local audio fallback', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-news-test-'));
    const dataDir = path.join(root, 'data');
    const archiveDir = path.join(dataDir, 'archive', 'daily');
    const metadataDir = path.join(dataDir, 'podcasts', 'news');
    const newsFile = path.join(dataDir, 'news.json');
    const promptFile = path.join(root, 'config', 'podcast-script-system-prompt.md');

    writeJson(newsFile, [
        {
            id: 1,
            title: 'Enterprise AI copilots move into workflow software',
            key_point: 'Vendors are embedding copilots deeper into day-to-day tools.',
            summary: 'The competitive edge is shifting from model demos to workflow ownership.',
            source_url: 'https://example.com/news',
            source_name: 'Example News',
            category: 'Enterprise AI',
            importance_score: 5,
            created_at: '2026-03-18T08:00:00.000Z'
        }
    ]);
    fs.mkdirSync(path.dirname(promptFile), { recursive: true });
    fs.writeFileSync(promptFile, '# prompt');

    const readData = createJsonReader();
    const service = createNewsPodcastService({
        readData,
        newsFile,
        dataDir,
        dailyArchiveDir: archiveDir,
        metadataDir,
        config: {
            script: {
                apiKey: 'script-key',
                apiUrl: 'https://script.example.com',
                model: 'MiniMax-M2.5',
                timeoutMs: 120000,
                systemPromptFile: promptFile
            },
            minimaxTts: {
                apiKey: 'tts-key',
                apiUrl: 'https://tts.example.com/v1/t2a_async_v2',
                queryApiUrl: 'https://tts.example.com/v1/query/t2a_async_query_v2',
                fileMetadataApiUrl: 'https://tts.example.com/v1/files/retrieve',
                fileApiUrl: 'https://tts.example.com/v1/files/retrieve_content',
                model: 'speech-2.8-turbo',
                voiceId: 'male-qn-jingying',
                audioFormat: 'mp3',
                speed: 1,
                volume: 1,
                pitch: 0,
                languageBoost: 'Chinese',
                pollIntervalMs: 1,
                timeoutMs: 50
            },
            oss: {}
        },
        podcastScriptService: {
            async generateScript() {
                return {
                    script_markdown: '# 小元说AI',
                    script_tts_text: '大家好，我是小元，欢迎收听今天的硅基生存指南。今天我们重点聊企业 AI 工具如何抢占工作流入口。欢迎大家订阅小元说 AI 的公众号和视频号。',
                    wechat_copy: '【硅基生存指南】2026.03.18，企业 AI 开始争抢入口，每天听10分钟AI故事，悦读生存智慧。#小元说AI',
                    excluded_items: ['旧闻示例'],
                    selected_titles: ['企业 AI 开始争抢入口']
                };
            }
        },
        fetchImpl: async (url, options = {}) => {
            if (url === 'https://tts.example.com/v1/t2a_async_v2') {
                const body = JSON.parse(options.body || '{}');
                assert.equal(body.text, '大家好，我是小元，欢迎收听今天的硅基生存指南。今天我们重点聊企业 AI 工具如何抢占工作流入口。欢迎大家订阅小元说 AI 的公众号和视频号。');
                return new Response(JSON.stringify({
                    task_id: 'task-123',
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
                    extra_info: {
                        audio_length: 61234
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

    const pending = await service.generateNewsPodcast('2026-03-18');
    assert.equal(pending.status, 'pending');

    await new Promise((resolve) => setTimeout(resolve, 20));

    const ready = service.getCurrentMetadata('2026-03-18');
    assert.equal(ready.status, 'ready');
    assert.equal(ready.transcript, '大家好，我是小元，欢迎收听今天的硅基生存指南。今天我们重点聊企业 AI 工具如何抢占工作流入口。欢迎大家订阅小元说 AI 的公众号和视频号。');
    assert.equal(ready.script_markdown, '# 小元说AI');
    assert.equal(ready.script_tts_text, ready.transcript);
    assert.equal(ready.tts_provider, 'minimax');
    assert.equal(ready.tts_voice_type, 'system_default');
    assert.equal(ready.tts_task_id, 'task-123');
    assert.equal(ready.tts_file_id, 998);
    assert.equal(ready.tts_status, 'Success');
    assert.equal(ready.audio_storage, 'local');
    assert.match(ready.audio_url, /\/api\/podcast\/news\/2026-03-18\/audio/);
    assert.deepEqual(ready.excluded_items, ['旧闻示例']);
    assert.deepEqual(ready.selected_titles, ['企业 AI 开始争抢入口']);
});

test('generateNewsPodcast triggers podcast email after ready metadata persists', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-trigger-'));
    const dataDir = path.join(root, 'data');
    const archiveDir = path.join(dataDir, 'archive', 'daily');
    const metadataDir = path.join(dataDir, 'podcasts', 'news');
    const newsFile = path.join(dataDir, 'news.json');
    const promptFile = path.join(root, 'config', 'podcast-script-system-prompt.md');
    const emailCalls = [];

    writeJson(newsFile, [
        {
            id: 1,
            title: 'Enterprise AI copilots move into workflow software',
            key_point: 'Vendors are embedding copilots deeper into day-to-day tools.',
            summary: 'The competitive edge is shifting from model demos to workflow ownership.',
            source_url: 'https://example.com/news',
            source_name: 'Example News',
            category: 'Enterprise AI',
            importance_score: 5,
            created_at: '2026-03-18T08:00:00.000Z'
        }
    ]);
    fs.mkdirSync(path.dirname(promptFile), { recursive: true });
    fs.writeFileSync(promptFile, '# prompt');

    const readData = createJsonReader();
    const service = createNewsPodcastService({
        readData,
        newsFile,
        dataDir,
        dailyArchiveDir: archiveDir,
        metadataDir,
        config: {
            script: {
                apiKey: 'script-key',
                apiUrl: 'https://script.example.com',
                model: 'MiniMax-M2.5',
                timeoutMs: 120000,
                systemPromptFile: promptFile
            },
            minimaxTts: {
                apiKey: 'tts-key',
                apiUrl: 'https://tts.example.com/v1/t2a_async_v2',
                queryApiUrl: 'https://tts.example.com/v1/query/t2a_async_query_v2',
                fileMetadataApiUrl: 'https://tts.example.com/v1/files/retrieve',
                fileApiUrl: 'https://tts.example.com/v1/files/retrieve_content',
                model: 'speech-2.8-turbo',
                voiceId: 'male-qn-jingying',
                audioFormat: 'mp3',
                speed: 1,
                volume: 1,
                pitch: 0,
                languageBoost: 'Chinese',
                pollIntervalMs: 1,
                timeoutMs: 50
            },
            oss: {}
        },
        podcastScriptService: {
            async generateScript() {
                return {
                    script_markdown: '# 小元说AI',
                    script_tts_text: '大家好，我是小元，欢迎收听今天的硅基生存指南。今天我们重点聊企业 AI 工具如何抢占工作流入口。欢迎大家订阅小元说 AI 的公众号和视频号。',
                    wechat_copy: '',
                    excluded_items: [],
                    selected_titles: ['企业 AI 开始争抢入口']
                };
            }
        },
        podcastEmailService: {
            async sendReadyPodcastEmail(payload) {
                const savedMetadata = JSON.parse(fs.readFileSync(path.join(metadataDir, '2026-03-18.json'), 'utf8'));
                emailCalls.push({
                    ...payload,
                    savedStatus: savedMetadata.status
                });
                return { action: 'sent', reason: 'email_sent' };
            }
        },
        fetchImpl: async (url) => {
            if (url === 'https://tts.example.com/v1/t2a_async_v2') {
                return new Response(JSON.stringify({
                    task_id: 'task-123',
                    base_resp: { status_code: 0, status_msg: 'success' }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            if (url === 'https://tts.example.com/v1/query/t2a_async_query_v2?task_id=task-123') {
                return new Response(JSON.stringify({
                    task_id: 'task-123',
                    status: 'Success',
                    file_id: 998,
                    extra_info: { audio_length: 61234 },
                    base_resp: { status_code: 0, status_msg: 'success' }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            if (url === 'https://tts.example.com/v1/files/retrieve?file_id=998') {
                return new Response(JSON.stringify({
                    file: {
                        file_id: 998,
                        filename: 'podcast-output.tar',
                        download_url: 'https://download.example.com/podcast-output.tar'
                    },
                    base_resp: { status_code: 0, status_msg: 'success' }
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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

    const pending = await service.generateNewsPodcast('2026-03-18');
    assert.equal(pending.status, 'pending');

    await new Promise((resolve) => setTimeout(resolve, 20));

    const ready = service.getCurrentMetadata('2026-03-18');
    assert.equal(ready.status, 'ready');
    assert.equal(emailCalls.length, 1);
    assert.equal(emailCalls[0].date, '2026-03-18');
    assert.equal(emailCalls[0].savedStatus, 'ready');
    assert.equal(emailCalls[0].metadata.status, 'ready');
    assert.ok(Buffer.isBuffer(emailCalls[0].audioBuffer));
});

test('generateNewsPodcast keeps ready metadata when podcast email send fails', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-email-failure-'));
    const dataDir = path.join(root, 'data');
    const archiveDir = path.join(dataDir, 'archive', 'daily');
    const metadataDir = path.join(dataDir, 'podcasts', 'news');
    const newsFile = path.join(dataDir, 'news.json');
    const promptFile = path.join(root, 'config', 'podcast-script-system-prompt.md');

    writeJson(newsFile, [
        {
            id: 1,
            title: 'Enterprise AI copilots move into workflow software',
            key_point: 'Vendors are embedding copilots deeper into day-to-day tools.',
            summary: 'The competitive edge is shifting from model demos to workflow ownership.',
            source_url: 'https://example.com/news',
            source_name: 'Example News',
            category: 'Enterprise AI',
            importance_score: 5,
            created_at: '2026-03-18T08:00:00.000Z'
        }
    ]);
    fs.mkdirSync(path.dirname(promptFile), { recursive: true });
    fs.writeFileSync(promptFile, '# prompt');

    const originalError = console.error;
    console.error = () => {};

    try {
        const service = createNewsPodcastService({
            readData: createJsonReader(),
            newsFile,
            dataDir,
            dailyArchiveDir: archiveDir,
            metadataDir,
            config: {
                script: {
                    apiKey: 'script-key',
                    apiUrl: 'https://script.example.com',
                    model: 'MiniMax-M2.5',
                    timeoutMs: 120000,
                    systemPromptFile: promptFile
                },
                minimaxTts: {
                    apiKey: 'tts-key',
                    apiUrl: 'https://tts.example.com/v1/t2a_async_v2',
                    queryApiUrl: 'https://tts.example.com/v1/query/t2a_async_query_v2',
                    fileMetadataApiUrl: 'https://tts.example.com/v1/files/retrieve',
                    fileApiUrl: 'https://tts.example.com/v1/files/retrieve_content',
                    model: 'speech-2.8-turbo',
                    voiceId: 'male-qn-jingying',
                    audioFormat: 'mp3',
                    speed: 1,
                    volume: 1,
                    pitch: 0,
                    languageBoost: 'Chinese',
                    pollIntervalMs: 1,
                    timeoutMs: 50
                },
                oss: {}
            },
            podcastScriptService: {
                async generateScript() {
                    return {
                        script_markdown: '# 小元说AI',
                        script_tts_text: '大家好，我是小元，欢迎收听今天的硅基生存指南。今天我们重点聊企业 AI 工具如何抢占工作流入口。欢迎大家订阅小元说 AI 的公众号和视频号。',
                        wechat_copy: '',
                        excluded_items: [],
                        selected_titles: ['企业 AI 开始争抢入口']
                    };
                }
            },
            podcastEmailService: {
                async sendReadyPodcastEmail() {
                    throw new Error('smtp unavailable');
                }
            },
            fetchImpl: async (url) => {
                if (url === 'https://tts.example.com/v1/t2a_async_v2') {
                    return new Response(JSON.stringify({
                        task_id: 'task-123',
                        base_resp: { status_code: 0, status_msg: 'success' }
                    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }

                if (url === 'https://tts.example.com/v1/query/t2a_async_query_v2?task_id=task-123') {
                    return new Response(JSON.stringify({
                        task_id: 'task-123',
                        status: 'Success',
                        file_id: 998,
                        extra_info: { audio_length: 61234 },
                        base_resp: { status_code: 0, status_msg: 'success' }
                    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }

                if (url === 'https://tts.example.com/v1/files/retrieve?file_id=998') {
                    return new Response(JSON.stringify({
                        file: {
                            file_id: 998,
                            filename: 'podcast-output.tar',
                            download_url: 'https://download.example.com/podcast-output.tar'
                        },
                        base_resp: { status_code: 0, status_msg: 'success' }
                    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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

        const pending = await service.generateNewsPodcast('2026-03-18');
        assert.equal(pending.status, 'pending');

        await new Promise((resolve) => setTimeout(resolve, 20));

        const ready = service.getCurrentMetadata('2026-03-18');
        assert.equal(ready.status, 'ready');
    } finally {
        console.error = originalError;
    }
});

test('queryMinimaxTaskStatus returns normalized async task state', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-task-status-test-'));
    const dataDir = path.join(root, 'data');
    const metadataDir = path.join(dataDir, 'podcasts', 'news');
    const promptFile = path.join(root, 'config', 'podcast-script-system-prompt.md');

    fs.mkdirSync(path.dirname(promptFile), { recursive: true });
    fs.writeFileSync(promptFile, '# prompt');

    const service = createNewsPodcastService({
        readData: () => [],
        newsFile: path.join(dataDir, 'news.json'),
        dataDir,
        metadataDir,
        config: {
            script: {
                apiKey: 'script-key',
                apiUrl: 'https://script.example.com',
                model: 'deepseek-chat',
                timeoutMs: 120000,
                systemPromptFile: promptFile
            },
            minimaxTts: {
                apiKey: 'tts-key',
                apiUrl: 'https://tts.example.com/v1/t2a_async_v2',
                queryApiUrl: 'https://tts.example.com/v1/query/t2a_async_query_v2',
                fileMetadataApiUrl: 'https://tts.example.com/v1/files/retrieve',
                fileApiUrl: 'https://tts.example.com/v1/files/retrieve_content',
                model: 'speech-2.8-turbo',
                voiceId: 'male-qn-jingying',
                audioFormat: 'mp3',
                speed: 1,
                volume: 1,
                pitch: 0,
                languageBoost: 'Chinese',
                pollIntervalMs: 1,
                timeoutMs: 50
            },
            oss: {}
        },
        fetchImpl: async (url) => {
            assert.equal(url, 'https://tts.example.com/v1/query/t2a_async_query_v2?task_id=task-xyz');
            return new Response(JSON.stringify({
                task_id: 'task-xyz',
                status: 'Success',
                file_id: 7788,
                extra_info: {
                    audio_length: 61234
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
    });

    const result = await service.queryMinimaxTaskStatus('task-xyz');
    assert.deepEqual(result, {
        task_id: 'task-xyz',
        status: 'Success',
        file_id: 7788,
        duration_seconds: 61,
        is_complete: true,
        is_failed: false
    });
});
