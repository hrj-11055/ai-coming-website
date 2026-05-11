# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIcoming — AI 资讯、工具、能力库门户。JSON 文件存储为主线的 Node.js + Express + 原生 JS 项目。

**Version**: 0.2.0 | **Node**: 22.22.0 | **npm**: 10.9.4

## Commands

```bash
npm start                          # 启动 JSON 运行时
npm run dev                        # nodemon 热重载

node --test tests/                 # 全部单元测试
node --test tests/podcast-script.test.mjs  # 单个测试

npm run test:smoke:json            # JSON 运行时冒烟测试
npm run podcast:audit:server       # 播客服务器审计
npm run data:backup                # 备份 JSON 数据
npm run check:assets               # 检查资源文件路径

npm run weekly:keywords:once       # 手动触发周关键词生成
npm run podcast:autogen:once       # 手动触发播客生成
npm run wechat:autogen:once        # 手动触发微信草稿上传
```

Default: http://localhost:3000 | Admin: `admin` / `admin123456` (`.env`)

## Architecture

### Runtime Chain

```
server-json.js → server/runtime.js → server/app.js + routes/* + services/* → server/start.js
```

- `server/runtime.js` — 校验 JWT_SECRET，创建数据目录，初始化 JSON 文件，挂载全部路由与服务，启动调度器
- `server/app.js` — Express 创建，cors/json 中间件，静态文件托管
- `server/start.js` — HTTP 监听

### Backend

16 route modules in `server/routes/`, 14 service modules in `server/services/`. Routes use factory functions: `createXxxRouter({ service, authenticateToken })`.

New routes not in older docs: `interaction.js` (event tracking), `ai-usage.js` (AI cost stats).

### Frontend

HTML pages + vanilla JS entrypoints. No framework.

**Critical design decisions:**
- Tools page (`tools.html`) and Skills page (`skills.html`) render from **frontend static data** (`frontend/modules/tools-catalog.js`, `frontend/modules/skills-catalog.js`), NOT from backend API or `data/*.json`. Editing `data/tools.json` does NOT change the tools page display.
- News page uses modular bootstrap: `bootstrap.js` → `frontend/modules/*` (state, views, controllers)
- Tracking: `visit-tracker.js` (page visits), `interaction-tracker.js` (interaction events)

### Data

JSON file storage via `server/services/file-store.js` (cache + periodic flush). Data directory `data/` auto-initialized on first run.

Podcast metadata per date: `data/podcasts/news/YYYY-MM-DD.json`. Status flow: `pending` → `script_ready` → `processing` → `ready`.

## Linux Server Deployment

Developed on macOS, deployed to Linux. **All code must be Linux-compatible.**

| | Value |
|---|---|
| Host | `8.135.37.159` |
| Path | `/var/www/ai-coming-website` |
| User | `root` |
| Sync | GitHub push → `ssh root@8.135.37.159 "cd /var/www/ai-coming-website && git pull"` |
| Process | PM2 |

### Full Deployment Loop (default)

Unless user says "local only", complete the full loop for each feature:

1. Implement + verify locally
2. Check server for drift or divergent code
3. Commit + push to GitHub
4. Pull on server + restart PM2
5. Verify on server before marking done

**Do not overwrite** on server: `.env`, `data/` runtime JSON, generated audio, logs, backups.

### Linux Compatibility

- Paths: forward slashes only
- Shell scripts: must use LF line endings (`dos2unix` before deploying any `.sh`)
- Case-sensitive filesystem
- Executable scripts: `chmod +x`

## Podcast Pipeline (Server-First)

The podcast pipeline source of truth is the Linux server, not local.

- Input: `/var/www/json/report/YYYY-MM-DD.json`
- Script: DeepSeek `deepseek-v4-pro` (thinking mode disabled)
- TTS: MiniMax `speech-2.8-turbo`, voice `male-qn-jingying`, async `t2a_async_v2`
- Timeout: `600000ms`
- Audio: download → extract from archive → upload OSS (local fallback if no OSS)
- Auto-triggered by news import (`setImmediate` in `server/routes/news.js`), not by a cron scanner

**Verification order**: server files → live API → local tests.

Run `npm run podcast:audit:server` before claiming local matches production.

Reference: `docs/PODCAST_GENERATION_PIPELINE.md`

## Scheduled Tasks

**In-process**: weekly keywords scheduler (every 5 min check), security data cleanup (hourly).

**External cron**: podcast email retry, weekly keywords (Mon 08:00). Wechat autogen and podcast autogen scanners are legacy — default `disabled`, kept for troubleshooting only.

Daily timeline: `07:02` upstream RSS → `~07:09` daily report ready → `~07:10` import triggers podcast → `~07:35` podcast ready → email sent.

Reference: `docs/SCHEDULED_TASKS_FLOW.md`

## Key Patterns

- **Auth**: JWT Bearer token (24h validity). Middleware `authenticateToken` injected into route factories.
- **Data operations**: Use `file-store.js` cache layer, not raw `fs.readFileSync`.
- **Route factory pattern**: All route modules export factory functions receiving dependencies, not creating them.
- **Backend**: CommonJS. **Frontend**: ES6 modules.

## Documentation Map

| Doc | Purpose |
|-----|---------|
| `README.md` | User-facing project entry |
| `docs/DEVELOPER_MANUAL.md` | Developer reference (architecture, API, deployment) |
| `docs/PRODUCT.md` | Product scope and boundaries |
| `docs/PODCAST_GENERATION_PIPELINE.md` | Podcast pipeline details |
| `docs/SCHEDULED_TASKS_FLOW.md` | Cron jobs and data flow |
| `CHANGELOG.md` | Version history |
| `API_CONTRACT.md` | API contract baseline |
| `.env.example` | Environment variable template |
| `docs/guides/` | Feature-specific guides (IP ban, sync, etc.) |
| `docs/archive/` | Historical/planning docs — not authoritative |
