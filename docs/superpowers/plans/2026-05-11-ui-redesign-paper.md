# AIcoming 宣纸工坊 UI 重设计 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AIcoming 全站视觉风格从紫蓝渐变替换为宣纸工坊主题（暖白底色 + 朱砂红强调 + 衬线字重），保持所有 JS 交互逻辑不变。

**Architecture:** CSS Token 统一方案——在 `styles.css` 的 `:root` 中写入 `--paper-*` 设计令牌，替换现有 `--ai-*` 变量体系；各页面内联 `<style>` 按页更新；不触碰任何 JS 文件。

**Tech Stack:** 原生 CSS（CSS 变量）、Tailwind CDN（现有）、Noto Serif SC + Noto Sans SC + JetBrains Mono（Google Fonts）

---

## 文件改动总览

| 文件 | 操作 | 说明 |
|---|---|---|
| `styles.css` | 修改 | 替换 `:root` token 块，更新全局 nav/button/card 规则 |
| `index.html` | 修改 | font 引入、logo src、页面 bg、输入框、结果卡 |
| `news.html` | 修改 | font 引入、logo src、页面 bg、卡片、标签、侧边栏 |
| `tools.html` | 修改 | font 引入、logo src、侧边栏活动色、工具卡 |
| `skills.html` | 修改 | font 引入、logo src、Hero Banner、能力卡 |
| `about.html` | 修改 | font 引入、logo src、基础 token 生效 |

**不改动**：`server/`、`frontend/`、`data/`、所有 `.js` 文件、`.env`

---

## Task 1：更新 `styles.css` — 设计令牌基础层

**Files:**
- Modify: `styles.css:1-37`（`:root` 块完全替换）

---

- [ ] **Step 1：替换 `:root` 变量块**

打开 `styles.css`，将第 1-37 行的 `:root { ... }` 整体替换为：

```css
/* AI资讯网站样式文件 — 宣纸工坊主题 */

:root {
  /* 字体栈 */
  --f-serif: 'Noto Serif SC', Georgia, serif;
  --f-sans:  'Noto Sans SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', -apple-system, sans-serif;
  --f-mono:  'JetBrains Mono', 'SFMono-Regular', Menlo, 'Courier New', monospace;

  /* 背景层级 */
  --paper-bg:        #f3ede2;
  --paper-surface:   #f8f4ec;
  --paper-surface-2: #fdfaf6;

  /* 文字层级 */
  --paper-ink:   #1c1510;
  --paper-ink-2: #3d3028;
  --paper-ink-3: #6a5a4a;
  --paper-ink-4: #a89880;

  /* 边框与分割线 */
  --paper-rule:        #d8d0c2;
  --paper-rule-strong: #b8a898;

  /* 品牌强调色：朱砂红 */
  --paper-vermilion:     #ba3f14;
  --paper-vermilion-hv:  #9a3410;
  --paper-vermilion-dim: #f3e0d8;

  /* 圆角 */
  --r-sm: 4px;
  --r-md: 8px;
  --r-lg: 10px;
  --r-xl: 14px;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(28,21,16,.06);
  --shadow-md: 0 4px 16px rgba(28,21,16,.10);
  --shadow-lg: 0 8px 32px rgba(28,21,16,.14);

  /* ── 向后兼容别名（过渡期间保留，勿删） ── */
  --ai-font-ui:       var(--f-sans);
  --ai-font-mono:     var(--f-mono);
  --ai-bg-page:       var(--paper-bg);
  --ai-bg-muted:      var(--paper-surface);
  --ai-bg-surface:    var(--paper-surface-2);
  --ai-bg-soft:       var(--paper-surface);
  --ai-text-primary:  var(--paper-ink);
  --ai-text-secondary:var(--paper-ink-2);
  --ai-text-muted:    var(--paper-ink-3);
  --ai-border:        var(--paper-rule);
  --ai-border-strong: var(--paper-rule-strong);
  --ai-brand-500:     var(--paper-vermilion);
  --ai-brand-600:     var(--paper-vermilion-hv);
  --ai-brand-700:     var(--paper-vermilion-hv);
  --ai-accent-500:    var(--paper-vermilion);
  --ai-success-500:   #10b981;
  --ai-success-600:   #059669;
  --ai-danger-500:    #ef4444;
  --ai-radius-sm:     var(--r-sm);
  --ai-radius-md:     var(--r-md);
  --ai-radius-lg:     var(--r-lg);
  --ai-radius-pill:   999px;
  --ai-shadow-sm:     var(--shadow-sm);
  --ai-shadow-md:     var(--shadow-md);
  --ai-shadow-brand:  0 8px 24px rgba(186,63,20,.18);
  --ai-gradient-brand:linear-gradient(135deg, var(--paper-vermilion) 0%, var(--paper-vermilion-hv) 100%);
}

html, body {
  font-family: var(--f-sans);
  color: var(--paper-ink);
}
```

