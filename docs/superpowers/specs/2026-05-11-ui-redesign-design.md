# AIcoming 全站 UI 重设计规格

**日期**: 2026-05-11  
**方案**: 宣纸工坊（Warm Paper）  
**实现方案**: CSS Token 统一（方案一）  
**范围**: 全站所有页面统一设计语言

---

## 1. 设计方向

**风格名称**: 宣纸工坊  
**核心意象**: 暖白宣纸底色 + 朱砂红强调 + 衬线编辑字重  
**目标用户**: 中国职场用户，日常浏览 AI 资讯、查找工具、学习能力  
**设计原则**: 温润易读、信息层次清晰、专业感强、不做作

---

## 2. 设计令牌（Design Tokens）

所有 token 集中写入 `styles.css` 的 `:root`，替换现有 `--ai-*` 变量体系。

### 颜色

```css
:root {
  /* 背景层级 */
  --paper-bg:           #f3ede2;  /* 全站背景：暖宣纸色 */
  --paper-surface:      #f8f4ec;  /* 卡片/面板底色 */
  --paper-surface-2:    #fdfaf6;  /* 导航栏/悬浮面板 */

  /* 文字层级 */
  --paper-ink:          #1c1510;  /* 主文字：深墨 */
  --paper-ink-2:        #3d3028;  /* 次级文字 */
  --paper-ink-3:        #6a5a4a;  /* 说明/摘要文字 */
  --paper-ink-4:        #a89880;  /* 时间戳/元数据 */

  /* 边框与分割线 */
  --paper-rule:         #d8d0c2;  /* 常规边框/分割线 */
  --paper-rule-strong:  #b8a898;  /* 强调边框 */

  /* 品牌强调色：朱砂红 */
  --paper-vermilion:    #ba3f14;  /* 主强调色 */
  --paper-vermilion-hv: #9a3410;  /* 悬停/按下态 */
  --paper-vermilion-dim:#f3e0d8;  /* 浅底：标签背景、高亮区 */
}
```

### 字体

```css
:root {
  --f-serif: 'Noto Serif SC', Georgia, serif;   /* 标题/展示 */
  --f-sans:  'Noto Sans SC', -apple-system, sans-serif; /* 正文/UI */
  --f-mono:  'JetBrains Mono', 'Courier New', monospace; /* 时间/分类/代码 */
}
```

Google Fonts 引入（`<head>` 中已有，补充 Noto Serif SC）：

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700;900&family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 间距 & 圆角 & 阴影

```css
:root {
  /* 圆角 */
  --r-sm:  4px;
  --r-md:  8px;
  --r-lg:  10px;
  --r-xl:  14px;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(28,21,16,.06);
  --shadow-md: 0 4px 16px rgba(28,21,16,.10);
  --shadow-lg: 0 8px 32px rgba(28,21,16,.14);
}
```

---

## 3. 全局导航

所有页面共用同一导航组件，统一写入 `styles.css` 的 `.site-nav` 规则。

- **高度**: 52px
- **背景**: `--paper-surface-2`
- **下边框**: `2.5px solid var(--paper-ink)`（报纸底线感）
- **Logo**: 使用透明版 PNG（`/pic/AIcoming_logo_new_nobg.png`），`height: 28px`
- **导航链接**: `--f-sans` 13px 500，默认色 `--paper-ink-3`
- **活动项**: 色 `--paper-vermilion`，底部 `2px solid --paper-vermilion`
- **右侧**: 日期（`--f-mono` 11px `--paper-ink-4`）、管理入口

---

## 4. 各页面布局

### 4.1 首页（`index.html`）— 提示词生成器

**保持现有交互结构不变**，仅替换视觉样式：

| 元素 | 现有样式 | 新样式 |
|---|---|---|
| 页面背景 | 白色 + 浮动圆点动画 | `--paper-bg` + 横向浅纹（`repeating-linear-gradient`，朱砂红 2.5% 透明度） |
| Logo 区 | 居中图片 | 透明版 PNG，`height: 48px`，居中 |
| 提示词输入框边框 | `--ai-brand-500` 紫蓝色 | `2px solid --paper-vermilion`，`border-radius: 16px` |
| 输入框阴影 | 紫蓝 glow | `0 4px 24px rgba(186,63,20,.14)` |
| 发送按钮 | 深色圆形 | `--paper-ink` 背景，悬停变 `--paper-vermilion` |
| 结果卡片背景 | 白色 | `--paper-surface-2` |
| 结果卡片图标 | 紫蓝渐变 | `--paper-vermilion` 纯色 |
| 复制按钮 | 灰色描边 | `--paper-rule` 描边，悬停 `--paper-vermilion` |

