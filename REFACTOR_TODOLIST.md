# Code Refactor ToDo List (JSON Mainline)

目标：以 `server-json.js` 为唯一主线完成可维护性重构，确保行为兼容、可回滚、可验证。

## P0 - 先做（安全与基线）

- [x] 建立重构分支与提交规范（小步提交，每步可回滚）。
- [x] 固化运行基线命令与验收命令（`npm start` + 核心 API smoke test）。
- [ ] 轮换已暴露/疑似泄露的 API Key，并更新 `.env`。（已完成文档脱敏，真实 key 轮换待执行）
- [x] 修复路径安全问题（`/api/archive/:date` 增加严格白名单校验）。
- [x] 给核心接口补最小回归测试（auth/news/settings/archive）。

## P1 - 后端结构化拆分

- [x] 拆分 `server-json.js` 中的 `visit` 模块到 `server/routes/visit.js`。
- [x] 拆分 `banned-ips` 与 `api-calls` 到独立 route/service。
- [x] 拆分 `tools` 与 `weekly-news` 到独立 route/service。
- [x] 提取统一的 `fileStore`（读写、锁、错误处理、路径校验）。
- [x] 引入统一错误响应中间件（错误码、message、日志格式统一）。
- [x] 统一参数校验（limit/page/date/type 等）并添加默认值策略。

## P1 - 数据文件治理

- [x] 统一历史日报命名规范（只保留一种：`news-YYYY-MM-DD.json`）。
- [x] 编写一次性数据清理脚本（合并重复日期文件，保留可追溯日志）。
- [x] 为 `data/` 增加备份与恢复脚本（按日期快照）。
- [x] 明确 `data/` 目录的源数据优先级（current vs archive vs imported）。

## P2 - 前端重构

- [ ] 拆分 `main.js`：timeline/news/keywords/archive/ui-state 模块化。
- [ ] 统一 API 调用方式（避免 `window.apiService` 与裸 `fetch` 混用）。
- [ ] 保留旧全局函数兼容层（过渡期），避免页面事件失效。
- [ ] 增加页面级 smoke 测试（`news.html` 时间轴/筛选/详情）。

## P2 - 脚本与运维清理

- [x] 合并重复脚本：保留主同步脚本，移除旧 `fixed` 兼容脚本。
- [x] 合并重复脚本：保留主 setup 脚本，移除旧 `fixed` 兼容脚本。
- [x] 标记或归档失效脚本入口（引用不存在脚本的 setup 文档/脚本）。
- [ ] 统一同步脚本日志路径、退出码与健康检查输出格式。

## P2 - 文档收敛

- [ ] 维护唯一入口文档：`README.md` + `RUN_GUIDE.md` + `API_CONTRACT.md`。
- [ ] 将历史文档索引固定到 `docs/archive/legacy/README.md`。
- [ ] 新增“JSON 主线开发约定”文档（目录规范、命名规则、测试要求）。
- [ ] 每次接口变更同步更新 `API_CONTRACT.md` 与迁移说明。

## P3 - MySQL 迁移准备（暂不切换）

- [ ] 保持 `npm run start:mysql` 仅用于迁移验证，不作为默认启动。
- [ ] 持续维护 `scripts/migrate-data.js`（支持增量迁移与幂等）。
- [ ] 定义迁移触发阈值（并发冲突、查询延迟、数据规模、部署形态）。
- [ ] 准备迁移演练清单（备份、迁移、核对、回滚）。

## Definition of Done（每阶段）

- [ ] 代码通过 lint/基本测试（或记录无法执行原因）。
- [ ] 关键页面与关键 API 验收通过。
- [ ] 文档已同步更新。
- [ ] 有明确回滚点（commit/tag）。