- [ ] **Step 2：更新 `styles.css` 中的全局导航样式**

在 `styles.css` 找到 `.modern-nav`、`.nav-link`、`.nav-link.active`、`.nav-link::before` 相关规则（约第 289-335 行），替换为：

```css
.modern-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--r-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--paper-ink-3);
  text-decoration: none;
  transition: color .15s, background .15s;
  position: relative;
  border-bottom: 2px solid transparent;
}

.nav-link:hover {
  color: var(--paper-ink);
  background: rgba(28,21,16,.04);
}

.nav-link.active {
  color: var(--paper-vermilion);
  border-bottom-color: var(--paper-vermilion);
  background: transparent;
  box-shadow: none;
}

/* 移除原有的彩色 before 装饰线 */
.nav-link::before { display: none; }
.nav-link:hover::before,
.nav-link.active::before { display: none; }
```

同时更新移动端 `.mobile-nav-link`（约第 335-370 行）：

```css
.mobile-nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  color: var(--paper-ink-4);
  text-decoration: none;
  font-size: 11px;
  transition: color .15s;
}

.mobile-nav-link:hover,
.mobile-nav-link.active {
  color: var(--paper-vermilion);
}

.mobile-nav-link .nav-indicator {
  background: var(--paper-vermilion);
}
```

- [ ] **Step 3：更新 `styles.css` 全局 `body` 背景与 nav 容器背景**

找到 `.nav-simplified`（约第 246-260 行），替换背景与边框：

```css
.nav-simplified {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: var(--paper-surface-2);
  border-bottom: 2.5px solid var(--paper-ink);
  box-shadow: none;
}
```

找到 `bg-white shadow-lg` 对应的 `#fullNav` nav 容器——这些是 Tailwind 类，在 `styles.css` 底部添加覆盖规则：

```css
/* 覆盖 Tailwind bg-white shadow-lg on #fullNav */
#fullNav {
  background: var(--paper-surface-2) !important;
  box-shadow: none !important;
  border-bottom: 2.5px solid var(--paper-ink) !important;
}
```

- [ ] **Step 4：验证 token 层生效**

```bash
npm start
```

打开 http://localhost:3000，确认：
- 页面背景变为暖米色（`#f3ede2`）而非白色
- 顶部导航变为暖白底 + 深墨底线（而非白色 + 阴影）
- 控制台无 CSS 报错

- [ ] **Step 5：提交**

```bash
git add styles.css
git commit -m "style: replace ai-* tokens with paper-* design system (宣纸工坊)"
```

---

## Task 2：全页面 — 字体引入 + Logo 透明版替换

**Files:**
- Modify: `index.html` — `<head>` 字体链接、nav logo src
- Modify: `news.html` — `<head>` 字体链接、nav logo src
- Modify: `tools.html` — `<head>` 字体链接、nav logo src
- Modify: `skills.html` — `<head>` 字体链接、nav logo src
- Modify: `about.html` — `<head>` 字体链接、nav logo src

---

- [ ] **Step 1：在所有页面 `<head>` 中替换 Google Fonts 引入**

每个页面 `<head>` 里已有 Google Fonts 链接（搜索 `fonts.googleapis.com`），将其替换为统一的：

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700;900&family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

5 个页面（`index.html`、`news.html`、`tools.html`、`skills.html`、`about.html`）逐一操作。

- [ ] **Step 2：替换 nav 中的 logo 图片 src**

每个页面的顶部导航（`#fullNav`）中有两处 logo img：
1. 桌面版（`class="h-12 w-auto"`）：src 改为 `./pic/AIcoming_logo_new_nobg.png`
2. 简化版（在 `.logo-wrapper img` 中）：src 改为 `./pic/AIcoming_logo_new_nobg.png`

