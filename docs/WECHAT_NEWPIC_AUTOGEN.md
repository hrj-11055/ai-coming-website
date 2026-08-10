# 微信日报贴图自动链路

微信草稿箱的正式日报链路只发布图片消息草稿：

1. 读取当天日报 JSON。
2. 按重要性筛选并去重，只保留 10 条核心信息。
3. 调用 DeepSeek Chat Completions API，把每条新闻压缩成短标题和恰好两句话；代码校验总正文不超过 500 字。
4. 把结果缓存到 `data/wechat-staging/YYYY-MM-DD-newspic-summary.json`，记录来源指纹、模型和 token 用量，失败重试时不重复调用 DeepSeek。
5. 将同一份精选正文直接交给 TokenGo Images edits API 的 `gpt-image-2`，并附加“基于以上内容画一幅日报图，并附上当天的日期。”，参考内置报纸式日报样图生成高质量竖版日报一览图。
6. 将图片上传为微信永久图片素材。
7. 调用微信 `draft/add`，使用 `article_type: "newspic"` 创建贴图草稿。

图片是主要展示内容，10 条简短文字是补充。链路不读取或上传播客口播稿；图片生成失败时不会发布纯文字草稿。

## 为什么不经过 Gmail

日报 JSON、DeepSeek 精选和图片提示词都在同一个服务器任务中，代码可以直接传递结构化内容。经过 Gmail 不会减少 DeepSeek 或图片模型 token，反而会增加邮箱授权、邮件延迟、格式丢失和重复消费的风险。因此正式链路不使用 Gmail 中转，也不需要配置收件邮箱。

## 必需配置

```dotenv
TOKENGO_API_KEY=
TOKENGO_API_BASE_URL=https://ai.ssgoo.net
TOKENGO_IMAGE_MODEL=gpt-image-2
TOKENGO_IMAGE_SIZE=1024x1536
TOKENGO_IMAGE_QUALITY=high
TOKENGO_IMAGE_OUTPUT_FORMAT=png
TOKENGO_IMAGE_RESPONSE_FORMAT=url
TOKENGO_IMAGE_INPUT_FIDELITY=high
# 可选：覆盖内置参考图
# TOKENGO_IMAGE_REFERENCE_PATH=/absolute/path/to/reference.png

# 默认复用 DEEPSEEK_API_KEY 和 DEEPSEEK_MODEL
# 可选：为日报精选单独覆盖
DAILY_NEWS_SUMMARY_API_KEY=
DAILY_NEWS_SUMMARY_API_URL=https://api.deepseek.com/chat/completions
DAILY_NEWS_SUMMARY_MODEL=
DAILY_NEWS_SUMMARY_TIMEOUT_MS=120000
DAILY_NEWS_SUMMARY_MAX_TOKENS=1200
DAILY_NEWS_SUMMARY_MAX_RETRIES=2

WECHAT_APP_ID=
WECHAT_APP_SECRET=
WECHAT_AUTOGEN_ENABLED=true
WECHAT_AUTOGEN_ENABLED_TYPES=newspic
WECHAT_AUTOGEN_REPORT_DIR=/var/www/json/report
```

执行一次：

```bash
npm run wechat:autogen:once
```
