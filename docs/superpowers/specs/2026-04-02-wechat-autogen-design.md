# 微信公众号自动上传任务设计

日期：`2026-04-02`

## 1. 背景

当前项目已经具备稳定的“日报 JSON -> 播客生成”链路：

1. 每天的 AI 资讯源文件落地到 `/var/www/json/report/YYYY-MM-DD.json`
2. 系统生成当天播客 metadata，并在播客完成后将 metadata 写入 `data/podcasts/news/YYYY-MM-DD.json`
3. 现有自动任务通过 cron + `run-*-once.js` 形式完成扫描、防重和触发

本次新增能力是在不影响现有播客主链路稳定性的前提下，增加一个服务端自动任务，把“当天 AI 资讯日报文章”和“当天播客文章”自动上传到微信公众号草稿箱。

## 2. 目标

新增一套独立的微信公众号自动上传任务，满足以下目标：

- 只处理当天内容，不允许回退使用旧日期内容
- 支持两类草稿来源：
  - 当天 AI 资讯日报 JSON，先自动转换成美观 Markdown，再发布
  - 当天播客 metadata，生成可阅读的播客版文章，再发布
- 上传目标是微信公众号草稿箱，不做自动群发
- 通过微信 API 发布，不依赖 Chrome 登录态
- 任务具备防重、状态记录、失败可追踪能力

## 3. 非目标

- 不做自动群发
- 不接入浏览器 CDP 自动发文流程
- 不对旧日期内容做补发或兜底
- 不在第一版做复杂的发布队列系统
- 不修改现有播客生成主链路的成功/失败判定

## 4. 关键约束

### 4.1 日期约束

业务日期统一按 `Asia/Shanghai` 计算。

例如任务在 `2026-04-02` 运行时：

- 只允许读取 `/var/www/json/report/2026-04-02.json`
- 只允许读取当天播客 metadata：`data/podcasts/news/2026-04-02.json`
- 不允许回退读取 `2026-04-01` 或更早文件

如果当天内容不存在或未就绪，任务必须记为 `skip`，而不是使用旧内容顶替。

### 4.2 发布方式约束

仅使用微信公众号 API。

- 使用 `WECHAT_APP_ID`
- 使用 `WECHAT_APP_SECRET`
- 发布到 `draft/add`

### 4.3 封面图约束

微信公众号文章草稿发布必须具备封面图。

第一版使用默认封面图：

- 源图由用户提供
- 服务端通过配置指定路径
- 两类文章默认共用一张封面

## 5. 推荐架构

采用与现有播客自动任务一致的独立 cron 扫描模式，而不是把发公众号逻辑直接耦合进播客生成流程。

### 5.1 新增模块

- `server/services/wechat-publisher.js`
  - 封装微信 API 调用
  - 负责获取 access token
  - 负责上传正文图片
  - 负责上传封面图
  - 负责提交草稿

- `server/services/wechat-content.js`
  - 负责把当天 JSON 转成公众号友好的 Markdown
  - 负责把当天播客 metadata 转成公众号友好的 Markdown
  - 负责生成标题、摘要、正文结构

- `scripts/run-wechat-autogen-once.js`
  - 扫描当天播客与当天日报
  - 执行防重判断
  - 触发发布
  - 记录状态文件

- `scripts/run-wechat-autogen-once.sh`
  - Linux 包装脚本

- `scripts/setup-wechat-autogen-cron.sh`
  - 安装 cron

- `tests/wechat-content.test.mjs`
  - 测试 JSON -> Markdown、podcast metadata -> Markdown 的格式输出

- `tests/wechat-autogen.test.mjs`
  - 测试当天判定、防重、跳过原因与触发逻辑

### 5.2 状态文件

新增：

- `data/wechat-autogen-state.json`

建议状态结构：

- `last_scan_at`
- `last_scan_date`
- `last_skip_reason`
- `podcast`
  - `last_attempted_date`
  - `last_uploaded_fingerprint`
  - `last_result`
  - `last_error`
- `markdown`
  - `last_attempted_date`
  - `last_uploaded_fingerprint`
  - `last_result`
  - `last_error`

## 6. 内容来源与转换规则

### 6.1 日报文章来源

来源目录：

- `/var/www/json/report/YYYY-MM-DD.json`

任务只读取当天 JSON，并生成中间 Markdown 文件，例如：

- `data/wechat-staging/YYYY-MM-DD-news.md`

生成规则：

- 标题固定：`MM月DD日AI资讯早报`
- 导语：简短开场
- 今日看点：从高重要性资讯中提炼 3 到 5 条
- 正文条目：按资讯顺序编号输出
  - 标题
  - 来源
  - 分类
  - 重要性
  - 核心要点
  - 深度摘要
  - 原文链接

这样既保留原始结构，又能形成适合公众号阅读的版式。

### 6.2 播客文章来源

来源文件：

- `data/podcasts/news/YYYY-MM-DD.json`

只有当 metadata 的 `status=ready` 时才允许发布。

生成规则：

- 标题固定：`MM月DD日AI资讯早报`
- 正文顶部明确标识“播客版”
- 摘要优先使用 metadata 的 `summary`
- 正文优先使用 `script_markdown`
- 如果存在 `wechat_copy`，追加为推荐转发文案区块
- 追加当日音频收听链接

建议中间 Markdown 文件：

- `data/wechat-staging/YYYY-MM-DD-podcast.md`

## 7. Markdown 与 HTML 渲染策略

由于日报源是 JSON，不是现成 Markdown，因此项目内部必须先补一层 JSON -> Markdown 的生成逻辑。

后续 Markdown -> 微信 HTML 采用以下策略：

