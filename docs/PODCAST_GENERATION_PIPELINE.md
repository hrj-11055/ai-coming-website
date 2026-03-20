# 播客生成开发文档

## 目标

新闻播客的正式链路是：

1. 日报 JSON 生成完成
2. 使用 DeepSeek 生成口播稿
3. 使用 MiniMax 异步语音合成生成音频
4. 服务器下载音频结果
5. 服务器上传 OSS
6. 网站引用 OSS 的 `audio_url` 播放

这份文档记录当前已经在线跑通的正式实现、接口选择、状态字段和踩坑经验。

## 服务器优先

播客链路以 Linux 服务器 `/var/www/ai-coming-website` 为准，不以本地副本为准。

固定排查顺序：

1. 服务器文件与服务器 `.env`
2. 线上 `GET /api/podcast/news/:date`
3. 线上 `POST /api/podcast/news/:date/generate`
4. 本地单测与本地 smoke

详细规则见 `docs/PODCAST_SERVER_ALIGNMENT.md`。

## 正式输入源

播客脚本生成只读取这一条固定路径规则：

```text
/var/www/json/report/YYYY-MM-DD.json
```

例如：

```text
/var/www/json/report/2026-03-19.json
```

不再混用项目内 `data/*.json` 作为正式输入源。

## 链路总览

### 1. 日报 JSON -> DeepSeek 口播稿

服务文件：

- `server/services/podcast-script.js`

输入：

- 日报 JSON：`/var/www/json/report/YYYY-MM-DD.json`
- 系统提示词：`config/podcast-script-system-prompt.md`

模型：

- `deepseek-chat`

请求方式：

- `POST https://api.deepseek.com/chat/completions`

当前要求：

- 显式传 `max_tokens`
- 对 `429/500/502/503/504` 做重试和指数退避
- 直接把 JSON 文件内容作为 `user` 输入，不再先转 Markdown

落盘字段：

- `script_markdown`
- `script_tts_text`
- `transcript`
- `script_input_file`
- `script_attempts`
- `last_http_status`
- `script_hash`

### 2. 口播稿 -> MiniMax 异步 TTS

服务文件：

- `server/services/news-podcast.js`

模型：

- `speech-2.8-turbo`

音色：

- `male-qn-jingying`

请求方式：

- `POST https://api.minimaxi.com/v1/t2a_async_v2`

当前正式选择：

- 直接使用 `text` 传入完整 `script_tts_text`
- 不使用 `text_file_id`

这是基于官方异步语音合成文档允许二选一：

- `text`
- `text_file_id`

当前线上已用 `text` 跑通 2026-03-18 和 2026-03-19 两条真实播客。

### 3. MiniMax 异步任务查询

查询接口：

- `GET https://api.minimaxi.com/v1/query/t2a_async_query_v2?task_id=...`

项目内查询路由：

- `GET /api/podcast/minimax/tasks/:taskId`

创建任务后，metadata 会持久化这些字段：

- `tts_task_id`
- `tts_file_id`
- `tts_status`

状态意义：

- `script_ready`：口播稿已生成，TTS 尚未创建
- `Processing`：MiniMax 任务创建成功，仍在处理中
- `Success`：MiniMax 任务完成

### 4. 下载音频结果

正式下载行为不是“假设返回的永远是裸 mp3”。

真实可用链路是：

1. 基于 `file_id` 获取下载信息
2. 拿到 `download_url`
3. 下载归档内容
4. 在服务器上解包
5. 从归档中提取 `.mp3/.wav/.m4a/.flac/.ogg`

当前实现支持两种情况：

- 直接下到音频文件
- 下到 tar 归档，再解包提取音频

相关实现：

- `fetchMinimaxFileDownloadInfo(fileId)`
- `downloadAudioBufferFromFileId(fileId)`
- `extractAudioBufferFromArchive(buffer)`

### 5. OSS 上传与网站播放

服务器拿到最终音频后：

1. 上传阿里云 OSS
2. 写回 metadata 的 `audio_url`
3. 网站前端直接使用 `audio_url` 播放

如果 OSS 未配置，才会回退到本地文件模式。

## 当前核心文件

- `server/services/podcast-script.js`
- `server/services/news-podcast.js`
- `server/routes/podcast.js`
- `config/podcast-script-system-prompt.md`
- `scripts/audit-podcast-server-state.js`
- `scripts/manual-upload-podcast-audio.js`

## 关键环境变量

### DeepSeek

- `PODCAST_SCRIPT_API_KEY`
- `PODCAST_SCRIPT_API_URL`
- `PODCAST_SCRIPT_MODEL`
- `PODCAST_SCRIPT_INPUT_DIR`
- `PODCAST_SCRIPT_TIMEOUT_MS`
- `PODCAST_SCRIPT_MAX_TOKENS`
- `PODCAST_SCRIPT_MAX_RETRIES`
- `PODCAST_SCRIPT_RETRY_BASE_DELAY_MS`
- `PODCAST_SCRIPT_SYSTEM_PROMPT_FILE`

### MiniMax

- `MINIMAX_API_KEY`
- `MINIMAX_TTS_API_URL`
- `MINIMAX_TTS_QUERY_API_URL`
- `MINIMAX_TTS_FILE_METADATA_API_URL`
- `MINIMAX_TTS_FILE_API_URL`
- `MINIMAX_TTS_MODEL`
- `MINIMAX_TTS_VOICE_ID`
- `MINIMAX_TTS_SPEED`
- `MINIMAX_TTS_VOLUME`
- `MINIMAX_TTS_PITCH`
- `MINIMAX_TTS_FORMAT`
- `MINIMAX_TTS_LANGUAGE_BOOST`
- `MINIMAX_TTS_POLL_INTERVAL_MS`
- `MINIMAX_TTS_TIMEOUT_MS`

