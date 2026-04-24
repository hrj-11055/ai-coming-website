# AIcoming 项目开发者手册与服务器对齐审计

最后更新：2026-04-08

这份文档的目标不是重复旧 README，而是给新开发者一份可以直接落地的“当前真实状态”说明。内容基于：

- 本地仓库实际文件结构
- 线上服务器 `/var/www/ai-coming-website` 的直接 SSH 核对
- `npm run podcast:audit:server` 的服务器优先审计输出
- 2026-04-08 的本地/服务器 Git 与文件哈希比对结果

如果后续文档和代码冲突，以代码和服务器实测为准。

## 1. 当前结论

### 1.1 当前主线

- 当前主线运行时是 JSON Runtime，不是 MySQL。
- 启动入口是 `server-json.js`，再委托给 `server/runtime.js`。
- `server-mysql.js` 仍然保留，但属于可选迁移/兼容路径，不是默认运行方式。
- 播客链路必须以服务器为准，本地只能算开发副本。

### 1.2 服务器与本地是否一致

结论：**不完全一致**。

更准确地说，有三层状态：

1. 播客 canonical 文件当前与服务器一致。
2. About / Skills / MCP 这批页面的当前工作树内容大体一致，但双方 Git 基线不同。
3. WeChat / MiniMax / Skills 测试链路存在明确漂移，服务器和本地不是同一份代码快照。

### 1.3 这次审计最重要的发现

- 本地 `HEAD` 是 `6555240`，服务器 `HEAD` 是 `338cedb`，分支名都叫 `codex/about-page-sync`，但提交不同。
- 本地跟踪文件数 `397`，服务器跟踪文件数 `392`，说明文件集合已经漂移。
- 播客 5 个 canonical 对象中，4 个代码/配置文件哈希一致；`.env` 只存在于服务器，本地没有副本。
- 代码/脚本/前端/测试/文档这类“可部署作用域”里，一共比较了 `150` 个共享文件，发现 `8` 个当前内容漂移文件。
- 本地当前没有 `node_modules/`，所以依赖 `dotenv` 的脚本/测试不能直接跑通。
- 服务器 `npm run test:smoke:json` 通过，说明线上 JSON 主线至少在 auth/news/settings/archive/podcast 基础链路上可用。

## 2. 项目真实结构

### 2.1 顶层职责

- `server-json.js`
  默认启动入口，只做 `.env` 加载和 JSON Runtime 启动。
- `server/`
  Express 应用、路由、服务、鉴权、中间件、启动器。
- `frontend/`
  站点页面对应的前端入口与模块。
- `data/`
  JSON 数据文件、归档、播客 metadata。
- `scripts/`
  一次性运维脚本、定时任务安装脚本、审计/验证脚本。
- `config/`
  提示词和运行配置文件。
- `tests/`
  Node 内置测试。
- `docs/`
  当前文档与历史记录。

### 2.2 后端运行链路

实际调用链：

```text
server-json.js
  -> server/runtime.js
    -> server/app.js
    -> server/routes/*
    -> server/services/*
    -> server/start.js
```

运行时关键点：

- `server/app.js`
  负责创建 Express、挂 `cors()`、`express.json()`，并按 `STATIC_ROOT` 决定是否托管静态文件。
- `server/runtime.js`
  负责：
  - 校验 `JWT_SECRET`
  - 创建 `data/`、`archive/`、`podcasts/`、`logos/`
  - 初始化 JSON 数据文件
  - 装配全部路由与服务
  - 启动 weekly keywords 调度器
  - 启动 file-store cache scheduler
- `server/start.js`
  最终监听 `HOST` / `PORT`。

### 2.3 路由模块

当前 `server/routes/` 下有 14 个路由模块，合计 47 个显式 HTTP 端点：

| 路由文件 | 主要职责 | 端点数 |
| --- | --- | ---: |
| `auth.js` | 管理员登录 | 1 |
| `settings.js` | 站点设置读写 | 2 |
| `keywords.js` | 关键词 CRUD + weekly refresh | 6 |
| `news.js` | 每日资讯 CRUD / 日期维度读取 / 批量导入 | 7 |
| `visit.js` | 访问追踪 / 省份统计 / 日志清理 | 4 |
| `security.js` | IP 封禁 / API 调用统计 | 5 |
| `tools.js` | AI 工具目录与分类 | 8 |
| `stats.js` | 总体统计 | 1 |
| `maintenance.js` | 备份 / 恢复 | 2 |
| `archive.js` | 归档日期、归档读取、归档删除 | 3 |
| `template.js` | 今日资讯模板 | 1 |
| `ai.js` | AI 代理聊天接口 | 1 |
| `reports.js` | 日报文件读取 | 2 |
| `podcast.js` | 播客状态、生成、音频、MiniMax 任务查询 | 4 |

