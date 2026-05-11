# 设计文档：微信草稿信息图功能

**日期**：2026-05-11  
**状态**：已确认，待实现

---

## 功能概述

在发送播客日报微信草稿的步骤中，于播客文字稿正文前插入一张 AI 资讯日报信息图。信息图由 AI 自动生成：先用 DeepSeek 将播客文字稿（markdown 格式）压缩为中文图片生成提示词，再用 gpt-image-2 模型生成图片，最后上传到微信正文素材库后内嵌到文章中。

---

## 架构

### 新增文件

**`server/services/infographic-generator.js`**

工厂函数 `createInfographicGenerator({ config, fetchImpl })`，对外暴露：

```js
generateInfographic({ scriptMarkdown }) → Buffer
```

内部两步：
1. 调 DeepSeek API，输入播客文字稿 markdown，输出一段中文图片生成提示词
2. 调 gpt-image-2，用提示词生成图片，解码 `b64_json` 返回 `Buffer`

### 扩展现有文件

**`server/services/wechat-publisher.js`**

新增函数：

```js
uploadNewsImage({ accessToken, imageBuffer }) → string  // 返回正文可用的图片 URL
```

调用微信 `POST /cgi-bin/media/uploadimg`（图文内嵌图片专用接口，返回 URL 而非 media_id）。

**`scripts/run-wechat-autogen-once.js`**

在 `maybePublishPodcast()` 内，`formattedMarkdown` 生成之后、`publishMarkdownDraft()` 调用之前，插入信息图生成与注入逻辑。

**`.env.example`**

新增两个环境变量：

```
GPT_IMAGE_API_KEY=
GPT_IMAGE_API_BASE_URL=https://www.bytecatcode.org
```

---

## 数据流

```
metadata.script_markdown
        ↓
[infographic-generator] DeepSeek
  model: deepseek-v4-flash
  task: 根据播客文字稿生成中文图片提示词
        ↓
中文图片提示词
        ↓
[infographic-generator] gpt-image-2
  POST {GPT_IMAGE_API_BASE_URL}/v1/images/generations
  model: gpt-image-2, size: 1024x1024
  response_format: b64_json
        ↓
Buffer（PNG 图片）
        ↓
[wechat-publisher] uploadNewsImage()
  POST https://api.weixin.qq.com/cgi-bin/media/uploadimg
        ↓
imageUrl
        ↓
在 formattedMarkdown 最前面插入 ![AI资讯日报信息图](imageUrl)
        ↓
publishMarkdownDraft()（现有流程，无变化）
```

---

## 错误处理

- 信息图任一步骤失败（DeepSeek 报错、gpt-image-2 超时、微信上传失败）→ **降级跳过**，照常发布无图版草稿
- 记录 `warn` 级别日志，不抛出异常，不阻断播客草稿发布流程

---

## 缓存与重复执行

- 不为信息图单独设缓存
- 现有 fingerprint 机制已确保同一天内容不变时不会重复发布，信息图随播客草稿一起跟随此机制

---

## 配置

| 环境变量 | 说明 | 示例值 |
|---|---|---|
| `GPT_IMAGE_API_KEY` | 中转站 API Key | `sk-xxx` |
| `GPT_IMAGE_API_BASE_URL` | 中转站 Base URL | `https://www.bytecatcode.org` |

DeepSeek 配置沿用现有 `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL`，无需新增。

---

## 涉及文件清单

| 操作 | 文件 |
|---|---|
| 新建 | `server/services/infographic-generator.js` |
| 修改 | `server/services/wechat-publisher.js` |
| 修改 | `scripts/run-wechat-autogen-once.js` |
| 修改 | `.env.example` |
