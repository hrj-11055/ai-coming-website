# JSON 主线重构计划（按天）

本计划仅针对 `server-json.js` 主线，不包含 MySQL 迁移。

## Day 1 - 基线冻结与风险清单

1. 冻结当前可运行基线（启动方式、核心页面、关键 API）。
2. 产出 API 清单与页面功能对照表。
3. 标记高风险模块（新闻、词云、同步脚本、认证）。
4. 验收：`index.html`、`news.html`、`/api/news`、`/api/health` 可用。

## Day 2 - 后端骨架拆分（不改行为）

1. 从 `server-json.js` 拆出 `app` 初始化与公共中间件。
2. 新建目录：`server/routes`, `server/services`, `server/middleware`, `server/utils`。
3. 只做搬迁，不改业务规则。
4. 验收：接口响应与 Day 1 一致。

## Day 3 - 认证与设置模块

1. 拆分 `auth`、`settings` 路由。
2. 统一错误处理与响应格式。
3. 增加最小输入校验。
4. 验收：登录、设置读取与更新可用。

## Day 4 - 关键词与新闻模块

1. 拆分 `keywords`、`news` 路由与服务。
2. 保持历史接口兼容（含 `news/dates` 与 `news/date/:date`）。
3. 清理重复逻辑与数据转换。
4. 验收：`news.html` 时间轴、筛选、详情展示正常。

## Day 5 - 每周资讯与工具模块

1. 拆分 `weekly-news`、`tools` 相关接口。
2. 保持导入/批量接口行为一致。
3. 验收：管理端导入和前台展示一致。

## Day 6 - 访问追踪与安全模块

1. 拆分 `visit`、`banned-ips`、`api-calls` 模块。
2. 增加限流与封禁策略配置化。
3. 验收：统计页可用，封禁流程可验证。

## Day 7 - 同步脚本稳定化

1. 重构 `server-sync.sh`：参数化目录、严格错误码（旧 `fixed` 兼容脚本已删除）。
2. 同步后执行健康检查，失败直接退出。
3. 验收：可重复执行、失败可观测、日志可追溯。

## Day 8 - 前端主文件拆分

1. 按功能拆分 `main.js`：关键词、新闻、筛选、时间轴、工具搜索。
2. 保持全局函数兼容（避免页面内联事件失效）。
3. 验收：页面功能不回退，主文件体积下降。

## Day 9 - UI 稳定性与样式兜底

1. 完善 CDN 失败 fallback（`news.html`、`index.html`）。
2. 修复固定导航、响应式断点、样式冲突问题。
3. 验收：网络波动下页面仍可用，布局不塌。

## Day 10 - 清理与交付

1. 清理废弃代码与过时文档。
2. 补最小回归脚本（auth/news/settings/visit）。
3. 更新 README、运行手册、重构记录。
4. 验收：新同学可按文档 30 分钟内跑通。

## 每日执行规则

1. 每天开始前先跑一次基线检查（启动 + 关键页面 + 关键 API）。
2. 每天只做一个主题，避免跨域修改过多。
3. 每天结束必须有：代码、文档、验收记录。
4. 每天提交粒度保持可回滚。

## 每日最小验收命令（建议）

```bash
npm run start:legacy
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/news | head
curl -s http://localhost:3000/api/news/dates | head
```