### 2.4 服务层

当前 `server/services/` 的核心职责：

- `file-store.js`
  JSON 文件缓存读写与定时刷盘。
- `ai-proxy.js`
  系统 prompt 加载、AI API 配置构建。
- `weekly-keywords.js`
  周关键词生成任务。
- `podcast-script.js`
  从日报 JSON 生成播客口播稿。
- `news-podcast.js`
  播客 metadata、MiniMax 异步 TTS、音频下载、OSS 上传。
- `minimax-audio.js`
  MiniMax 文件下载与音频缓冲解析。
- `wechat-content.js`
  微信稿件与播客摘要文本生成。
- `wechat-podcast-formatter.js`
  微信播客稿格式化。
- `wechat-publisher.js`
  微信草稿/语音发布。
- `podcast-alignment.js`
  播客服务器优先对齐规则与 canonical 文件定义。

## 3. 前端页面与入口

当前仓库里实际存在的公共页面：

| 页面 | 入口 |
| --- | --- |
| `index.html` | `frontend/index-page.js` |
| `news.html` | `frontend/bootstrap.js` |
| `tools.html` | `frontend/tools-page.js` |
| `skills.html` | `frontend/skills-page.js` |
| `skill-detail.html` | `frontend/skill-detail-page.js` |
| `mcp-detail.html` | `frontend/mcp-detail-page.js` |
| `about.html` | inline script |
| `admin-login.html` | inline script |
| `admin-analytics.html` | inline script |
| `admin-ipban.html` | inline script |

需要特别注意：

- **`practice.html` 当前并不存在。**
- 旧文档里仍然提到 `practice.html`，但仓库当前测试 `tests/navigation-links.test.mjs` 已经把它视为“应当移除”的页面。
- 也就是说，旧文档和当前代码之间已经有文档漂移，后续不要再把 `practice.html` 当成现行页面。

新闻页模块化结构：

- `frontend/modules/news-page-init.js`
- `frontend/modules/core-news.js`
- `frontend/modules/history-controller.js`
- `frontend/modules/filters-controller.js`
- `frontend/modules/keywords-controller.js`
- `frontend/modules/timeline-view.js`
- `frontend/modules/articles-view.js`
- `frontend/modules/outline-view.js`
- `frontend/modules/stats-view.js`
- `frontend/modules/state.js`
- `frontend/modules/api-client.js`
- `frontend/modules/news-service.js`
- `frontend/modules/compat-globals.js`

访问统计：

- `frontend/modules/visit-tracker.js` 已被 `skills-page.js`、`skill-detail-page.js` 和新闻页模块调用。
- 这说明访问埋点不只在首页/新闻页，技能页也在打点。

## 4. 数据与定时任务

### 4.1 JSON 数据

当前运行依赖的核心 JSON 文件：

- `data/admins.json`
- `data/keywords.json`
- `data/news.json`
- `data/weekly-news.json`
- `data/tools.json`
- `data/tool-categories.json`
- `data/visit-logs.json`
- `data/api-calls.json`
- `data/banned-ips.json`
- `data/settings.json`
- `data/keywords-weekly-job.json`
- `data/podcasts/news/*.json`

### 4.2 归档

- 每日资讯归档目录：`data/archive/daily/`
- `server/runtime.js` 中的 `archiveOldNews()` 会按日期把非今日新闻移入归档。

### 4.3 调度模型

当前项目有两类调度：

1. **Web 进程内调度**
   - weekly keywords scheduler
   - file-store cache scheduler

2. **Web 进程外调度**
   - `scripts/run-podcast-autogen-once.js`
   - `scripts/run-wechat-autogen-once.js`
   - `scripts/run-weekly-keywords-once.js`
   - 对应 `.sh` 和 `setup-*-cron.sh`

播客长期记忆规则依然成立：

- 正式日报输入目录：`/var/www/json/report/YYYY-MM-DD.json`
- 播客自动生成由 cron 驱动的扫描器触发，不内嵌在 Web 进程内
- MiniMax 异步 TTS 的安全超时基线是 `600000ms`

## 5. 开发与部署规则

### 5.1 本地开发前提

标准本地启动前，需要至少具备两件事：

