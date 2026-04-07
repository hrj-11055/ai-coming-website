# AIcoming Website

当前版本：`0.2.0`

AIcoming 是一个面向真实工作流的 AI 内容与工具门户，当前稳定提供四类能力：

1. 首页 AI 搜索与提示词辅助体验
2. AI 资讯页、热点关键词与每日播客
3. AI 工具集目录页
4. 管理后台 API、数据导入与运维脚本

## 当前产品范围

### 用户侧页面

- `/index.html`
  - AI 搜索入口与提示词辅助页面
- `/news.html`
  - 每日 AI 资讯、关键词、今日播客
- `/tools.html`
  - 按分类展示的 AI 工具集
  - AI 产品与企业转型咨询实践页
- `/about.html`
  - 公司与合作介绍页

### 管理与运维能力

- 管理登录：`/admin-login.html`
- 统计页：`/admin-analytics.html`
- IP 封禁页：`/admin-ipban.html`
- JSON 主线运行时：`server-json.js` + `server/runtime.js`
- 播客链路：DeepSeek 口播稿 + MiniMax 异步 TTS + OSS/本地音频回退

## 当前运行主线

项目当前以 `JSON 文件存储` 为唯一稳定主线。

- 默认启动入口：`server-json.js`
- 运行时装配：`server/runtime.js`
- MySQL 入口 `server-mysql.js` 仍保留，但不是当前发布主线
- 运行时数据目录：`data/`

## 关键产品能力

### 1. AI 资讯与关键词

- 日报内容通过 JSON 文件落盘并对外展示
- 新闻页展示资讯卡片、热点关键词与播客状态
- 支持导入、归档、统计与后台维护

### 2. AI 工具集

- 工具页当前由前端静态目录驱动：
  - `frontend/modules/tools-catalog.js`
  - `frontend/tools-page.js`
  - `tools.html`
- `/api/tools*` 仍保留，主要用于后台与后续数据化扩展
- 当前线上展示以静态目录为准，不以 `data/tools.json` 作为工具页直接数据源

### 3. 每日播客

- 正式输入源：`/var/www/json/report/YYYY-MM-DD.json`
- 生成链路：
  1. DeepSeek 生成口播稿
  2. MiniMax 异步生成音频
  3. 服务器下载并上传 OSS
  4. 前端通过 `audio_url` 播放
- 播客链路遵循“服务器优先”原则

## 启动方式

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .env.example .env
```

至少配置：

- `JWT_SECRET`
- 模型 API Key
- 如启用播客，补齐 DeepSeek、MiniMax、OSS 相关环境变量

### 启动服务

```bash
npm start
```

默认地址：

```text
http://localhost:3000
```

## API 能力概览

- 认证：`/api/auth/login`
- 关键词：`/api/keywords*`
- 新闻：`/api/news*`
- 工具：`/api/tools*`, `/api/tools/categories`
- 统计与设置：`/api/stats`, `/api/settings`
- 访问追踪与安全：`/api/visit/*`, `/api/banned-ips*`, `/api/api-calls/stats`
- 归档与模板：`/api/archive/*`, `/api/news/template`
- AI 与报告：`/api/ai/chat`, `/api/reports*`
- 播客：
  - `GET /api/podcast/news/:date`
  - `GET /api/podcast/news/:date/audio`
  - `POST /api/podcast/news/:date/generate`
  - `GET /api/podcast/minimax/tasks/:taskId`

## 自动化脚本

- 播客自动生成：
  - `npm run podcast:autogen:once`
  - `npm run podcast:autogen:cron:install`
- 微信公众号草稿自动上传：
  - `npm run wechat:autogen:once`
  - `npm run wechat:autogen:cron:install`

微信公众号自动上传任务当前行为：

- 仅处理 `Asia/Shanghai` 当天内容
- 日报来源固定为 `/var/www/json/report/YYYY-MM-DD.json`
- 播客来源固定为 `data/podcasts/news/YYYY-MM-DD.json`
- 自动把日报 JSON 转成 Markdown 中间稿，再发布到公众号草稿箱
- 同时支持当天播客文章草稿
- 可选开启当天播客音频自动发送：先上传语音素材，再按 `WECHAT_AUTOGEN_AUDIO_SEND_MODE` 执行 `preview` 或 `sendall`
- 不会回退使用前一天或更早内容

## 活跃文档入口

以下文档是当前维护中的可信入口：

1. `README.md`
   当前项目总入口与产品范围说明
2. `docs/PRODUCT.md`
   当前产品文档与能力边界
3. `CHANGELOG.md`
   发布记录与版本说明
4. `RUN_GUIDE.md`
   本地运行与常用操作
5. `API_CONTRACT.md`
   API 契约说明
6. `docs/PODCAST_SERVER_ALIGNMENT.md`
   播客“服务器优先”规则
7. `docs/PODCAST_GENERATION_PIPELINE.md`
   播客正式生成链路
8. `docs/archive/legacy/README.md`
   历史文档索引，不作为当前实现依据

## 文档治理规则

- 活跃入口文档只记录当前可验证状态
- 历史方案、已下线结构和旧版说明统一收敛到 `docs/archive/legacy/`
- 如果代码、服务器行为与文档冲突：
  - 播客链路以服务器为准
  - 其余模块以当前 `main` 分支已验证实现为准

## 发布说明

- 当前发布版本：`0.2.0`
- 当前版本聚焦：
  - 收敛活跃文档入口，降低文档漂移
  - 明确 AI 工具集的静态目录实现
  - 固化播客链路与服务器优先规则
  - 同步本地、GitHub 与服务器代码面状态
