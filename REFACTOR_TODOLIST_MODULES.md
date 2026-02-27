# 前后端拆分与模块化 ToDoList（JSON 主线）

## P0 基线冻结与防回归

- [x] 冻结 API 合同基线（`API_CONTRACT.md`）。
- [x] 冻结页面行为基线（`news.html` 核心流程保留）。
- [x] 建立阶段回滚策略（分阶段文件拆分，保留兼容桥接）。
- [ ] 补充 smoke 覆盖点文档到 `scripts/smoke-json.js` 配套说明。

## P1 后端路由拆分（完成）

- [x] `GET /api/stats` -> `server/routes/stats.js`
- [x] `GET /api/backup`, `POST /api/restore` -> `server/routes/maintenance.js`
- [x] `/api/archive/*` -> `server/routes/archive.js`
- [x] `GET /api/news/template` -> `server/routes/template.js`
- [x] `POST /api/ai/chat` -> `server/routes/ai.js`
- [x] `GET /api/reports*` -> `server/routes/reports.js`
- [x] AI 配置/提示词读取抽到 `server/services/ai-proxy.js`
- [x] `server-json.js` 收敛为装配层（初始化 + mount + listen）

## P2 前端 ES Module 化（本轮完成核心）

- [x] 新建模块目录：`frontend/modules/*`
- [x] 新建模块入口：`frontend/bootstrap.js`
- [x] `news.html` 切换为 `type="module"` 入口加载
- [x] 新建兼容桥接：`frontend/modules/compat-globals.js`（保留历史 `onclick`）
- [x] 主逻辑迁移到 `frontend/modules/core-news.js`
- [x] 修复模块语法冲突（重复 `formatDate`）
- [ ] 将 `core-news.js` 继续按 `news/timeline/render/keywords` 进一步物理拆文件
- [ ] `index.html` 的 AI 搜索内联脚本模块化（当前仍内联）

## P3 文档与收口

- [x] 更新 `README.md`（模块入口与目录说明）
- [x] 更新 `RUN_GUIDE.md`（模块化调试入口）
- [x] 更新 `API_CONTRACT.md`（声明外部 contract 无变化）
- [ ] 增补模块边界图（建议：`docs/` 新增结构图）

## 验收清单

- [ ] `npm run test:smoke:json`
- [ ] 手动回归 `index.html`、`news.html`、`admin-login.html`
- [ ] API 抽测：`/api/stats`、`/api/archive/dates`、`/api/ai/chat`、`/api/reports`

## 风险与备注

- 风险：`news.html` 仍依赖内联事件，需保持 `compat-globals` 完整导出。
- 风险：`core-news.js` 仍较大，后续需继续细拆以降低耦合。
- 备注：本次未改 MySQL 主线与任何公开 API 路径/字段。