底部标签导航（移动端）同步替换为朱砂红活动色。

### 4.2 资讯页（`news.html`）

- **页面背景**: `--paper-bg`
- **布局**: 左侧 196px 固定侧边栏 + 右侧主内容，`gap: 16px`
- **侧边栏**: `--paper-surface` 底色，`--paper-rule` 边框，圆角 10px；日期列表活动项 `--paper-vermilion-dim` 背景 + 左 `3px solid --paper-vermilion`
- **置顶头条卡片**: `--paper-surface-2` 底，顶部 `3px solid --paper-vermilion`，标题用 `--f-serif` 16px 700
- **列表项**: 编号（`--f-mono`，`--paper-rule` 色）+ 衬线标题 + 元数据标签
- **标签**: `--f-mono` 9px，`--paper-rule` 描边，热门标签用 `--paper-vermilion-dim` 背景

### 4.3 工具页（`tools.html`）

- **布局**: 左侧 192px 分类侧边栏 + 右侧 4 列工具卡片网格
- **侧边栏**: 与资讯页同款，分类图标 + 名称 + 数量徽章
- **活动分类**: 左 `3px solid --paper-vermilion` + `--paper-vermilion-dim` 背景
- **工具卡片**: `--paper-surface` 底，`--paper-rule` 边框，圆角 9px；悬停 `translateY(-2px)` + 边框变 `rgba(186,63,20,.3)`
- **分区标题**: `--f-mono` 全大写 + 右侧横线延伸

### 4.4 能力库页（`skills.html`）

- **布局**: 左侧 192px 分类侧边栏 + 右侧内容区
- **Hero Banner**: `--paper-surface-2` 底，顶部 `3px solid --paper-vermilion`，包含统计数字（`--f-serif` 20px `--paper-vermilion`）
- **能力卡片**: 3 列网格；卡片顶部 `3px` 横线默认 `--paper-rule`，悬停变 `--paper-vermilion`；图标区 `--paper-vermilion-dim` 背景
- **安装按钮**: `--f-mono` 9px，悬停变朱砂红

---

## 5. 基础组件规范

### 标签（Tag）
```
背景: --paper-vermilion-dim
文字: --paper-vermilion
边框: 1px solid rgba(186,63,20,.2)
字体: --f-mono 9px，letter-spacing .5px，uppercase
圆角: --r-sm (4px)
```

### 主按钮
```
背景: --paper-vermilion
文字: #fff，--f-sans 13px 600
圆角: --r-md (8px)
阴影: 0 2px 8px rgba(186,63,20,.28)
悬停: --paper-vermilion-hv，translateY(-1px)
```

### 次级按钮 / 描边按钮
```
背景: transparent
边框: 1.5px solid --paper-vermilion
文字: --paper-vermilion
悬停: --paper-vermilion-dim 背景
```

### 分割线标题
```
左侧文字: --f-mono 10px，--paper-vermilion，uppercase，letter-spacing 2px
右侧: flex 1，1px solid --paper-rule
```

---

## 6. Logo 处理

- 白底已去除，透明版文件已生成：
  - `/pic/AIcoming_logo_new_nobg.png`（导航栏用，height 28px）
  - `/pic/AIcoming_zixunye_nobg.png`（首页 Hero 用，height 48px）
- Logo 蓝色（`AI` 部分）**保留不变**，作为独立品牌色，与宣纸工坊主题色并存
- 不在 CSS 中对 logo 图片做滤镜处理

---

## 7. 实现方式

**CSS Token 统一（方案一）**，改动最小，风险最低：

1. 更新 `styles.css` `:root` — 用 `--paper-*` 替换现有 `--ai-*` 变量
2. 全局搜索替换各 HTML/CSS 中硬编码的颜色值（`#667eea`、`#764ba2` 等）
3. 在 `<head>` 补充 `Noto Serif SC` 字体引入
4. 替换导航栏为新版共享样式（各页面 nav 独立，逐页统一）
5. 将 logo `<img>` src 替换为透明版
6. 各页面背景色、卡片、标签、按钮逐步替换

**不改动**：
- 所有 JS 交互逻辑
- 数据接口与路由
- `data/` 目录内容
- `.env` 配置

---

## 8. 页面优先级

| 优先级 | 页面 | 说明 |
|---|---|---|
| P0 | `styles.css` | Token 基础层，全站生效 |
| P1 | `index.html` | 核心功能页，用户首先看到 |
| P1 | `news.html` | 日访问量最高 |
| P2 | `tools.html` | 工具导航 |
| P2 | `skills.html` | 能力库 |
| P3 | `about.html`、admin 页面 | 低频访问 |
