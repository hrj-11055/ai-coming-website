# 定时任务与数据流转总览

更新日期：`2026-06-05`

## 当前结论

当前正式下游链路已经从旧的 podcast / 邮件链路切换为微信早报贴图链路：

1. 上游每天生成 AI 日报 JSON。
2. 网站侧同步当天日报数据。
3. `wechat-autogen` 定时任务从当天日报中选出 10 条核心信息。
4. 系统生成一张日报贴图，并把同一份 10 条正文写入微信草稿箱。

旧的 podcast 生成、podcast 邮件发送、podcast 邮件补发任务仍保留代码用于历史排障，但不再是生产主链路。

## 生产定时任务

### 上游日报生成

- 触发源：`ai-rss-daily.timer`
- 产物：`/var/www/json/report/YYYY-MM-DD.json`
- 说明：这是微信早报贴图的数据源。

### 日报同步与兜底

- `sync-json-news.sh`
  - 建议时间：日报生成后，例如 `07:10` 与 `07:30`
  - 作用：同步 `/var/www/json/report/YYYY-MM-DD.json` 到网站数据。

- `scripts/watch-report-to-data.sh --once`
  - 作用：兼容性复制任务，按日期把上游 report 同步到网站 `data/`。

- `scripts/check-daily-report-ready.sh`
  - 作用：早间 watchdog，检查当天上游日报是否已经生成。

### 微信早报贴图

- 脚本：`scripts/run-wechat-autogen-once.js`
- 包装脚本：`scripts/run-wechat-autogen-once.sh`
- cron 标记：`# ai-coming wechat autogen job`
- 生产关键配置：
  - `WECHAT_AUTOGEN_ENABLED=true`
  - `WECHAT_AUTOGEN_ENABLED_TYPES=newspic`
  - `WECHAT_AUTOGEN_REPORT_DIR=/var/www/json/report`
  - `WECHAT_AUTOGEN_START_HOUR=7`
  - `WECHAT_AUTOGEN_START_MINUTE=45`

运行逻辑：

1. 到达扫描窗口后读取当天 `/var/www/json/report/YYYY-MM-DD.json`。
2. `selectCoreNewsItems` 选出 10 条去重后的高价值新闻。
3. 生成同一份 10 条正文，写入 `data/wechat-staging/YYYY-MM-DD-newspic.txt`。
4. 优先调用 TokenGo `gpt-image-2` 生成日报底图。
5. 如果 TokenGo 超时或返回错误，使用本地 fallback 科技底图。
6. 用 `sharp` 把 10 条正文精确合成到最终图片，写入 `data/wechat-staging/YYYY-MM-DD-newspic.jpg`。
7. 通过微信公众号 `newspic` 草稿接口上传一张图片和同一份正文。
8. 写入 `data/wechat-autogen-state.json`，用 fingerprint 防止重复上传。

## 旧 podcast 链路状态

以下任务不再作为生产主链路运行：

- `scripts/run-podcast-autogen-once.js`
- `scripts/run-podcast-email-once.js`
- `scripts/run-podcast-email-once.sh`
- `scripts/setup-podcast-email-cron.sh`

`setup-podcast-email-cron.sh` 已默认拒绝安装旧补发 cron；只有显式设置 `PODCAST_EMAIL_CRON_ENABLED=true` 才会安装。

生产 crontab 中不应再出现：

```text
# ai-coming podcast email retry job
```

## 当前生产 crontab 期望形态

生产服务器应保留：

- 上游日报同步任务
- report watch copy 兼容任务
- daily report watchdog
- `# ai-coming wechat autogen job`

生产服务器不应保留：

- `# ai-coming podcast email retry job`
- 旧 podcast autogen cron

## 验证命令

```bash
crontab -l | grep -E 'wechat|podcast|autogen|report watch|daily report'
```

期望能看到 `wechat autogen job`，且看不到 `podcast email retry job`。

手动验证微信早报贴图链路：

```bash
cd /var/www/ai-coming-website
node scripts/run-wechat-autogen-once.js --verbose
```

若当天已成功上传，同一份日报应返回：

```text
"reason":"same_fingerprint"
```
