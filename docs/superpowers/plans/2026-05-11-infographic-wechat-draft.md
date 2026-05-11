# 微信草稿信息图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在发布播客微信草稿时，自动生成一张 AI 资讯日报信息图并内嵌到正文最前面。

**Architecture:** 新建 `infographic-generator.js` 服务：先调 DeepSeek 将播客文字稿压缩为中文图片提示词，再调 gpt-image-2 生成图片返回 Buffer。`wechat-publisher.js` 新增 `uploadNewsImage` 和 `uploadNewsImageForContent` 方法。`run-wechat-autogen-once.js` 的 `maybePublishPodcast` 中在发布前注入信息图，失败时降级跳过。

**Tech Stack:** Node.js (CommonJS), DeepSeek API, gpt-image-2 via 中转站 (`https://www.bytecatcode.org`), 微信 uploadimg API

---

### Task 1: 新建 `server/services/infographic-generator.js`

**Files:**
- Create: `server/services/infographic-generator.js`

- [ ] **Step 1: 创建文件，写入完整实现**

```js
'use strict';

const DEFAULT_DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEFAULT_GPT_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const DEFAULT_TIMEOUT_MS = 120000;

function buildImagePromptSystemMessage() {
    return [
        '你是一名 AI 资讯信息图设计师。',
        '根据以下播客文字稿，生成一段中文图片生成提示词，用于制作一张 AI 资讯日报信息图。',
        '要求：',
        '1. 提示词描述图片的视觉构成、主要内容、风格和色调',
        '2. 图片风格：科技感、简洁、信息丰富',
        '3. 图片应包含今日 AI 资讯的核心亮点（3~5 条新闻标题或关键词）',
        '4. 只输出提示词，不要解释'
    ].join('\n');
}

function normalizeChatCompletionsUrl(baseOrFullUrl, fallbackUrl) {
    const raw = (baseOrFullUrl || '').trim();
    if (!raw) return fallbackUrl;
    if (/\/chat\/completions\/?$/.test(raw)) return raw;
    return `${raw.replace(/\/+$/, '')}/chat/completions`;
}

function createInfographicGenerator({ config = {}, fetchImpl = fetch } = {}) {
    const deepseekApiKey = config.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
    const deepseekUrl = normalizeChatCompletionsUrl(
        config.deepseekApiUrl || process.env.DEEPSEEK_API_URL || process.env.DEEPSEEK_BASE_URL || '',
        DEFAULT_DEEPSEEK_URL
    );
    const deepseekModel = config.deepseekModel || process.env.DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL;

    const gptImageApiKey = config.gptImageApiKey || process.env.GPT_IMAGE_API_KEY || '';
    const gptImageBaseUrl = (config.gptImageBaseUrl || process.env.GPT_IMAGE_API_BASE_URL || '').replace(/\/+$/, '');
    const gptImageModel = config.gptImageModel || DEFAULT_GPT_IMAGE_MODEL;
    const imageSize = config.imageSize || DEFAULT_IMAGE_SIZE;
    const timeoutMs = Math.max(1000, Number(config.timeoutMs || DEFAULT_TIMEOUT_MS));

    return {
        async generateInfographic({ scriptMarkdown }) {
            if (!deepseekApiKey) throw new Error('缺少 DeepSeek API Key，无法生成信息图提示词');
            if (!gptImageApiKey) throw new Error('缺少 GPT Image API Key，无法生成信息图');
            if (!gptImageBaseUrl) throw new Error('缺少 GPT Image API Base URL，无法生成信息图');

            // Step 1: DeepSeek 压缩文字稿 → 中文图片提示词
            const controller1 = new AbortController();
            const timer1 = setTimeout(() => controller1.abort(), timeoutMs);
            let imagePrompt;
            try {
                const resp = await fetchImpl(deepseekUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${deepseekApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: deepseekModel,
                        messages: [
                            { role: 'system', content: buildImagePromptSystemMessage() },
                            { role: 'user', content: String(scriptMarkdown || '').trim() }
                        ],
                        temperature: 0.7,
                        max_tokens: 500,
                        thinking: { type: 'disabled' },
                        stream: false
                    }),
                    signal: controller1.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `DeepSeek 请求失败: HTTP ${resp.status}`);
                }
                const content = data?.choices?.[0]?.message?.content;
                imagePrompt = (typeof content === 'string' ? content : '').trim();
                if (!imagePrompt) throw new Error('DeepSeek 未返回图片提示词');
            } finally {
                clearTimeout(timer1);
            }

            // Step 2: gpt-image-2 生成图片
            const controller2 = new AbortController();
            const timer2 = setTimeout(() => controller2.abort(), timeoutMs);
            try {
                const resp = await fetchImpl(`${gptImageBaseUrl}/v1/images/generations`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${gptImageApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: gptImageModel,
                        prompt: imagePrompt,
                        n: 1,
                        size: imageSize
                    }),
                    signal: controller2.signal
                });
                const data = await resp.json().catch(() => ({}));
                if (!resp.ok) {
                    throw new Error(data?.error?.message || `图片生成失败: HTTP ${resp.status}`);
                }
                const b64 = data?.data?.[0]?.b64_json;
                if (!b64) throw new Error('gpt-image-2 未返回 b64_json');
                return Buffer.from(b64, 'base64');
            } finally {
                clearTimeout(timer2);
            }
        }
    };
}

module.exports = { createInfographicGenerator, buildImagePromptSystemMessage };
```

