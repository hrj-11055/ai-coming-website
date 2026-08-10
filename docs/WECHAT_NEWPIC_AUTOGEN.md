# 日报精选与 ChatGPT 网页版绘图交接

当前正式链路不再调用 TokenGo 或 `gpt-image-2` API，也不自动生成、上传微信图片草稿。服务器只负责准备可审计的日报精选和一份可直接复制到 ChatGPT 网页版的绘图提示词：

1. 读取当天日报 JSON。
2. 按重要性筛选并去重，只保留 10 条核心信息。
3. 调用 DeepSeek Chat Completions API，把每条新闻压缩成短标题和恰好两句话。
4. 代码校验条数、句数和总正文不超过 500 字。
5. 缓存摘要与 token 用量，失败重试时不重复调用 DeepSeek。
6. 生成包含当天日期和完整精选正文的 ChatGPT 网页版绘图提示词文件。

## 每日产物

```text
data/wechat-staging/YYYY-MM-DD-newspic-summary.json
data/wechat-staging/YYYY-MM-DD-newspic.txt
data/wechat-staging/YYYY-MM-DD-newspic-chatgpt-prompt.txt
```

- `newspic-summary.json`：来源指纹、DeepSeek 模型、token 用量、10 条结构化摘要。
- `newspic.txt`：10 条精选正文，总计不超过 500 字。
- `newspic-chatgpt-prompt.txt`：手动复制到 ChatGPT 网页版的完整绘图指令，已包含当天日期。提示词只给出报纸编辑方向和事实边界，让 ChatGPT 自主提炼主标题、安排版面，并选择品牌标志、代表性图像或关键数字作为视觉重点。

如有满意的日报参考图，可以在粘贴提示词时一并上传。提示词会要求模型只参考其报纸气质、信息层级和图文节奏，不机械复刻具体布局。

## 为什么不经过 Gmail

日报 JSON、DeepSeek 精选和绘图提示词都在同一个服务器任务中，代码可以直接写出最终文件。经过 Gmail 不会减少 DeepSeek token，反而会增加邮箱授权、邮件延迟、格式丢失和重复消费风险，因此不使用 Gmail 中转，也不需要配置收件邮箱。

## 为什么不自动操作 ChatGPT 网页版

ChatGPT 网页版依赖 Mac 保持开机、浏览器保持登录，并且页面结构和登录校验可能变化。服务器上的 Linux 定时任务无法直接复用 Mac 浏览器会话。当前采用稳定的人工交接：服务器每天自动准备提示词，用户在 Mac 上打开 ChatGPT 网页版，粘贴提示词后生成图片。

## 必需配置

```dotenv
# 默认复用 DEEPSEEK_API_KEY 和 DEEPSEEK_MODEL
# 可选：为日报精选单独覆盖
DAILY_NEWS_SUMMARY_API_KEY=
DAILY_NEWS_SUMMARY_API_URL=https://api.deepseek.com/chat/completions
DAILY_NEWS_SUMMARY_MODEL=
DAILY_NEWS_SUMMARY_TIMEOUT_MS=120000
DAILY_NEWS_SUMMARY_MAX_TOKENS=1200
DAILY_NEWS_SUMMARY_MAX_RETRIES=2

WECHAT_AUTOGEN_ENABLED=true
WECHAT_AUTOGEN_ENABLED_TYPES=newspic
WECHAT_AUTOGEN_REPORT_DIR=/var/www/json/report
WECHAT_AUTOGEN_STAGING_DIR=./data/wechat-staging
```

执行一次：

```bash
npm run wechat:autogen:once
```

随后打开当天的 `data/wechat-staging/YYYY-MM-DD-newspic-chatgpt-prompt.txt`，复制全部内容到 ChatGPT 网页版生成图片。