`index.html` 首页 Hero 区（`.logo-wrapper img`，第 1074 行）改为 `./pic/AIcoming_zixunye_nobg.png`（带副标题版）。

搜索所有 `AIcoming_zixunye.png` 和 `AIcoming_logo_new.png`，批量替换：
- `AIcoming_zixunye.png` → `AIcoming_zixunye_nobg.png`
- `AIcoming_logo_new.png` → `AIcoming_logo_new_nobg.png`

- [ ] **Step 3：验证字体与 logo**

```bash
# 服务已在运行，刷新浏览器
```

确认：
- 导航 logo 无白色底块（背景透明，融入导航栏底色）
- 正文字体渲染为 Noto Sans SC（比之前更圆润）
- 标题区域 Noto Serif SC 加载（在 news.html 中显著）

- [ ] **Step 4：提交**

```bash
git add index.html news.html tools.html skills.html about.html
git commit -m "style: update font imports + transparent logo across all pages"
```

---

## Task 3：`index.html` — 提示词生成器页面

**Files:**
- Modify: `index.html` — 内联 `<style>` 中的背景、输入框、结果卡、按钮样式

---

- [ ] **Step 1：替换页面背景与浮动动画颜色**

在 `index.html` 内联 `<style>` 中找到 `body { ... }` 规则，替换背景色：

```css
body {
  font-family: var(--f-sans);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--paper-bg);
  color: var(--paper-ink);
  overflow-x: hidden;
  padding-bottom: 52px;
  position: relative;
}
```

找到 `.bg-animation span` 规则，将 `background: rgba(102, 126, 234, 0.08)` 改为：

```css
background: rgba(186, 63, 20, 0.05);
```

- [ ] **Step 2：更新提示词输入框（`.search-box`）**

找到 `.search-box` 规则，替换边框与阴影：

```css
.search-box {
  width: 100%;
  background: var(--paper-surface-2);
  border: 2px solid var(--paper-vermilion) !important;
  outline: none !important;
  box-shadow: 0 4px 24px rgba(186,63,20,.14);
  border-radius: 16px;
  display: flex;
  align-items: flex-end;
  padding: 16px;
  transition: all 0.3s ease;
  min-height: 120px;
}

.search-box:focus-within {
  box-shadow: 0 6px 32px rgba(186,63,20,.22);
  border: 2px solid var(--paper-vermilion) !important;
}
```

找到 `.search-input`，更新字体与颜色：

```css
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  color: var(--paper-ink-2);
  background: transparent;
  font-weight: 400;
  resize: none;
  line-height: 1.6;
  font-family: var(--f-sans);
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
}

.search-input::placeholder {
  color: var(--paper-ink-4);
  font-weight: 300;
}
```

- [ ] **Step 3：更新发送按钮（`.search-btn`）**

```css
.search-btn {
  background: var(--paper-ink);
  color: var(--paper-surface-2);
  border: none;
  border-radius: var(--r-md);
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-btn:hover {
  background: var(--paper-vermilion);
}

.search-btn:disabled {
  background: var(--paper-rule);
  cursor: not-allowed;
}
```

- [ ] **Step 4：更新结果卡片（`.search-result`、`.result-header`、`.result-icon`）**

```css
.search-result {
  background: var(--paper-surface-2);
  border: 1px solid var(--paper-rule);
  border-radius: var(--r-xl);
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--paper-rule);
}

.result-icon {
  width: 36px;
  height: 36px;
  background: var(--paper-vermilion);
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  margin-right: 12px;
  flex-shrink: 0;
}

.result-title {
  font-family: var(--f-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--paper-ink);
  flex: 1;
}

.result-content {
  font-size: 0.95rem;
  color: var(--paper-ink-2);
  line-height: 1.75;
  margin-bottom: 16px;
  white-space: pre-wrap;
  font-family: var(--f-sans);
}
```

- [ ] **Step 5：更新复制按钮（`.copy-btn-header`）**

```css
.copy-btn-header {
  background: var(--paper-surface);
  border: 1.5px solid var(--paper-rule);
  color: var(--paper-ink-3);
  padding: 7px 14px;
  border-radius: var(--r-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.copy-btn-header:hover {
  border-color: var(--paper-vermilion);
  color: var(--paper-vermilion);
  background: var(--paper-vermilion-dim);
}

.copy-btn-header.copied {
  background: #10b981;
  border-color: #10b981;
  color: white;
}
```