1. 安装依赖
2. 配置 `.env`

这次审计时，本地环境状态是：

- `node_modules/` 不存在
- `.env` 不存在

所以当前本地仓库**不是立即可运行状态**，需要先补环境。

### 5.2 常用命令

```bash
npm install
npm start
npm run dev
node --test tests/
npm run test:smoke:json
npm run podcast:audit:server
npm run audit:server:local
```

### 5.3 Linux 部署约束

部署目标：

- Host: `8.135.37.159`
- Path: `/var/www/ai-coming-website`
- OS: Linux
- Sync: `mutagen.yml`

这次核对到的脚本状态：

- 本地与服务器上的 `scripts/*.sh` 都是 `LF` 且可执行
- `run.sh` 也是 `LF` 且可执行
- 但仓库里另有一个 tracked 的 `start.sh`，本地与服务器两边都是 `CRLF`

因此：

- 现在线上常用的 cron / 运维脚本没有 `^M` 风险
- 但如果以后重新启用 `start.sh`，必须先转成 `LF`

### 5.4 Mutagen 注意事项

`mutagen.yml` 当前配置是 `two-way-resolved`，并且忽略：

- `/.env`
- `/node_modules`
- `package-lock.json`
- `/logs`
- 多类顶层旧文档模式

这意味着：

- 服务器 `.env` 不会自动同步回本地
- 依赖安装状态也不会通过 Mutagen 对齐
- 仅看“文件有没有同步过”并不能说明“服务器是否和本地完全一致”

## 6. 服务器优先对齐规则

### 6.1 播客链路必须先看服务器

`docs/PODCAST_SERVER_ALIGNMENT.md` 仍然有效。播客链路的固定核对顺序是：

1. 服务器文件与服务器 `.env`
2. 线上 `GET /api/podcast/news/:date`
3. 线上 `POST /api/podcast/news/:date/generate`
4. 本地单测与本地 smoke

### 6.2 新增的仓库级审计命令

为了避免以后继续手工拼 SSH 命令，这次新增了：

```bash
npm run audit:server:local
```

对应脚本：

- `scripts/audit-server-local-drift.js`

这个脚本会输出：

- 本地与服务器的 `HEAD`、分支、tracked file 数量
- 双方 dirty/untracked 文件
- tracked file 集合的 only-local / only-remote
- 代码/脚本/前端/测试/文档/HTML 范围内的当前内容哈希漂移
- shell 脚本行尾与可执行权限审计

注意：这个脚本比较的是**当前工作树内容**，不是只看 Git 状态。

## 7. 2026-04-08 审计快照

### 7.1 服务器基础信息

- 服务器工作目录：`/var/www/ai-coming-website`
- Node：`v22.22.0`
- npm：`10.9.4`

### 7.2 Git 状态

本地：

- branch: `codex/about-page-sync`
- head: `6555240`
- subject: `add about page client logos`

服务器：

- branch: `codex/about-page-sync`
- head: `338cedb`
- subject: `refine about page consulting layout`

结论：

- 分支名相同
- `HEAD` 不同
- 双方不是同一个提交快照

### 7.3 播客 canonical 文件核对

通过 `npm run podcast:audit:server` 得到的结论：

- `server/services/news-podcast.js`：一致
- `server/services/podcast-script.js`：一致
- `config/podcast-script-system-prompt.md`：一致
- `scripts/smoke-json.js`：一致
- `.env`：仅服务器存在，本地无副本

线上有效状态：

- `script_model = deepseek-v4-flash`
- `tts_model = speech-2.8-turbo`
- `script_mode = llm_rewritten`
- 最新播客状态接口返回日期：`2026-04-07`
- 状态：`ready`

这说明**播客正式链路当前是服务器优先且跑通的**。

### 7.4 tracked file 集合漂移

本地 tracked-only：

- `pic/skills/buddy-output.png`
- `pic/skills/docx-install.png`
- `pic/skills/docx-output-1.png`
- `pic/skills/docx-output-2.png`
- `pic/skills/pdf-install.png`
- `pic/skills/pptx-output.png`
- `pic/skills/search-first-alt.png`
- `pic/skills/search-first-output.png`
- `pic/skills/xlsx-output.png`

服务器 tracked-only：

- `frontend/modules/featured-skills-content.js`
- `pic/skills-guides/brainstorming-example.png`
- `pic/skills-guides/douyin-video-downloader-example.png`
- `tests/about-page.test.mjs`

解释：

