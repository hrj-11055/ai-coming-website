# 微信日报贴图自动链路

微信草稿箱的正式日报链路只发布图片消息草稿：

1. 读取当天日报 JSON。
2. 按重要性筛选并去重，只保留 3 条核心信息。
3. 通过 TokenGo Images API 的 `gpt-image-2` 生成高质量竖版日报一览图。
4. 将图片上传为微信永久图片素材。
5. 调用微信 `draft/add`，使用 `article_type: "newspic"` 创建贴图草稿。

图片是主要展示内容，三条简短文字是补充。链路不读取或上传播客口播稿；图片生成失败时不会发布纯文字草稿。

## 必需配置

```dotenv
TOKENGO_API_KEY=
TOKENGO_API_BASE_URL=https://ai.ssgoo.net
TOKENGO_IMAGE_MODEL=gpt-image-2
TOKENGO_IMAGE_SIZE=1024x1536
TOKENGO_IMAGE_QUALITY=high
TOKENGO_IMAGE_OUTPUT_FORMAT=jpeg
TOKENGO_IMAGE_OUTPUT_COMPRESSION=80
TOKENGO_IMAGE_RESPONSE_FORMAT=url

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