- [ ] **Step 6：验证首页**

打开 http://localhost:3000，确认：
- 背景为暖米色，浮动圆点为淡朱砂红
- 输入框边框为朱砂红，聚焦时阴影加深
- 发送按钮深墨色，悬停变朱砂红
- 结果卡片为暖白底，图标为朱砂红方块，无紫蓝渐变

- [ ] **Step 7：提交**

```bash
git add index.html
git commit -m "style: apply 宣纸工坊 theme to index.html (prompt generator)"
```

---

## Task 4：`news.html` — 资讯页

**Files:**
- Modify: `news.html` — 内联 `<style>` 中的页面背景、时间轴、卡片、侧边栏、标签

---

- [ ] **Step 1：替换页面背景**

在 `news.html` 内联 `<style>` 中找到 `body { ... }`，替换：

```css
body {
  font-family: var(--f-sans);
  background: var(--paper-bg);
  color: var(--paper-ink);
}
```

- [ ] **Step 2：更新时间轴样式（`.timeline-item`）**

```css
.timeline-item {
  position: relative;
  padding: 12px 16px;
  margin-left: 8px;
  border-left: 3px solid var(--paper-rule);
  border-radius: 0 var(--r-lg) var(--r-lg) 0;
  background: var(--paper-surface);
  cursor: pointer;
  transition: all 0.2s ease;
}

.timeline-item:hover {
  border-left-color: var(--paper-vermilion);
  background: var(--paper-surface-2);
}

.timeline-item.active,
.timeline-item:focus {
  border-left-color: var(--paper-vermilion);
  background: var(--paper-vermilion-dim);
}

/* 时间轴圆点 */
.timeline-item::before {
  content: '';
  position: absolute;
  left: -7.5px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--paper-rule);
  border: 2px solid var(--paper-bg);
  transition: background .2s;
}

.timeline-item:hover::before,
.timeline-item.active::before {
  background: var(--paper-vermilion);
}
```

- [ ] **Step 3：更新新闻卡片（`.news-card`、`.news-tag`、`.news-category`）**

搜索 `news.html` 内联样式中卡片相关规则，替换颜色值（将所有 `#667eea`、`#764ba2`、`var(--ai-brand-*)`）：

```css
/* 分类标签 */
.news-tag, .category-badge {
  background: var(--paper-vermilion-dim);
  color: var(--paper-vermilion);
  border: 1px solid rgba(186,63,20,.2);
  font-family: var(--f-mono);
  font-size: 9px;
  letter-spacing: .5px;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: var(--r-sm);
}

/* 卡片容器 */
.news-card, .article-card {
  background: var(--paper-surface);
  border: 1px solid var(--paper-rule);
  border-radius: var(--r-lg);
}

.news-card:hover, .article-card:hover {
  border-color: rgba(186,63,20,.3);
  box-shadow: var(--shadow-md);
}

/* 新闻标题 */
.news-title, .article-title {
  font-family: var(--f-serif);
  color: var(--paper-ink);
}
```

- [ ] **Step 4：处理 `news.html` 中硬编码的渐变颜色**

在 `news.html` 搜索 `667eea` 和 `764ba2`（共约 2 处），将渐变背景替换：

将：
```css
background: var(--ai-gradient-brand, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
```
改为：
```css
background: var(--paper-vermilion);
```

- [ ] **Step 5：验证资讯页**

打开 http://localhost:3000/news.html，确认：
- 页面背景为暖米色
- 时间轴左边线默认灰色，悬停/活动变朱砂红
- 分类标签为朱砂红文字+浅底
- 无紫蓝渐变残留

- [ ] **Step 6：提交**

```bash
git add news.html
git commit -m "style: apply 宣纸工坊 theme to news.html"
```

---

## Task 5：`tools.html` — 工具页

**Files:**
- Modify: `tools.html` — 内联 `<style>` 中的侧边栏活动色、工具卡片、分区标题

---

- [ ] **Step 1：替换页面背景**

在 `tools.html` 内联 `<style>` 中找到 `body { background: var(--bg) }` 或 `background: var(--ai-bg-muted)`，替换：

```css
body {
  margin: 0;
  background: var(--paper-bg);
  color: var(--paper-ink);
  font-family: var(--f-sans);
}
```