- 本地比服务器多了新一批 skills 素材图
- 服务器比本地多了一个旧的 featured skills 数据模块、两张技能引导图、一个 about 页面测试
- 这不是单纯“某个文件没同步”，而是**文件集合本身已经分叉**

### 7.5 当前内容漂移文件

在代码/脚本/前端/测试/文档/HTML 这类可部署范围里，本次比较出 8 个当前内容漂移文件：

- `package.json`
- `scripts/run-wechat-autogen-once.js`
- `server/services/minimax-audio.js`
- `server/services/wechat-content.js`
- `tests/minimax-audio.test.mjs`
- `tests/skills-pages.test.mjs`
- `tests/wechat-autogen.test.mjs`
- `tests/wechat-content.test.mjs`

其中：

- `package.json` 的漂移是这次任务新增的，本地增加了 `npm run audit:server:local`
- 其余 7 个文件属于原本就存在的服务器/本地实现分叉

从 diff 看，漂移主要集中在两条线上：

1. **微信播客语音发送能力**
   - 服务器版本已经引入“短版语音文案合成”路径
   - 本地版本还停留在旧的音频复用/下载路径

2. **技能页与 about 页测试资产**
   - 测试断言与当前页面实现不一致
   - 服务器还有本地不存在的 `tests/about-page.test.mjs`

### 7.6 Git 状态和实际内容不完全等价

有一组文件虽然两边 `git status` 表现不同，但**当前文件内容已经一致**：

- `about.html`
- `frontend/modules/skills-catalog.js`
- `frontend/skill-detail-page.js`
- `frontend/skills-page.js`
- `skill-detail.html`
- `frontend/mcp-detail-page.js`
- `mcp-detail.html`
- `skills.html`

这说明：

- 当前仓库不能只靠 `git status` 判断“有没有同步到服务器”
- 有些差异只是双方基线提交不同，不是当前文件内容不同

### 7.7 当前工作区状态

本地 dirty / untracked：

- modified: `about.html`, `frontend/modules/skills-catalog.js`, `frontend/skill-detail-page.js`, `frontend/skills-page.js`, `package.json`, `skill-detail.html`
- untracked: `AGENTS.md`, `CHANGELOG_2026-04-07.md`, `docs/DEVELOPER_MANUAL.md`, `scripts/audit-server-local-drift.js`, `sync-to-server.sh`，以及多张 `pic/clients/*`、`pic/skills/*` 图片

服务器 dirty / untracked：

- modified: `frontend/mcp-detail-page.js`, `frontend/modules/skills-catalog.js`, `frontend/skill-detail-page.js`, `frontend/skills-page.js`, `mcp-detail.html`, `skill-detail.html`, `skills.html`
- untracked: 无

## 8. 验证结果

### 8.1 已通过

- `npm run podcast:audit:server`
- 服务器 `npm run test:smoke:json`

### 8.2 未通过

本地定向测试：

```bash
node --test tests/minimax-audio.test.mjs tests/skills-pages.test.mjs tests/wechat-autogen.test.mjs tests/wechat-content.test.mjs
```

失败原因分两类：

1. 本地未安装依赖，`scripts/run-wechat-autogen-once.js` 需要的 `dotenv` 无法解析
2. `tests/skills-pages.test.mjs` 的断言仍然期待旧版 skills catalog 结构，已经落后于当前页面实现

服务器定向测试也有失败，主要集中在：

- `tests/about-page.test.mjs`
- `tests/skills-pages.test.mjs`

这说明服务器侧同样存在**测试与页面实现脱节**的问题。

## 9. 面向后续开发者的建议顺序

建议按这个顺序处理，而不是并行乱改：

1. 先补齐本地运行环境
   - `npm install`
   - 创建本地 `.env`
2. 再决定“哪一侧是微信/技能页的权威版本”
   - 当前 about/skills/mcp 页面内容基本已对齐
   - 但 wechat/minimax/test 还没对齐
3. 统一测试基线
   - 先更新 `tests/skills-pages.test.mjs`
   - 再决定是否保留 `tests/about-page.test.mjs`
4. 最后重新跑两类审计
   - `npm run podcast:audit:server`
   - `npm run audit:server:local`

## 10. 简短判断

如果只问一句话：

**这个项目现在可以认为“播客正式链路在线且服务器优先，主站页面大体同步，但整个仓库还没有完成服务器与本地的严格收敛”。**

下一步真正该做的不是继续堆页面，而是先把本地环境、微信漂移代码和失效测试收口。