### OSS

- `PODCAST_OSS_REGION`
- `PODCAST_OSS_BUCKET`
- `PODCAST_OSS_ACCESS_KEY_ID`
- `PODCAST_OSS_ACCESS_KEY_SECRET`
- `PODCAST_OSS_ENDPOINT`
- `PODCAST_OSS_PUBLIC_BASE_URL`

## Metadata 字段说明

每日播客 metadata 文件位置：

```text
/var/www/ai-coming-website/data/podcasts/news/YYYY-MM-DD.json
```

核心字段：

- `status`
- `summary`
- `transcript`
- `script_markdown`
- `script_tts_text`
- `script_input_file`
- `script_attempts`
- `last_http_status`
- `last_error_message`
- `tts_task_id`
- `tts_file_id`
- `tts_status`
- `audio_url`
- `audio_storage`
- `audio_mime_type`

## 线上验证方式

### 查看播客状态

```bash
curl http://127.0.0.1:3000/api/podcast/news/2026-03-19
```

### 触发生成

```bash
curl -X POST http://127.0.0.1:3000/api/podcast/news/2026-03-19/generate
```

### 查看 MiniMax 任务状态

```bash
curl http://127.0.0.1:3000/api/podcast/minimax/tasks/<task_id>
```

## 自动触发任务

日报自动生成完成后，播客自动触发任务会负责补上后半段链路。

当前实现：

- Node 脚本：`scripts/run-podcast-autogen-once.js`
- Linux 包装脚本：`scripts/run-podcast-autogen-once.sh`
- cron 安装脚本：`scripts/setup-podcast-autogen-cron.sh`

运行规则：

- cron 每分钟执行一次包装脚本
- 但脚本本身只会在 `Asia/Shanghai` 时区的 `09:05` 之后开始扫描
- 扫描目标仅限当天文件：
  - `/var/www/json/report/YYYY-MM-DD.json`

防重复规则：

- 如果当天 metadata 已是 `ready`，跳过
- 如果当天 metadata 已是 `pending`，跳过
- 如果同一份日报文件已经被自动任务触发过，跳过
- 如果日报文件更新了，才允许再次触发

状态文件：

- `data/podcast-autogen-state.json`

### 审计服务器优先状态

```bash
npm run podcast:audit:server
```

## 已验证成功的真实样例

### 2026-03-18

- 已成功生成口播稿
- 已成功生成音频
- 已成功上传 OSS
- 网站已可引用

### 2026-03-19

- 输入源：`/var/www/json/report/2026-03-19.json`
- `script_model: deepseek-chat`
- `tts_model: speech-2.8-turbo`
- `tts_task_id: 378319701635195`
- `tts_status: Success`
- 已成功上传 OSS

## 踩坑经验与教训

### 1. 不要把本地状态当成线上真相

最大教训不是模型问题，而是容易把本地代码、服务器文件、线上生效状态混为一谈。

教训：

- 播客相关问题一律先查服务器
- 线上接口返回比本地代码默认值更重要
- PM2 多实例下，内存态和磁盘 metadata 可能短暂不一致

### 2. DeepSeek `reasoner` 不适合当前播客脚本生成

`deepseek-reasoner` 会把大量预算花在 `reasoning_content` 上，导致正文为空或不稳定。

结论：

- 当前正式脚本模型固定为 `deepseek-chat`

### 3. Token Plan 不适合当前长播客 TTS

Token Plan 下真实遇到过：

- `token plan only supports text up to 1000 characters`
- `usage limit exceeded`

结论：

- 当前长播客生成要使用可支持完整异步 TTS 的可用 key
- 不再把 Token Plan 当作长播客正式方案

### 4. MiniMax 任务创建成功，不等于文件立即可下载

MiniMax 查询成功后，仍需要按正式流程继续获取下载信息。

结论：

- 必须持久化 `tts_task_id`
- 必须持久化 `tts_file_id`
- 必须允许“创建成功 -> 查询成功 -> 再下载”的分阶段状态

### 5. 下载结果不一定是裸 mp3

这次真实跑通后确认，MiniMax 下载链路可能返回归档文件，解包后才有 mp3。

结论：

- 下载逻辑必须兼容 tar 归档
- 不要写死“下载下来就是音频文件”

### 6. 轮询超时不应过短

完整播客的异步 TTS 真实跑过超过 5 分钟，之前 300000ms 的超时过短。

结论：

- 当前 `MINIMAX_TTS_TIMEOUT_MS=600000`

### 7. `task_id` 必须落盘，否则事后不可追踪

如果不把 `tts_task_id` 写进 metadata，后续就无法手动查询 MiniMax 任务状态，也无法确认任务究竟卡在哪一步。

结论：

- `tts_task_id`
- `tts_file_id`
- `tts_status`

这三个字段是正式链路必需字段，不可省略。

### 8. 已有成品 mp3 时，允许手动补传 OSS

这次已经验证，手动上传现成 mp3 到服务器后，可以从服务器真实环境推送到 OSS，并切换网站引用。

辅助脚本：

- `scripts/manual-upload-podcast-audio.js`

## 外部文档

- [MiniMax 异步语音合成指南](https://platform.minimaxi.com/docs/guides/speech-t2a-async)
- [MiniMax 创建异步语音合成任务](https://platform.minimaxi.com/docs/api-reference/speech-t2a-async-create)
- [MiniMax 查询语音生成任务状态](https://platform.minimaxi.com/docs/api-reference/speech-t2a-async-query)
- [DeepSeek Chat Completion](https://api-docs.deepseek.com/zh-cn/api/create-chat-completion)