- [ ] **Step 2：更新侧边栏分类链接（`.category-link`）**

找到 `.category-link` 及其 `--category-accent`、`--category-bg`、`--category-border` 自定义属性，替换整块规则：

```css
.category-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: var(--r-lg);
  border: 1px solid var(--paper-rule);
  color: var(--paper-ink-2);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  background: var(--paper-surface);
  transition: border-color .16s, background .16s, color .16s;
  position: relative;
  overflow: hidden;
}

.category-link:hover {
  border-color: rgba(186,63,20,.3);
  background: var(--paper-vermilion-dim);
  color: var(--paper-vermilion);
}

.category-link.active,
.category-link[aria-current="true"] {
  border-color: rgba(186,63,20,.35);
  border-left: 3px solid var(--paper-vermilion);
  background: var(--paper-vermilion-dim);
  color: var(--paper-vermilion);
  font-weight: 600;
}

/* 移除原有的 ::before 彩色装饰条 */
.category-link::before { display: none; }
```

- [ ] **Step 3：更新工具卡片（`.tool-card`、`.tool-item`）**

找到工具卡片相关规则，替换：

```css
.tool-card, .tool-item {
  background: var(--paper-surface);
  border: 1px solid var(--paper-rule);
  border-radius: var(--r-lg);
  transition: border-color .15s, box-shadow .15s, transform .15s;
}

.tool-card:hover, .tool-item:hover {
  border-color: rgba(186,63,20,.3);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

- [ ] **Step 4：更新分区标题（`.section-header`、`.section-title`）**

找到工具分区标题规则，替换颜色：

```css
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-title {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--paper-vermilion);
  text-transform: uppercase;
  letter-spacing: 2px;
  white-space: nowrap;
}

.section-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--paper-rule);
}
```

- [ ] **Step 5：验证工具页**

打开 http://localhost:3000/tools.html，确认：
- 背景暖米色
- 左侧分类侧边栏活动项左边有朱砂红竖线 + 浅红背景
- 工具卡悬停有朱砂红边框 + 上移阴影
- 无紫蓝色残留

- [ ] **Step 6：提交**

```bash
git add tools.html
git commit -m "style: apply 宣纸工坊 theme to tools.html"
```

---

## Task 6：`skills.html` — 能力库页

**Files:**
- Modify: `skills.html` — 内联 `<style>` 中的页面背景渐变、Hero Banner、能力卡片

---

- [ ] **Step 1：替换页面背景**

在 `skills.html` 内联 `<style>` 中找到 `body` 的渐变背景（目前是蓝紫渐变），替换：

```css
body {
  position: relative;
  margin: 0;
  min-height: 100vh;
  background: var(--paper-bg);
  color: var(--paper-ink);
  font-family: var(--f-sans);
  overflow-x: hidden;
}

/* 替换原有的 radial-gradient 背景球和网格叠加 */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 40px,
    rgba(186,63,20,.02) 40px,
    rgba(186,63,20,.02) 41px
  );
  pointer-events: none;
  z-index: 0;
}

body::after { display: none; }
```

- [ ] **Step 2：更新 Skills Hero 区（`.skills-hero`）**

找到 `.skills-hero` 规则，替换渐变为宣纸风格：

```css
.skills-hero {
  position: relative;
  overflow: hidden;
  padding: clamp(32px, 5vh, 56px) clamp(24px, 4vw, 48px);
  border-radius: var(--r-xl);
  background: var(--paper-surface-2);
  border: 1px solid var(--paper-rule);
  border-top: 3px solid var(--paper-vermilion);
  box-shadow: var(--shadow-md);
}

.skills-hero::before { display: none; }
```

找到 `.skills-hero` 内的统计数字样式（`.skills-hero-stats`、stat 数字），替换颜色：

```css
.skills-hero-stats .stat-number,
.skills-hero .hero-stat-number {
  font-family: var(--f-serif);
  font-size: 28px;
  font-weight: 900;
  color: var(--paper-vermilion);
}

.skills-hero-stats .stat-label,
.skills-hero .hero-stat-label {
  font-size: 12px;
  color: var(--paper-ink-4);
}
```

- [ ] **Step 3：更新能力卡片（`.skill-card`）**

找到 `.skill-card` 相关规则，替换：

```css
.skill-card {
  background: var(--paper-surface);
  border: 1px solid var(--paper-rule);
  border-radius: var(--r-lg);
  transition: border-color .15s, box-shadow .15s, transform .15s;
  position: relative;
  overflow: hidden;
}