1. 优先复用 `baoyu-post-to-wechat` 的 API 发布思路
2. 在本项目内收编关键逻辑，避免服务端运行依赖外部 skill 目录
3. 保持渲染输出适合微信公众号正文

原因：

- skill 当前依赖 `bun` 与额外包，不属于本项目正式依赖
- 直接在服务器硬依赖外部 skill 目录，运维不稳定
- 本项目已有固定的 Node 运行时模式，应尽量收口到仓库内

## 8. 微信 API 发布规则

第一版统一上传到草稿箱。

流程：

1. 通过 `appid + secret` 获取 `access_token`
2. 扫描文章 HTML 中的图片并上传微信素材
3. 上传封面图，获得 `thumb_media_id`
4. 调用 `draft/add` 创建草稿

说明：

- 草稿标题目前允许播客版与日报版同名
- 为避免运营误判，正文开头会明确写“日报版”或“播客版”
- 第一版不尝试更新已有草稿，内容变更时允许新建一份草稿

## 9. 防重规则

两类内容分别防重，互不影响。

### 9.1 日报文章 fingerprint

建议由以下字段组成：

- `date`
- `reportPath`
- `file size`
- `mtimeMs`
- 或文件内容 hash

### 9.2 播客文章 fingerprint

建议由以下字段组成：

- `date`
- `status`
- `audio_url`
- `summary`
- `script_markdown` hash

### 9.3 行为规则

- 如果当天内容不存在，跳过
- 如果当天内容存在但 fingerprint 与上次一致，跳过
- 如果当天内容存在且 fingerprint 变化，允许重新创建新草稿
- 不允许因为当天内容缺失而回退使用前几天内容

## 10. 标题与摘要规则

### 10.1 标题

标题固定为：

- `MM月DD日AI资讯早报`

例如：

- `04月02日AI资讯早报`

第一版允许播客版和日报版使用相同标题。

### 10.2 摘要

日报版：

- 优先从“今日看点”拼出 digest
- 超长时截断到适合微信摘要长度

播客版：

- 优先使用播客 metadata 的 `summary`
- 超长时截断

## 11. 配置项

新增或补充以下环境变量：

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_AUTOGEN_TIMEZONE=Asia/Shanghai`
- `WECHAT_AUTOGEN_START_HOUR=9`
- `WECHAT_AUTOGEN_START_MINUTE=5`
- `WECHAT_AUTOGEN_STATE_FILE=./data/wechat-autogen-state.json`
- `WECHAT_AUTOGEN_REPORT_DIR=/var/www/json/report`
- `WECHAT_AUTOGEN_STAGING_DIR=./data/wechat-staging`
- `WECHAT_AUTOGEN_DEFAULT_AUTHOR=AIcoming`
- `WECHAT_AUTOGEN_DEFAULT_COVER_IMAGE=<server-path>`
- `WECHAT_AUTOGEN_SITE_BASE_URL=<public-base-url>`
- `WECHAT_AUTOGEN_ENABLED_TYPES=podcast,markdown`

说明：

- `WECHAT_AUTOGEN_SITE_BASE_URL` 用于把播客相对音频地址拼成完整公网地址
- `WECHAT_AUTOGEN_DEFAULT_COVER_IMAGE` 是第一版硬依赖

## 12. 运行时行为

cron 触发方式与现有播客自动任务保持一致：

- cron 每分钟执行一次包装脚本
- 但脚本只会在设定起始时间后开始扫描

建议默认与播客自动任务保持同一时区和起始时间：

- `Asia/Shanghai`
- `09:05`

## 13. 错误处理

必须清晰记录失败原因，不允许静默失败。

建议错误类别：

- `skip_report_missing_today`
- `skip_report_invalid_today`
- `skip_podcast_missing_today`
- `skip_podcast_not_ready`
- `skip_same_fingerprint`
- `fail_cover_missing`
- `fail_access_token`
- `fail_image_upload`
- `fail_draft_publish`

所有失败都应写入 state 文件和日志。

## 14. 测试策略

### 14.1 单元测试

- JSON -> Markdown 格式生成
- podcast metadata -> Markdown 格式生成
- 标题日期格式
- digest 截断
- fingerprint 生成与防重逻辑

### 14.2 自动任务测试

- 当天 JSON 存在时触发日报草稿
- 当天 JSON 不存在时跳过
- 当天播客 `ready` 时触发播客草稿
- 当天播客不是 `ready` 时跳过
- 同 fingerprint 不重复上传
- fingerprint 变化后允许重新上传

### 14.3 回归测试

不影响现有播客自动化脚本与路由行为。

## 15. 风险与取舍

### 15.1 同标题草稿可能让草稿箱不易区分

这是用户明确接受的第一版取舍。

缓解方式：

- 正文开头标记“日报版”/“播客版”
- state 文件中分类记录

### 15.2 封面图为硬依赖

没有封面图时必须失败，不做隐式降级。

### 15.3 第一版不覆盖已有草稿

如果当天内容变化，会新增草稿，而不是尝试更新旧草稿。这样更安全，但草稿箱会留下多个版本。

## 16. 推荐实施顺序

1. 先实现 `wechat-content`，打通 JSON -> Markdown 和 podcast metadata -> Markdown
2. 再实现 `wechat-publisher`，打通微信 API 草稿发布
3. 再实现 `run-wechat-autogen-once.js` 的扫描、防重、状态记录
4. 最后补 `cron` 安装脚本、环境变量和测试

## 17. 最终结论

推荐方案是：

- 使用独立的 `wechat-autogen` 定时任务
- 只处理当天内容
- 支持当天日报 JSON 自动转 Markdown 后发布
- 支持当天播客 metadata 生成播客版文章后发布
- 统一通过微信 API 上传到公众号草稿箱
- 不依赖浏览器登录态
- 不回退旧内容，不污染现有播客主链路
