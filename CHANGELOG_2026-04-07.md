# 代码改进日报 — 2026-04-07

## Skills 详情页功能完善

### 1. 修复：Skill 详情页全部显示"资源不存在"

**问题**：所有 skill 详情页（`skill-detail.html?slug=xxx`）点击后跳转到 `https://aicoming.cn/undefined`，页面显示错误。

**根因**：`skills-page.js` 中 `createSection()` 直接遍历 `module.skills` 原始数据，但 `detailUrl` 字段只在 `normalizeSkill()` 中生成。渲染卡片时 `skill.detailUrl` 为 `undefined`，导致链接指向 `/undefined`。

**修复**：`createSkillCard()` 改为接收 `module` 参数，在函数内部直接计算 `detailUrl`，不再依赖 normalize 后的数据。

**涉及文件**：`frontend/skills-page.js`

---

### 2. 修复：服务器文件未同步导致详情页渲染异常

**问题**：`skill-detail-page.js` 本地与服务器哈希不一致，浏览器加载的是旧版本。

**修复**：通过 rsync 重新同步了所有 skills 相关文件（`skills-catalog.js`、`skill-detail-page.js`、`skills-page.js`、`skill-detail.html`、`mcp-detail.html`、`skills.html`）。

**教训**：每次修改后必须用 rsync 同步到服务器，不能只依赖 git push（本地网络到 GitHub 不稳定）。

---

### 3. 新增：安装面板 ZIP 下载按钮

**改动**：将原来 `installHint` 文本中裸露的 ZIP 链接，改为独立的「下载 ZIP」按钮。

- 每个 skill 新增 `downloadZip` 字段，存放独立的 ZIP 下载 URL
- `installHint` 文本中移除了尾部的 ZIP URL
- 安装面板右侧变为两个按钮纵向排列：「复制命令」+「下载 ZIP」
- 下载按钮带主题色渐变，hover 上浮，点击直接触发浏览器下载

**涉及文件**：`frontend/modules/skills-catalog.js`、`frontend/skill-detail-page.js`、`skill-detail.html`

---

### 4. 新增：Skill Creator 截图

**改动**：为 skill-creator 添加两张实操截图：
- `skill-creator-output-1.png`：使用 `/skill-creator` 创建新 Skill 的交互过程
- `skill-creator-output-2.png`：自动生成的 SKILL.md 和测试用例

**涉及文件**：`frontend/modules/skills-catalog.js`、`pic/skills/`

---

### 5. 修改：Search-First 提示词更新

**改动**：将 search-first 的示例提示词替换为真实测试过的提示词（搜索 B 站视频下载 skill），并删除第二张截图。

**涉及文件**：`frontend/modules/skills-catalog.js`

---

### 6. 修改：Market-Research 截图替换

**改动**：用正确的新能源汽车市场研究报告截图替换原有的错误截图。

**涉及文件**：`pic/skills/market-research-output.png`

---

### 7. 修改：Skill Creator 安装命令更新

**改动**：从"无需安装，Claude Code 内置"改为实际的安装命令：
```
npx skills add https://github.com/anthropics/skills --skill skill-creator --yes
```

**涉及文件**：`frontend/modules/skills-catalog.js`

---

### 8. 新增：3 个精选 MCP Server

**改动**：MCP 服务模块从 1 个扩展为 3 个：

| MCP | 安装命令 | 用途 |
|-----|---------|------|
| 本地文件系统 | `claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem ~/Desktop` | 读写本地文件、批量处理文档 |
| PDF 与网页解析 | `claude mcp add pdf -- npx -y @modelcontextprotocol/server-fetch` | 解析 PDF、抓取网页、抽取文本 |
| 网页自动化 | `claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server` | 自动操作网页、抓取数据、截图 |

原来的 `fetch-mcp` 已替换为以上 3 个，每个都有独立安装命令、ZIP 下载、详情页。

**涉及文件**：`frontend/modules/skills-catalog.js`

---

## About 页面联系信息优化

### 9. 改动：联系方式直接展示

**问题**：联系人和电话隐藏在弹窗中，用户需要点击"联系我们"才能看到。

**改动**：
- **Hero 区域**：原"联系我们"按钮替换为直接展示「黄老师」+「15800565566」，带图标和分隔线
- **底部 CTA 区域**：深色背景上以胶囊卡片展示联系人和手机号，点击号码可直接拨打

**涉及文件**：`about.html`

---

## 文件变更清单

| 文件 | 变更类型 |
|------|---------|
| `frontend/modules/skills-catalog.js` | 修改（数据：ZIP 下载、截图、提示词、MCP 扩展） |
| `frontend/skill-detail-page.js` | 修改（渲染：下载按钮布局） |
| `frontend/skills-page.js` | 修复（detailUrl 未定义导致链接失效） |
| `skill-detail.html` | 修改（CSS：下载按钮样式） |
| `about.html` | 修改（联系方式直接展示） |
| `pic/skills/skill-creator-output-1.png` | 新增 |
| `pic/skills/skill-creator-output-2.png` | 新增 |
| `pic/skills/market-research-output.png` | 替换 |