.skill-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--paper-rule);
  transition: background .15s;
}

.skill-card:hover::before {
  background: var(--paper-vermilion);
}

.skill-card:hover {
  border-color: rgba(186,63,20,.25);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

找到能力图标区背景（通常是渐变蓝紫），替换：

```css
.skill-icon-wrap, .skill-icon-bg {
  background: var(--paper-vermilion-dim);
  border: 1px solid rgba(186,63,20,.2);
  border-radius: var(--r-md);
}
```

找到「安装/查看」按钮，替换颜色：

```css
.skill-install-btn, .skill-action-btn {
  font-family: var(--f-mono);
  font-size: 11px;
  color: var(--paper-ink-4);
  background: rgba(28,21,16,.04);
  border: 1px solid var(--paper-rule);
  border-radius: var(--r-sm);
  padding: 3px 9px;
  cursor: pointer;
  transition: color .14s, border-color .14s;
}

.skill-card:hover .skill-install-btn,
.skill-card:hover .skill-action-btn {
  color: var(--paper-vermilion);
  border-color: rgba(186,63,20,.25);
}
```

- [ ] **Step 4：验证能力库页**

打开 http://localhost:3000/skills.html，确认：
- 背景为暖米色（蓝紫渐变消失）
- Hero Banner 顶部有朱砂红横线，统计数字为朱砂红衬线字
- 能力卡悬停顶部横线变朱砂红
- 图标区为浅红背景

- [ ] **Step 5：提交**

```bash
git add skills.html
git commit -m "style: apply 宣纸工坊 theme to skills.html"
```

---

## Task 7：全站最终收尾 + 部署

**Files:**
- Modify: `about.html` — 基础 token 生效确认
- Deploy: 服务器同步

---

- [ ] **Step 1：快速检查 `about.html`**

打开 http://localhost:3000/about.html，由于 `styles.css` token 已更新，大部分颜色会自动生效。搜索 `about.html` 内联 `<style>` 中残留的 `#667eea`、`#764ba2`，批量替换为 `var(--paper-vermilion)`。

- [ ] **Step 2：全站颜色残留扫描**

```bash
grep -rn "667eea\|764ba2\|5b6fd9\|4c63cf" \
  --include="*.html" --include="*.css" \
  /Users/MarkHuang/Desktop/ai-coming-website/ \
  | grep -v "node_modules\|.superpowers\|docs/"
```

对每个命中行逐一替换为 `var(--paper-vermilion)` 或 `var(--paper-vermilion-hv)`。

- [ ] **Step 3：最终提交**

```bash
git add about.html styles.css
git commit -m "style: final sweep — remove all legacy blue/purple hardcoded colors"
```

- [ ] **Step 4：推送并部署到服务器**

```bash
git push
ssh root@8.135.37.159 "cd /var/www/ai-coming-website && git pull && pm2 restart all"
```

- [ ] **Step 5：线上验证**

打开 `http://8.135.37.159`，确认 5 个主页面（首页、资讯、工具、能力库、关于）均为宣纸工坊主题，无紫蓝色残留，logo 无白色底块。

---

## 快速参考：颜色映射

| 旧颜色 | 用途 | 替换为 |
|---|---|---|
| `#667eea` / `--ai-brand-500` | 主强调色 | `var(--paper-vermilion)` |
| `#764ba2` / `--ai-accent-500` | 副强调色 | `var(--paper-vermilion-hv)` |
| `#ffffff` / `--ai-bg-surface` | 卡片背景 | `var(--paper-surface-2)` |
| `#f3f4f6` / `--ai-bg-muted` | 页面背景 | `var(--paper-bg)` |
| `#111827` / `--ai-text-primary` | 主文字 | `var(--paper-ink)` |
| `#6b7280` / `--ai-text-muted` | 次级文字 | `var(--paper-ink-3)` |
| `#e5e7eb` / `--ai-border` | 边框 | `var(--paper-rule)` |
| `linear-gradient(135deg,#667eea,#764ba2)` | 渐变背景 | `var(--paper-vermilion)` 或移除 |
