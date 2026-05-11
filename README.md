# AIcoming Website

> AI 资讯、工具、能力库 — 每日自动生成播客与公众号内容

当前版本：**0.2.0**

AIcoming 是一个面向真实工作流的 AI 内容门户，提供以下核心能力：

- **AI 资讯** — 每日 AI 新闻聚合、热点关键词、口播播客
- **AI 工具集** — 按场景分类的 AI 工具目录，区分国内外生态
- **AI 能力库** — 精选 AI Agent Skills 与 MCP Server 目录
- **AI 搜索** — 首页搜索入口与提示词辅助
- **后台运维** — 管理 API、数据导入、自动化内容生成链路

## 快速开始

### 环境要求

- Node.js 22.22.0
- npm 10.9.4

### 安装

```bash
git clone https://github.com/hrj-11055/ai-coming-website.git
cd ai-coming-website
npm install
```

### 配置

```bash
cp .env.example .env
```

最小可运行配置只需设置 `JWT_SECRET`。如需播客、微信等功能，参考 `.env.example` 补齐对应 API Key。

### 启动

```bash
npm start          # 生产模式
npm run dev        # 开发模式（nodemon 热重载）
```

访问 http://localhost:3000

### 默认管理员

```
用户名: admin
密码: admin123456
```

登录入口：http://localhost:3000/admin-login.html

## 页面一览

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/index.html` | AI 搜索入口、品牌展示、热门关键词 |
| AI 资讯 | `/news.html` | 每日新闻、关键词云、播客播放 |
| AI 工具集 | `/tools.html` | 分类工具目录，区分国内/国外 |
| AI 能力库 | `/skills.html` | 精选 Skills 与 MCP Server |
| 能力详情 | `/skill-detail.html` | 单个 Skill 展示 |
| MCP 详情 | `/mcp-detail.html` | 单个 MCP Server 展示 |
| 关于我们 | `/about.html` | 公司介绍与联系方式 |
| 管理登录 | `/admin-login.html` | 后台登录 |
| 流量统计 | `/admin-analytics.html` | 地域分布与访问统计 |
| IP 封禁 | `/admin-ipban.html` | 安全治理 |
| AI 用量 | `/admin-ai-usage.html` | AI 调用成本统计 |

## 核心自动化链路

### 每日播客生成

每日播客由上游日报触发，全自动完成：

1. **07:02** 上游 RSS 服务抓取 AI 新闻，生成日报 JSON
2. **~07:10** 网站导入日报，自动触发播客生成
3. **DeepSeek** 生成口播稿 → **MiniMax** 异步 TTS 生成音频
4. 音频上传阿里云 OSS，播客状态变为 `ready`
5. 播客就绪后自动发送邮件通知

用户可在 AI 资讯页直接收听当日播客。

### 微信公众号（历史兼容）

仓库保留了微信公众号草稿自动上传脚本，当前默认关闭。开启后会自动将日报和播客内容发布到公众号草稿箱。

### 每周关键词

每周一自动从最近 7 天日报中提取热点关键词，更新首页关键词云。

## API 概览

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/keywords` | 关键词云数据 |
| GET | `/api/news` | 每日新闻列表 |
| GET | `/api/news/:date` | 指定日期新闻 |
| GET | `/api/weekly-news` | 周报新闻 |
| GET | `/api/tools` | AI 工具列表 |
| GET | `/api/tools/categories` | 工具分类 |
| GET | `/api/reports/:date` | 日报内容 |
| GET | `/api/podcast/news/:date` | 播客元数据 |
| GET | `/api/podcast/news/:date/audio` | 播客音频 |
| POST | `/api/visit/track` | 访问埋点 |
| POST | `/api/interaction/track` | 交互事件埋点 |
| POST | `/api/ai/chat` | AI 聊天代理 |

### 需要认证的接口

所有 POST/PUT/DELETE 操作需要 `Authorization: Bearer <token>` 头。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 管理员登录 |
| POST | `/api/podcast/news/:date/generate` | 触发播客生成 |
| GET | `/api/visit/province-stats` | 省份统计 |
| GET | `/api/visit/logs` | 访问日志 |
| GET | `/api/ai-usage/summary` | AI 用量汇总 |
| GET | `/api/ai-usage/daily` | AI 每日用量 |
| GET | `/api/banned-ips` | IP 封禁列表 |
| POST | `/api/news/batch` | 批量导入新闻 |
| GET | `/api/stats` | 站点统计 |

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js + Express |
| 前端 | 原生 JavaScript (ES6+)，无框架 |
| 存储 | JSON 文件存储（默认），MySQL 可选 |
| AI | DeepSeek（播客稿）、MiniMax（TTS）、SiliconFlow/千问（首页搜索） |
| 音频存储 | 阿里云 OSS（可回退本地） |
| 部署 | Linux 服务器 + PM2 |

## 运维脚本

```bash
# 播客
npm run podcast:autogen:once          # 手动触发一次播客生成
npm run podcast:autogen:cron:install  # 安装播客定时任务
npm run podcast:audit:server          # 审计服务器播客状态

# 微信公众号
npm run wechat:autogen:once           # 手动触发一次微信草稿上传
npm run wechat:autogen:cron:install   # 安装微信定时任务

# 每周关键词
npm run weekly:keywords:once          # 手动触发一次关键词生成
npm run weekly:keywords:cron:install  # 安装关键词定时任务

# 数据维护
npm run data:backup                   # 备份所有 JSON 数据
npm run data:restore                  # 恢复备份
npm run check:assets                  # 检查 logo 路径

# 测试
npm run test:smoke:json               # JSON 运行时冒烟测试
node --test tests/                    # 运行单元测试
```

## 项目结构

```
ai-coming-website/
├── server-json.js           # 默认启动入口
├── server/
│   ├── app.js               # Express 应用创建
│   ├── runtime.js           # JSON 运行时装配
│   ├── start.js             # HTTP 监听
│   ├── routes/              # 16 个路由模块
│   └── services/            # 14 个服务模块
├── frontend/
│   ├── index-page.js        # 首页入口
│   ├── bootstrap.js         # 新闻页引导
│   ├── tools-page.js        # 工具页入口
│   ├── skills-page.js       # 能力库入口
│   └── modules/             # 共享前端模块
├── data/                    # JSON 数据文件（运行时）
├── config/                  # 提示词与配置
├── scripts/                 # 运维与定时任务脚本
├── tests/                   # 单元测试
├── docs/                    # 项目文档
├── pic/                     # 图片资源
└── *.html                   # 页面文件
```

## 文档索引

| 文档 | 说明 |
|------|------|
| `README.md` | 本文件 — 项目总入口 |
| `docs/DEVELOPER_MANUAL.md` | 开发者手册 |
| `docs/PRODUCT.md` | 产品范围与能力边界 |
| `docs/PODCAST_GENERATION_PIPELINE.md` | 播客生成链路详解 |
| `docs/SCHEDULED_TASKS_FLOW.md` | 定时任务与数据流 |
| `CHANGELOG.md` | 版本变更记录 |
| `API_CONTRACT.md` | API 契约基线 |
| `.env.example` | 环境变量模板 |

## 许可证

MIT
