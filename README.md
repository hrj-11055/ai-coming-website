# AIcoming Website

AIcoming 是一个 AI 资讯聚合与管理系统，包含前台展示页面和后台管理 API。

当前阶段目标是：
1. 以 `JSON 文件存储` 为唯一运行主线，优先保证稳定和交付速度。
2. 完成前后端重构与模块化，降低维护成本。
3. 在数据规模增大后，再切换到 MySQL。
4. MySQL 切换时使用 `npm run start:mysql`，并通过 `npm run db:migrate` 迁移数据。

## 当前技术策略（重要）

1. 当前开发与部署主线：`server-json.js`
2. MySQL 暂不进入本轮重构，仅保留迁移可能性。
3. 所有新功能优先在 JSON 主线落地。

## 项目目标

1. 展示每日 AI 快讯、热点关键词和工具目录。
2. 提供管理员登录、内容管理、统计、数据导入/归档能力。
3. 支持从外部 JSON 报告自动同步并上线展示。

## 当前架构

### 前端

- 页面：`index.html`, `news.html`, `admin-login.html`, `admin-analytics.html`, `admin-ipban.html`
- 样式：`styles.css`
- 前端逻辑（模块入口）：`frontend/bootstrap.js`
- 前端核心模块：`frontend/modules/*`（含 `state/api-client/news-service/*-controller/*-view`）
- 兼容旧逻辑：`main.js`（历史文件，逐步迁移）
- API 客户端：`api.js`

### 后端

- 主后端（当前唯一主线）：`server-json.js`
- 备选后端（本轮不改主线）：`server-mysql.js`
- 数据文件：`data/*.json`

### 数据与脚本

- 数据目录：`data/`
- 常用脚本：`run.sh`, `start.sh`, `server-sync.sh`, `setup-server-sync.sh`, `sync-*.sh`

## 启动方式（JSON-only）

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

```bash
cp .env.example .env
```

至少配置：
- `JWT_SECRET`
- 模型 API Key（如 `SILICONFLOW_API_KEY`, `QWEN_API_KEY`）

### 3) 启动服务

```bash
npm start
```

或：

```bash
./run.sh
```

服务默认地址：`http://localhost:3000`

## API 能力概览（当前以 JSON 主线为准）

- 认证：`/api/auth/login`
- 关键词：`/api/keywords*`
- 新闻：`/api/news*`, `/api/news/dates`, `/api/news/date/:date`
- 工具：`/api/tools*`, `/api/tools/categories`
- 统计与设置：`/api/stats`, `/api/settings`
- 访问追踪与 IP 管理：`/api/visit/*`, `/api/banned-ips*`, `/api/api-calls/stats`
- 归档与模板：`/api/archive/*`, `/api/news/template`
- 报告与 AI 调用：`/api/reports*`, `/api/ai/chat`

## 当前主要技术债（重构重点）

1. `main.js` 体量过大（单文件多职责）。
2. `server-json.js` 体量过大（单文件过多路由/逻辑）。
3. 前端页面依赖 CDN（Tailwind/Alpine/FA），网络波动会引发样式退化。
4. 同步脚本使用 `pkill + nohup`，缺少标准进程管理和健康检查闭环。
5. 文档多且分散，存在历史信息。

## 重构方向（本轮）

1. 先重构 JSON 主线，不做 MySQL 能力补齐。
2. 后端拆分 `routes/services/middleware`，保持 API 行为兼容。
3. 前端拆分 `main.js` 为模块，减少全局变量耦合。
4. 固化样式 fallback 策略，降低外部 CDN 依赖风险。
5. 同步链路增加失败退出码、健康检查和日志规范。

## 推荐文档

1. `RUN_GUIDE.md`
2. `API_CONTRACT.md`
3. `BASELINE_CHECKLIST.md`
4. `REFACTOR_PLAN_DAILY.md`
5. `docs/archive/legacy/README.md`（历史文档索引）

## 维护说明

- `data/` 包含运行时数据，提交前确认是否应纳入版本控制。
- `.env` 含敏感配置，不要上传到公开仓库。
- 如果本地页面样式异常，优先检查 CDN 与代理连通性。

---

本轮重构以“快速交付 + 稳定可用”为优先，不引入新的基础设施复杂度。