- [ ] **Step 2: 验证文件可 require**

```bash
node -e "const m = require('./server/services/infographic-generator.js'); console.log(typeof m.createInfographicGenerator)"
```

Expected: `function`

- [ ] **Step 3: Commit**

```bash
git add server/services/infographic-generator.js
git commit -m "feat: add infographic-generator service (DeepSeek → gpt-image-2)"
```

---

### Task 2: 为 infographic-generator 写测试

**Files:**
- Create: `tests/infographic-generator.test.mjs`

- [ ] **Step 1: 创建测试文件**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createInfographicGenerator, buildImagePromptSystemMessage } = require('../server/services/infographic-generator.js');

test('buildImagePromptSystemMessage 包含必要的中文指令', () => {
    const msg = buildImagePromptSystemMessage();
    assert.match(msg, /信息图/);
    assert.match(msg, /播客文字稿/);
    assert.match(msg, /中文图片生成提示词/);
    assert.match(msg, /只输出提示词/);
});

test('generateInfographic 先调 DeepSeek 再调 gpt-image-2，返回 Buffer', async () => {
    const calls = [];
    const fakeB64 = Buffer.from('fake-png-bytes').toString('base64');
    const generator = createInfographicGenerator({
        config: {
            deepseekApiKey: 'ds-key',
            gptImageApiKey: 'img-key',
            gptImageBaseUrl: 'https://example.com'
        },
        fetchImpl: async (url, opts) => {
            const body = JSON.parse(opts.body);
            calls.push({ url, body });
            if (url.includes('chat/completions')) {
                return new Response(JSON.stringify({
                    choices: [{ message: { content: '科技感信息图，今日AI三大热点：GPT-5发布，Gemini升级，开源模型爆发' } }]
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({
                data: [{ b64_json: fakeB64 }]
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    });

    const buffer = await generator.generateInfographic({
        scriptMarkdown: '## 今日播客\n三大AI新闻...'
    });

    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /chat\/completions/);
    assert.equal(calls[0].body.model, 'deepseek-v4-flash');
    assert.deepEqual(calls[0].body.thinking, { type: 'disabled' });
    assert.ok(calls[0].body.messages.some(m => m.role === 'user' && m.content.includes('今日播客')));

    assert.match(calls[1].url, /\/v1\/images\/generations/);
    assert.equal(calls[1].body.model, 'gpt-image-2');
    assert.equal(calls[1].body.prompt, '科技感信息图，今日AI三大热点：GPT-5发布，Gemini升级，开源模型爆发');
    assert.equal(calls[1].body.n, 1);
    assert.equal(calls[1].body.size, '1024x1024');

    assert.ok(Buffer.isBuffer(buffer));
    assert.deepEqual(buffer, Buffer.from('fake-png-bytes'));
});

test('generateInfographic 在缺少 DeepSeek key 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: '', gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /DeepSeek/);
});

test('generateInfographic 在缺少 gpt image key 时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: 'ds-key', gptImageApiKey: '', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async () => { throw new Error('should not be called'); }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /GPT Image/);
});

test('generateInfographic 在 DeepSeek 返回空内容时抛出', async () => {
    const generator = createInfographicGenerator({
        config: { deepseekApiKey: 'ds-key', gptImageApiKey: 'img-key', gptImageBaseUrl: 'https://x.com' },
        fetchImpl: async (url) => {
            if (url.includes('completions')) {
                return new Response(JSON.stringify({
                    choices: [{ message: { content: '' } }]
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            throw new Error('should not reach image api');
        }
    });
    await assert.rejects(() => generator.generateInfographic({ scriptMarkdown: 'test' }), /未返回图片提示词/);
});
```

- [ ] **Step 2: 运行测试，确认全部通过**

```bash
node --test tests/infographic-generator.test.mjs
```

Expected: 5 tests pass, 0 failures

- [ ] **Step 3: Commit**

```bash
git add tests/infographic-generator.test.mjs
git commit -m "test: add infographic-generator tests"
```

---

### Task 3: `wechat-publisher.js` 新增 `uploadNewsImage` 和 `uploadNewsImageForContent`

**Files:**
- Modify: `server/services/wechat-publisher.js`

- [ ] **Step 1: 在文件顶部常量区 (约第 17 行) 新增常量**

在 `SENDALL_URL` 那行之后插入：

```js
const NEWS_IMAGE_UPLOAD_URL = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg';
```

- [ ] **Step 2: 在 `uploadVoice` 函数结束后（约 315 行）新增 `uploadNewsImage` 函数**

```js
async function uploadNewsImage({ accessToken, imageBuffer, fetchImpl = fetch }) {
    const { boundary, body } = buildMultipartBody({
        fieldName: 'media',
        fileName: 'infographic.png',
        mimeType: 'image/png',
        fileBuffer: imageBuffer
    });

    const response = await fetchImpl(
        `${NEWS_IMAGE_UPLOAD_URL}?access_token=${encodeURIComponent(accessToken)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
            body
        }
    );

    if (!response.ok) {
        throw new Error(`上传正文图片失败: HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => ({}));
    if (data.errcode) {
        throw new Error(`上传正文图片失败: ${data.errmsg || data.errcode}`);
    }
    if (!data.url) {
        throw new Error('上传正文图片成功但缺少 url');
    }

    return data.url;
}
```

- [ ] **Step 3: 在 `createWechatPublisher` 返回对象中（`publishPodcastAudio` 方法之后，约 519 行）新增方法**

```js
async uploadNewsImageForContent({ imageBuffer }) {
    const accessToken = await fetchAccessToken({ appId, appSecret, fetchImpl });
    return uploadNewsImage({ accessToken, imageBuffer, fetchImpl });
},
```

- [ ] **Step 4: 在 `module.exports` 中新增 `uploadNewsImage`**

```js
module.exports = {
    createWechatPublisher,
    fetchAccessToken,
    publishDraft,
    publishPreviewVoice,
    publishSendAllVoice,
    renderMarkdownToHtml,
    renderMarkdownToHtmlLegacy,
    uploadImage,
    uploadNewsImage,
    uploadVoice
};
```

- [ ] **Step 5: 验证 require 正常，无语法错误**

```bash
node -e "const m = require('./server/services/wechat-publisher.js'); console.log(typeof m.uploadNewsImage)"
```

Expected: `function`

- [ ] **Step 6: Commit**

```bash
git add server/services/wechat-publisher.js
git commit -m "feat: add uploadNewsImage and uploadNewsImageForContent to wechat-publisher"
```

---

### Task 4: 为 `uploadNewsImage` 写测试

**Files:**
- Modify: `tests/wechat-publisher.test.mjs`

- [ ] **Step 1: 在 `tests/wechat-publisher.test.mjs` 末尾追加以下测试**

先读文件确认末尾位置，然后追加：

```js
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
```

- [ ] **Step 2: 运行测试**

```bash
node --test tests/wechat-publisher.test.mjs
```

Expected: 新增的 2 个测试通过

- [ ] **Step 3: Commit**

```bash
git add tests/wechat-publisher.test.mjs
git commit -m "test: add uploadNewsImage tests in wechat-publisher"
```

---

### Task 5: 更新 `run-wechat-autogen-once.js` 注入信息图逻辑

**Files:**
- Modify: `scripts/run-wechat-autogen-once.js`

- [ ] **Step 1: 在文件顶部 require 区（约第 19 行）新增 import**

在 `createWechatPublisher` 那行之后插入：

```js
const { createInfographicGenerator } = require('../server/services/infographic-generator');
```

- [ ] **Step 2: 修改 `maybePublishPodcast` 函数签名，新增 `infographicGenerator` 参数**

将：
```js
async function maybePublishPodcast({
    date,
    podcastMetadataDir,
    stagingDir,
    state,
    publisher,
    podcastFormatter,
    enabledTypes,
    siteBaseUrl
}) {
```

改为：
```js
async function maybePublishPodcast({
    date,
    podcastMetadataDir,
    stagingDir,
    state,
    publisher,
    podcastFormatter,
    infographicGenerator,
    enabledTypes,
    siteBaseUrl
}) {
```

- [ ] **Step 3: 在 `maybePublishPodcast` 内，`writeTextFile(stagingPath, markdown)` 那行之前插入信息图注入逻辑**

找到：
```js
    const stagingPath = path.join(stagingDir, `${date}-podcast.md`);
    writeTextFile(stagingPath, markdown);
```

在这两行之前插入：

```js
    if (infographicGenerator) {
        try {
            const imageBuffer = await infographicGenerator.generateInfographic({
                scriptMarkdown: metadata.script_markdown || ''
            });
            const imageUrl = await publisher.uploadNewsImageForContent({ imageBuffer });
            markdown = `![AI资讯日报信息图](${imageUrl})\n\n${markdown}`;
        } catch (err) {
            console.warn(`[wechat-autogen] infographic generation failed, skipping: ${err?.message || err}`);
        }
    }
```

- [ ] **Step 4: 在 `runWechatAutogenOnce` 中添加懒加载工厂函数**

在 `getPodcastFormatter()` 函数定义之后（约 428 行），插入：

```js
    function getInfographicGenerator() {
        if (!infographicGenerator) {
            infographicGenerator = createInfographicGenerator(options.infographicGeneratorOptions || {});
        }
        return infographicGenerator;
    }
```

同时在 `runWechatAutogenOnce` 函数体顶部的变量声明区，追加：

```js
    let infographicGenerator = null;
```

（其他 `let publisher = null; let podcastFormatter = null;` 等变量旁边）

- [ ] **Step 5: 在调用 `maybePublishPodcast` 处，传入 `infographicGenerator`**

找到：
```js
    const podcastResult = await maybePublishPodcast({
        date: dateInfo.date,
        podcastMetadataDir,
        stagingDir,
        state,
        publisher: {
            publishMarkdownDraft(payload) {
                return getPublisher().publishMarkdownDraft(payload);
            }
        },
        podcastFormatter: {
            ...
        },
        enabledTypes,
        siteBaseUrl
    });
```

在 `podcastFormatter: { ... }` 块之后，`enabledTypes` 之前插入：

```js
        infographicGenerator: {
            generateInfographic(payload) {
                return getInfographicGenerator().generateInfographic(payload);
            }
        },
```

同时在 `publisher` 的接口对象中补充 `uploadNewsImageForContent`：

```js
        publisher: {
            publishMarkdownDraft(payload) {
                return getPublisher().publishMarkdownDraft(payload);
            },
            uploadNewsImageForContent(payload) {
                return getPublisher().uploadNewsImageForContent(payload);
            }
        },
```

- [ ] **Step 6: 验证脚本无语法错误**

```bash
node -e "require('./scripts/run-wechat-autogen-once.js')" 2>&1 | head -5
```

Expected: 无报错（脚本不会自动执行，因为 `require.main === module` 为 false）

- [ ] **Step 7: Commit**

```bash
git add scripts/run-wechat-autogen-once.js
git commit -m "feat: inject infographic into podcast wechat draft"
```

---

### Task 6: 更新 `.env.example` 并推送部署

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: 在 `.env.example` 的 DeepSeek 配置区之后新增图片生成配置**

找到：
```
DEEPSEEK_MODEL=deepseek-v4-flash
```

在其后插入：

```
# =====================================================
# 图片生成 API (gpt-image-2 中转站)
# =====================================================
GPT_IMAGE_API_KEY=sk-your-key-here
GPT_IMAGE_API_BASE_URL=https://www.bytecatcode.org
```

- [ ] **Step 2: 在服务器 `.env` 中追加真实 key**

```bash
ssh root@8.135.37.159 "echo 'GPT_IMAGE_API_KEY=sk-1eo48hSKonZmjtnh2Rmz6DauxdPxl46P31TnT45pdpZSpxhl' >> /var/www/ai-coming-website/.env && echo 'GPT_IMAGE_API_BASE_URL=https://www.bytecatcode.org' >> /var/www/ai-coming-website/.env"
```

- [ ] **Step 3: Commit `.env.example` 并推送**

```bash
git add .env.example
git commit -m "chore: add GPT_IMAGE_API_KEY and GPT_IMAGE_API_BASE_URL env vars"
git push
```

- [ ] **Step 4: 服务器拉取并重启**

```bash
ssh root@8.135.37.159 "cd /var/www/ai-coming-website && git pull && pm2 restart all"
```

- [ ] **Step 5: 服务器上手动触发一次验证**

```bash
ssh root@8.135.37.159 "cd /var/www/ai-coming-website && node scripts/run-wechat-autogen-once.js 2>&1 | tail -30"
```

Expected: 日志中出现 infographic 相关输出，或降级 warn（若当天无播客 metadata）

---

### Task 7: 运行全部测试，验证无回归

- [ ] **Step 1: 运行全部单元测试**

```bash
node --test tests/
```

Expected: 全部通过，无 FAIL

- [ ] **Step 2: 最终 Commit（如有遗漏改动）**

```bash
git status
# 确认无未提交文件
```
