# AI资讯网站 - 文件交互关系详解

## 架构概览图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🌐 前端层 (浏览器)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  index.html  │  news.html  │  admin.html  │  weekly.html  │  tools.html      │
│              │             │             │              │  keywords.html    │
│              │             │             │              │  visitors.html    │
│              │             │             │              │  archive.html     │
└──────────────┴─────────────┴─────────────┴──────────────┴──────────────────┘
                                    ↓ 引用
┌─────────────────────────────────────────────────────────────────────────────┐
│                      js/main.js (1500行) - 核心前端逻辑                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  • 页面初始化  • API调用  • 数据渲染  • 用户交互  • JWT管理                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ API请求 (HTTP REST)
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ⚙️ 后端层 - server-json.js (2022行)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  41个API端点  │  JWT认证  │  数据验证  │  归档系统  │  访客追踪               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ 文件读写
┌─────────────────────────────────────────────────────────────────────────────┐
│                        💾 数据存储层 (JSON文件)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  news.json  │  weekly-news.json  │  tools.json  │  keywords.json             │
│  visitors.json  │  settings.json  │  archive/*.json                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 详细文件清单与依赖关系

### 1. 前端HTML页面 (8个)

#### index.html - 主页
- **文件路径**: `/index.html`
- **功能**: 网站首页入口
- **加载脚本**: `<script src="js/main.js"></script>`
- **调用API**:
  - `GET /api/news` - 获取今日资讯
  - `GET /api/weekly-news` - 获取每周资讯
  - `GET /api/keywords` - 获取关键词云
  - `POST /api/visitors` - 记录访问
- **渲染内容**: 导航栏、资讯卡片、关键词云、页脚

#### news.html - 日报页面
- **文件路径**: `/news.html`
- **功能**: 展示AI日报内容
- **加载脚本**: `js/main.js`
- **调用API**:
  - `GET /api/news` - 获取今日资讯
  - `GET /api/weekly-news` - 获取每周资讯
  - `GET /api/archive/:date` - 获取历史归档
- **渲染内容**: 日报列表、分类筛选、搜索功能、日期导航

#### admin.html - 管理后台
- **文件路径**: `/admin.html`
- **功能**: 管理员操作界面
- **加载脚本**: `js/main.js`
- **调用API** (需JWT认证):
  - `POST /api/auth/login` - 管理员登录
  - `GET /api/news` - 获取资讯列表
  - `POST /api/news/batch` - 批量导入资讯
  - `DELETE /api/news/:id` - 删除资讯
  - `GET /api/weekly-news` - 获取每周资讯
  - `POST /api/weekly-news` - 创建每周资讯
  - `PUT /api/weekly-news/:id` - 更新每周资讯
  - `DELETE /api/weekly-news/:id` - 删除每周资讯
  - `GET /api/tools` - 获取AI工具列表
  - `POST /api/tools` - 添加工具
  - `PUT /api/tools/:id` - 更新工具
  - `DELETE /api/tools/:id` - 删除工具
  - `GET /api/keywords` - 获取关键词
  - `POST /api/keywords/batch` - 批量导入关键词
  - `DELETE /api/keywords/:id` - 删除关键词
  - `GET /api/stats` - 获取统计数据
  - `GET /api/visitors` - 获取访客记录
  - `GET /api/settings` - 获取系统设置
  - `POST /api/settings` - 更新系统设置
- **渲染内容**: 登录表单、数据表格、编辑表单、统计图表

#### weekly.html - 每周资讯
- **文件路径**: `/weekly.html`
- **功能**: 深度周刊展示
- **加载脚本**: `js/main.js`
- **调用API**: `GET /api/weekly-news`
- **渲染内容**: 周刊列表、分类筛选、详情展示

#### tools.html - AI工具页面
- **文件路径**: `/tools.html`
- **功能**: AI工具导航
- **加载脚本**: `js/main.js`
- **调用API**: `GET /api/tools`
- **渲染内容**: 工具卡片、分类筛选、搜索功能

#### keywords.html - 关键词页面
- **文件路径**: `/keywords.html`
- **功能**: 关键词云展示
- **加载脚本**: `js/main.js`
- **调用API**: `GET /api/keywords`
- **渲染内容**: 关键词云、权重可视化

#### visitors.html - 访客统计
- **文件路径**: `/visitors.html`
- **功能**: 访客数据可视化
- **加载脚本**: `js/main.js`
- **调用API**: `GET /api/visitors`, `GET /api/stats`
- **渲染内容**: 地域分布图、访问趋势、统计数据

#### archive.html - 历史归档
- **文件路径**: `/archive.html`
- **功能**: 历史数据浏览
- **加载脚本**: `js/main.js`
- **调用API**:
  - `GET /api/archive/dates` - 获取归档日期列表
  - `GET /api/archive/:date` - 获取指定日期数据
- **渲染内容**: 日期选择器、历史数据展示

---

### 2. 前端逻辑层

#### js/main.js (1500行)
- **文件路径**: `/js/main.js`
- **功能**: 核心前端逻辑控制器
- **主要模块**:
  1. **页面初始化模块**
     - 检测当前页面
     - 加载页面配置
     - 初始化UI组件

  2. **API调用模块**
     ```javascript
     const API_BASE = 'http://localhost:3000/api';

     // 通用请求函数
     async function apiRequest(endpoint, method, data, token) {
         // 处理HTTP请求
         // 添加JWT认证头
         // 错误处理
     }

     // 具体API调用函数
     async function loadNews() { /* ... */ }
     async function loadWeeklyNews() { /* ... */ }
     async function loadTools() { /* ... */ }
     async function loadKeywords() { /* ... */ }
     async function loadVisitors() { /* ... */ }
     ```

  3. **JWT认证模块**
     ```javascript
     let authToken = localStorage.getItem('adminToken');

     function login(username, password) {
         // POST /api/auth/login
         // 保存token到localStorage
     }

     function logout() {
         // 清除token
         // 跳转到登录页
     }
     ```

  4. **数据渲染模块**
     ```javascript
     function renderNewsCards(newsData) {
         // 生成HTML卡片
         // 插入到DOM
         // 绑定交互事件
     }

     function renderKeywordsCloud(keywords) {
         // 生成词云
         // 根据权重设置样式
     }

     function renderVisitorStats(visitors) {
         // 生成统计图表
         // 地域分布可视化
     }
     ```

  5. **用户交互模块**
     - 搜索功能
     - 筛选功能
     - 分页功能
     - 编辑/删除操作

  6. **自动追踪模块**
     ```javascript
     // 页面加载时自动记录访问
     window.addEventListener('load', () => {
         trackVisit();
     });

     async function trackVisit() {
         // 获取IP地址
         // 调用淘宝IP API获取地域
         // POST /api/visitors
     }
     ```

---

### 3. 后端服务器层

#### server-json.js (2022行)
- **文件路径**: `/server-json.js`
- **功能**: Node.js后端服务器
- **主要模块**:

  1. **依赖模块**
     ```javascript
     const express = require('express');
     const fs = require('fs');
     const path = require('path');
     const jwt = require('jsonwebtoken');
     const bcrypt = require('bcryptjs');
     ```

  2. **配置管理**
     ```javascript
     const app = express();
     const PORT = process.env.PORT || 3000;
     const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

     // 数据文件路径
     const DATA_DIR = path.join(__dirname, 'data');
     const NEWS_FILE = path.join(DATA_DIR, 'news.json');
     const WEEKLY_NEWS_FILE = path.join(DATA_DIR, 'weekly-news.json');
     const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
     const KEYWORDS_FILE = path.join(DATA_DIR, 'keywords.json');
     const VISITORS_FILE = path.join(DATA_DIR, 'visitors.json');
     const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
     const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');
     ```

  3. **中间件**
     ```javascript
     // CORS设置
     app.use((req, res, next) => {
         res.header('Access-Control-Allow-Origin', '*');
         res.header('Access-Control-Allow-Headers', '*');
         res.header('Access-Control-Allow-Methods', '*');
         next();
     });

     // JSON解析
     app.use(express.json());

     // JWT认证中间件
     function authenticateToken(req, res, next) {
         const authHeader = req.headers['authorization'];
         const token = authHeader && authHeader.split(' ')[1];

         if (!token) {
             return res.status(401).json({ error: '需要认证' });
         }

         jwt.verify(token, JWT_SECRET, (err, user) => {
             if (err) return res.status(403).json({ error: '无效token' });
             req.user = user;
             next();
         });
     }
     ```

  4. **数据操作函数**
     ```javascript
     function readData(filePath) {
         // 读取JSON文件
         // 如果不存在则初始化
     }

     function writeData(filePath, data) {
         // 写入JSON文件
         // 原子写入保证数据安全
     }

     function generateId(prefix) {
         // 生成唯一ID
         // 支持日期格式
     }
     ```

  5. **归档系统**
     ```javascript
     function archiveOldNews() {
         // 将旧资讯移到archive目录
         // 按日期归档: archive/news-2026-02-04.json
         // 返回归档统计
     }

     function archiveOldWeeklyNews() {
         // 归档旧每周资讯
         // 按周归档
     }
     ```

  6. **41个API端点**

     **认证相关** (1个):
     - `POST /api/auth/login` - 管理员登录

     **今日资讯** (4个):
     - `GET /api/news` - 获取资讯列表 (支持count参数)
     - `POST /api/news` - 创建单条资讯
     - `POST /api/news/batch` - 批量导入资讯 (自动归档)
     - `DELETE /api/news/:id` - 删除资讯

     **每周资讯** (5个):
     - `GET /api/weekly-news` - 获取每周资讯 (支持分类筛选)
     - `POST /api/weekly-news` - 创建每周资讯
     - `PUT /api/weekly-news/:id` - 更新每周资讯
     - `DELETE /api/weekly-news/:id` - 删除每周资讯
     - `POST /api/weekly-news/batch` - 批量导入 (自动归档)

     **AI工具** (5个):
     - `GET /api/tools` - 获取工具列表 (支持筛选、分页)
     - `GET /api/tools/categories` - 获取工具分类
     - `GET /api/tools/:id` - 获取单个工具
     - `POST /api/tools` - 添加工具 (管理员)
     - `PUT /api/tools/:id` - 更新工具 (管理员)
     - `DELETE /api/tools/:id` - 删除工具 (管理员)
     - `POST /api/tools/batch` - 批量导入 (管理员)
     - `POST /api/tools/upload-logo` - 上传Logo (管理员)

     **关键词** (3个):
     - `GET /api/keywords` - 获取关键词列表
     - `POST /api/keywords/batch` - 批量导入关键词
     - `DELETE /api/keywords/:id` - 删除关键词

     **访客追踪** (2个):
     - `GET /api/visitors` - 获取访客记录
     - `POST /api/visitors` - 记录新访问

     **统计数据** (1个):
     - `GET /api/stats` - 获取统计数据

     **系统设置** (2个):
     - `GET /api/settings` - 获取系统设置
     - `POST /api/settings` - 更新系统设置

     **归档系统** (3个):
     - `GET /api/archive/dates` - 获取归档日期列表
     - `GET /api/archive/:date` - 获取指定日期数据
     - `DELETE /api/archive/:date` - 删除指定日期归档

     **模板下载** (2个):
     - `GET /api/news/template` - 下载今日资讯模板
     - `GET /api/weekly-news/template` - 下载每周资讯模板

  7. **启动代码**
     ```javascript
     app.listen(PORT, () => {
         console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
         console.log(`📊 API端点:`);
         // 列出所有端点
     });
     ```

---

### 4. 数据存储层

#### data/news.json - 今日资讯数据
- **文件路径**: `/data/news.json`
- **数据结构**:
  ```json
  {
    "news": [
      {
        "id": "2026020512345",
        "title": "文章标题",
        "summary": "文章摘要",
        "key_point": "核心观点",
        "source_url": "https://...",
        "source_name": "来源名称",
        "category": "技术",
        "sub_category": "大语言模型",
        "country": "global",
        "importance_score": 8,
        "is_today": true,
        "published_at": "2026-02-05T09:00:00.000Z",
        "created_at": "2026-02-05T10:30:00.000Z"
      }
    ],
    "lastUpdated": "2026-02-05T10:30:00.000Z",
    "totalCount": 15
  }
  ```
- **读写操作**:
  - **读取**: 所有页面的 `GET /api/news` 调用
  - **写入**:
    - `POST /api/news/batch` - 批量导入时完全替换
    - `DELETE /api/news/:id` - 删除时移除元素
  - **归档**: 调用 `archiveOldNews()` 将旧数据移到 `archive/` 目录

#### data/weekly-news.json - 每周资讯数据
- **文件路径**: `/data/weekly-news.json`
- **数据结构**:
  ```json
  {
    "weeklyNews": [
      {
        "id": "weekly_2026020512345",
        "title": "周刊标题",
        "summary": "摘要",
        "key_point": "核心观点",
        "weekly_category": "tech",
        "week_number": "2026-W06",
        "week_start_date": "2026-02-03",
        "is_weekly_featured": true,
        "published_at": "2026-02-05T09:00:00.000Z",
        "created_at": "2026-02-05T10:30:00.000Z"
      }
    ]
  }
  ```

#### data/tools.json - AI工具数据
- **文件路径**: `/data/tools.json`
- **数据结构**:
  ```json
  {
    "tools": [
      {
        "id": "tool_1234567890",
        "name": "ChatGPT",
        "description": "OpenAI的对话AI",
        "url": "https://chat.openai.com",
        "logo": "logos/chatgpt.png",
        "category": "大语言模型",
        "pricing": "freemium",
        "features": ["对话", "代码生成"],
        "created_at": "2026-02-05T10:30:00.000Z"
      }
    ]
  }
  ```

#### data/keywords.json - 关键词数据
- **文件路径**: `/data/keywords.json`
- **数据结构**:
  ```json
  {
    "keywords": [
      {
        "id": 1707123456789,
        "text": "人工智能",
        "weight": 5,
        "size": "large",
        "created_at": "2026-02-05T10:30:00.000Z"
      }
    ]
  }
  ```

#### data/visitors.json - 访客记录数据
- **文件路径**: `/data/visitors.json`
- **数据结构**:
  ```json
  {
    "visitors": [
      {
        "id": 1707123456789,
        "ip": "123.45.67.89",
        "province": "广东省",
        "country": "中国",
        "date": "2026-02-05T10:30:00.000Z"
      }
    ]
  }
  ```

#### data/settings.json - 系统设置
- **文件路径**: `/data/settings.json`
- **数据结构**:
  ```json
  {
    "siteName": "AI资讯网",
    "dailyNewsCount": 15,
    "weeklyNewsCount": 5,
    "toolsCount": 20,
    "keywordsCount": 30,
    "enableTracking": true,
    "lastUpdated": "2026-02-05T10:30:00.000Z"
  }
  ```

#### data/archive/ - 历史归档目录
- **目录路径**: `/data/archive/`
- **文件命名**: `news-2026-02-04.json`, `weekly-2026-W05.json`
- **数据结构**: 与主文件相同
- **API访问**: `GET /api/archive/:date`

---

### 5. 自动化脚本层

#### scripts/html-to-json-converter.js - HTML转JSON转换器
- **文件路径**: `/scripts/html-to-json-converter.js`
- **功能**: 将日报HTML文件转换为JSON格式
- **输入**:
  - HTML文件路径 (命令行参数)
  - HTML格式: `<div class="article">` 或 `<section style="margin-bottom: 30px">`
- **输出**:
  - JSON文件保存到 `/data/news-YYYY-MM-DD.json`
  - 包含文章数组: title, summary, key_point, source_url, category等

**主要函数**:
```javascript
// 主转换函数
function convertHtmlToJson(htmlFilePath) {
    const html = fs.readFileSync(htmlFilePath, 'utf-8');

    // 提取日期
    const titleMatch = html.match(/<h1[^>]*>.*?(\d{4}-\d{2}-\d{2}).*?<\/h1>/);

    // 提取所有文章section (支持两种格式)
    const articleRegex = /<(div|section)[^>]*(?:class="article"|style="[^"]*margin-bottom:\s*30px[^"]*")[^>]*>(.*?)<\/\1>/gs;
    const sections = html.match(articleRegex) || [];

    const articles = [];
    sections.forEach((section, index) => {
        // 跳过导读section
        if (section.includes('本期导读')) return;

        // 提取标题、摘要、核心观点、来源等
        const titleMatch = section.match(/<h3[^>]*>(.*?)<\/h3>/);
        const summaryMatch = section.match(/【情报速递】.*?<\/p>/s);
        const keyPointMatch = section.match(/【深度研判】.*?(?=<section|<\/section>)/s);
        const sourceMatch = section.match(/🔗\s*来源:\s*([^<\n]+)/);
        const urlMatch = section.match(/🔗\s*原文链接:\s*<a[^>]*href="([^"]*)"/);

        // 生成文章对象
        const article = {
            title: titleMatch ? titleMatch[1].trim() : `文章${index + 1}`,
            key_point: keyPointMatch ? keyPointMatch[0].replace(/<[^>]*>/g, '').trim() : '',
            summary: summaryMatch ? summaryMatch[0].replace(/<[^>]*>/g, '').trim() : '',
            source_url: urlMatch ? urlMatch[1] : '#',
            source_name: sourceMatch ? sourceMatch[1].trim() : 'AI日报',
            category: guessCategory(title, summary),
            sub_category: guessSubCategory(title, summary),
            country: 'global',
            importance_score: guessImportance(title, summary),
            published_at: new Date(dateStr + 'T09:00:00Z').toISOString()
        };

        articles.push(article);
    });

    return articles;
}

// 保存到JSON文件
function saveToJson(articles, outputPath) {
    const json = JSON.stringify(articles, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');
}

// 命令行调用
// node scripts/html-to-json-converter.js /path/to/report.html
```

**调用关系**:
- 被 `sync-reports-to-website.sh` 调用
- 读取: `/var/www/html/reports/AI_Daily_YYYY-MM-DD.html`
- 生成: `/var/www/ai-coming-website/data/news-YYYY-MM-DD.json`

---

#### sync-reports-to-website.sh - 日报同步脚本
- **文件路径**: `/sync-reports-to-website.sh`
- **功能**: 自动同步最新日报到网站
- **运行频率**: 每天 09:05 (通过cron)

**工作流程**:
```bash
#!/bin/bash

# 1. 配置变量
REPORT_SOURCE_DIR="/var/www/html/reports"
PROJECT_DIR="/var/www/ai-coming-website"
API_URL="http://localhost:3000/api/news/batch"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123456"

# 2. 查找最新的HTML文件
LATEST_HTML=$(find "$REPORT_SOURCE_DIR" -name "*.html" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)

# 3. 调用转换器
node scripts/html-to-json-converter.js "$LATEST_HTML"
# 生成: data/news-YYYY-MM-DD.json

# 4. 获取管理员Token
token=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 5. 包装JSON为API期望格式
node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('$json_file', 'utf-8')); fs.writeFileSync('$wrapped_json', JSON.stringify({articles: data}, null,2));"

# 6. 导入到网站
curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d @"$wrapped_json"

# 7. 归档已处理的HTML文件
mv "$LATEST_HTML" "$PROJECT_DIR/reports-archive/"
```

**文件交互**:
- **读取**: `/var/www/html/reports/AI_Daily_*.html` (最新的一个)
- **调用**: `scripts/html-to-json-converter.js`
- **读取生成的JSON**: `data/news-*.json`
- **API调用**: `POST /api/news/batch`
- **写入归档**: `reports-archive/AI_Daily_*.html`
- **日志写入**: `logs/report-sync.log`

---

#### setup-report-sync.sh - 同步设置脚本
- **文件路径**: `/setup-report-sync.sh`
- **功能**: 一键设置日报同步服务
- **运行时机**: 首次部署或重新配置时

**工作流程**:
```bash
#!/bin/bash

# 1. 设置脚本权限
chmod +x sync-reports-to-website.sh

# 2. 创建必要目录
mkdir -p "$REPORT_SOURCE_DIR"
mkdir -p "$PROJECT_DIR/reports-archive"
mkdir -p "$PROJECT_DIR/logs"

# 3. 测试运行一次（可选）
# 检测源目录文件数量
# 询问用户是否立即同步

# 4. 设置cron定时任务
# 删除旧任务
(crontab -l 2>/dev/null | grep -v "sync-reports-to-website") | crontab -

# 添加新任务: 每天9:05
(crontab -l 2>/dev/null; echo "5 9 * * * $SYNC_SCRIPT >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -
```

**文件交互**:
- **修改**: crontab (添加定时任务)
- **创建目录**: reports-archive/, logs/
- **调用**: sync-reports-to-website.sh (测试运行)

---

### 6. 配置文件

#### .env - 环境变量配置
- **文件路径**: `/.env`
- **功能**: 存储敏感配置信息
- **内容示例**:
  ```bash
  PORT=3000
  JWT_SECRET=your-secret-key-change-in-production
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=admin123456

  # Qwen API配置
  QWEN_API_KEY=your-qwen-api-key
  QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation

  # 数据库配置 (如果使用MySQL模式)
  # DB_HOST=localhost
  # DB_PORT=3306
  # DB_NAME=ai_news
  # DB_USER=root
  # DB_PASSWORD=password
  ```
- **使用**:
  - `server-json.js` 通过 `process.env` 读取
  - 不提交到Git (在.gitignore中)

#### package.json - 项目依赖配置
- **文件路径**: `/package.json`
- **功能**: 定义项目元信息和依赖
- **主要内容**:
  ```json
  {
    "name": "ai-coming-website",
    "version": "1.0.0",
    "description": "AI资讯网站",
    "main": "server-json.js",
    "scripts": {
      "start": "node server-json.js",
      "start:legacy": "node server.js",
      "dev": "nodemon server-json.js"
    },
    "dependencies": {
      "express": "^4.18.2",
      "jsonwebtoken": "^9.0.0",
      "bcryptjs": "^2.4.3",
      "cors": "^2.8.5"
    }
  }
  ```
- **使用**:
  - `npm install` - 安装依赖
  - `npm start` - 启动服务器

---

## 完整数据流向图

### 用户访问流程
```
用户浏览器
    ↓
[HTML页面] (index.html / news.html / etc.)
    ↓ 加载 <script src="js/main.js">
[js/main.js]
    ↓ window.addEventListener('DOMContentLoaded')
页面初始化
    ↓ 调用 API
[HTTP请求] → GET /api/news
    ↓
[server-json.js] - Express服务器
    ↓ readData(NEWS_FILE)
[data/news.json] - 读取JSON文件
    ↓ 返回 JSON
[HTTP响应] ← JSON数据
    ↓
[js/main.js] - renderNewsCards(newsData)
    ↓ 生成HTML
[DOM更新] - 插入到页面
    ↓
用户看到内容
```

### 管理员操作流程 (批量导入资讯)
```
管理员
    ↓ 打开 admin.html
[登录界面]
    ↓ 输入用户名密码
[POST /api/auth/login]
    ↓ {username, password}
[server-json.js]
    ↓ 验证用户名密码
    ↓ 生成JWT token
[响应] ← {token: "eyJhbGciOiJIUzI1NiIs..."}
    ↓ 保存到 localStorage
localStorage.setItem('adminToken', token)
    ↓
[管理界面] - 导入功能
    ↓ 选择JSON文件
[js/main.js] - 提取文件内容
    ↓ POST /api/news/batch
    ↓ Headers: Authorization: Bearer {token}
    ↓ Body: {articles: [...]}
[server-json.js]
    ↓ authenticateToken 中间件
    ↓ 验证JWT token
    ↓ archiveOldNews() - 归档旧数据
    ↓ writeData(NEWS_FILE, newData) - 写入新数据
[data/archive/news-2026-02-04.json] - 旧数据归档
[data/news.json] - 新数据替换
    ↓ 响应成功
[响应] ← {message: "成功导入 15 篇新闻"}
    ↓
[js/main.js] - 显示成功提示
    ↓ 刷新数据
[GET /api/news]
    ↓
更新页面显示
```

### 日报自动同步流程 (定时任务)
```
系统定时任务 (Cron)
    ↓ 每天 09:05
[cron - 5 9 * * *]
    ↓ 执行脚本
[sync-reports-to-website.sh]
    ↓ 1. 查找最新HTML
find /var/www/html/reports -name "*.html" -type f | sort -rn | head -1
    ↓ 找到: AI_Daily_2026-02-05.html
    ↓ 2. 调用转换器
node scripts/html-to-json-converter.js AI_Daily_2026-02-05.html
    ↓ 读取HTML
[AI_Daily_2026-02-05.html]
    ↓ 解析 <div class="article"> 提取内容
    ↓ 生成JSON数组
[生成: data/news-2026-02-05.json]
    ↓ 3. 获取Token
curl -X POST http://localhost:3000/api/auth/login
    ↓ 返回 token
    ↓ 4. 包装JSON数据
node -e "JSON.stringify({articles: data})"
    ↓ 5. 导入到网站
curl -X POST http://localhost:3000/api/news/batch \
    -H "Authorization: Bearer {token}" \
    -d @wrapped-import.json
    ↓
[server-json.js]
    ↓ authenticateToken 验证
    ↓ archiveOldNews() 归档旧资讯
    ↓ writeData(NEWS_FILE, newArticles) 写入新资讯
[data/news.json] - 更新今日资讯
[data/archive/news-2026-02-04.json] - 归档旧资讯
    ↓ 6. 归档HTML文件
mv AI_Daily_2026-02-05.html reports-archive/
    ↓ 7. 记录日志
echo "[2026-02-05 09:05:01] ✨ 同步完成！" >> logs/report-sync.log
    ↓
完成 - 用户访问 news.html 可看到新资讯
```

### 访客追踪流程 (自动化)
```
任何用户访问任何HTML页面
    ↓
[HTML页面] - <script src="js/main.js"></script>
    ↓
js/main.js - window.addEventListener('load', trackVisit)
    ↓
[trackVisit 函数]
    ↓ 1. 获取IP地址
fetch('https://api.ipify.org?format=json')
    ↓ 返回: {ip: "123.45.67.89"}
    ↓ 2. 调用淘宝IP API
fetch(`http://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`)
    ↓ 返回: {data: {region: '广东'}}
    ↓ 3. 发送到服务器
POST /api/visitors
Body: {ip: "123.45.67.89", province: "广东省", country: "中国"}
    ↓
[server-json.js]
    ↓ readData(VISITORS_FILE)
    ↓ 添加新访问记录
    ↓ writeData(VISITORS_FILE, updatedData)
[data/visitors.json] - 新增记录
    ↓
[响应] ← {success: true}
    ↓
管理员访问 visitors.html 查看统计
    ↓ GET /api/visitors
[server-json.js] - readData(VISITORS_FILE)
    ↓ 返回所有访客记录
[visitors.html] - 渲染地域分布图
```

---

## 关键API端点与文件映射表

| API端点 | HTTP方法 | 读取文件 | 写入文件 | 功能描述 |
|---------|---------|---------|---------|---------|
| `/api/auth/login` | POST | - | - | 验证用户，返回JWT token |
| `/api/news` | GET | news.json | - | 获取今日资讯列表 |
| `/api/news/batch` | POST | news.json | news.json, archive/*.json | 批量导入资讯(自动归档) |
| `/api/news/:id` | DELETE | news.json | news.json | 删除单条资讯 |
| `/api/weekly-news` | GET | weekly-news.json | - | 获取每周资讯 |
| `/api/weekly-news` | POST | - | weekly-news.json | 创建每周资讯 |
| `/api/weekly-news/:id` | PUT | weekly-news.json | weekly-news.json | 更新每周资讯 |
| `/api/weekly-news/:id` | DELETE | weekly-news.json | weekly-news.json | 删除每周资讯 |
| `/api/weekly-news/batch` | POST | weekly-news.json | weekly-news.json, archive/*.json | 批量导入(自动归档) |
| `/api/tools` | GET | tools.json | - | 获取AI工具列表 |
| `/api/tools` | POST | - | tools.json | 添加工具(需认证) |
| `/api/tools/:id` | PUT | tools.json | tools.json | 更新工具(需认证) |
| `/api/tools/:id` | DELETE | tools.json | tools.json | 删除工具(需认证) |
| `/api/tools/batch` | POST | - | tools.json | 批量导入工具(需认证) |
| `/api/keywords` | GET | keywords.json | - | 获取关键词列表 |
| `/api/keywords/batch` | POST | - | keywords.json | 批量导入关键词(需认证) |
| `/api/keywords/:id` | DELETE | keywords.json | keywords.json | 删除关键词(需认证) |
| `/api/visitors` | GET | visitors.json | - | 获取访客记录 |
| `/api/visitors` | POST | visitors.json | visitors.json | 记录新访问 |
| `/api/stats` | GET | news.json, visitors.json | - | 获取统计数据 |
| `/api/settings` | GET | settings.json | - | 获取系统设置 |
| `/api/settings` | POST | settings.json | settings.json | 更新系统设置(需认证) |
| `/api/archive/dates` | GET | archive/ 目录 | - | 获取归档日期列表 |
| `/api/archive/:date` | GET | archive/news-:date.json | - | 获取指定日期数据 |
| `/api/archive/:date` | DELETE | archive/news-:date.json | - | 删除指定日期归档(需认证) |

---

## 启动顺序与依赖关系

### 首次部署启动顺序

1. **安装依赖**
   ```bash
   npm install
   ```
   - 读取: `package.json`
   - 生成: `node_modules/` 目录

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```
   - 创建: `.env`

3. **初始化数据文件** (自动)
   ```bash
   node server-json.js
   ```
   - `initDataFiles()` 函数自动创建:
     - `data/news.json`
     - `data/weekly-news.json`
     - `data/tools.json`
     - `data/keywords.json`
     - `data/visitors.json`
     - `data/settings.json`
     - `data/archive/` 目录

4. **启动服务器**
   ```bash
   npm start
   # 或
   pm2 start server-json.js --name ai-news-system
   ```
   - 读取: `.env`, `data/*.json`
   - 启动: HTTP服务器在端口3000

5. **配置日报同步** (可选)
   ```bash
   ./setup-report-sync.sh
   ```
   - 设置: cron定时任务
   - 创建: `reports-archive/`, `logs/` 目录

### 正常运行时的文件读取顺序

```
服务器启动
    ↓
读取 .env
    ↓
读取所有 data/*.json
    ↓
启动HTTP服务
    ↓
等待请求

用户请求到达
    ↓
server-json.js 路由分发
    ↓
读取对应JSON文件
    ↓
处理请求
    ↓ (如果是写操作)
写入JSON文件
    ↓
返回响应
```

---

## 故障排查指南

### 问题1: 前端页面无法加载数据

**检查步骤**:
1. 检查浏览器控制台是否有错误
2. 检查 `js/main.js` 是否正确加载
3. 检查API请求是否成功 (Network标签)
4. 检查 `server-json.js` 是否正在运行
5. 检查 `data/*.json` 文件是否存在且格式正确

**相关文件**:
- HTML页面: `index.html`, `news.html` 等
- 前端逻辑: `js/main.js`
- 后端服务: `server-json.js`
- 数据文件: `data/news.json` 等

### 问题2: 管理员登录失败

**检查步骤**:
1. 检查 `.env` 中的用户名密码
2. 检查 `server-json.js` 的认证逻辑
3. 检查JWT_SECRET配置
4. 检查token是否过期

**相关文件**:
- 环境配置: `.env`
- 认证逻辑: `server-json.js` (authenticateToken函数)
- 前端登录: `js/main.js` (login函数)

### 问题3: 日报同步失败

**检查步骤**:
1. 检查 `/var/www/html/reports/` 目录是否有HTML文件
2. 手动运行 `./sync-reports-to-website.sh` 查看错误
3. 检查 `scripts/html-to-json-converter.js` 的正则表达式是否匹配HTML结构
4. 检查API是否可访问
5. 查看日志 `logs/report-sync.log`

**相关文件**:
- 同步脚本: `sync-reports-to-website.sh`
- 转换器: `scripts/html-to-json-converter.js`
- 设置脚本: `setup-report-sync.sh`
- 日志文件: `logs/report-sync.log`
- 源HTML: `/var/www/html/reports/AI_Daily_*.html`
- 目标JSON: `data/news-*.json`

### 问题4: 修改数据后页面不更新

**检查步骤**:
1. 检查是否成功写入 `data/*.json` 文件
2. 清除浏览器缓存
3. 检查前端是否重新调用API
4. 检查服务器是否需要重启 (PM2: `pm2 restart ai-news-system`)

**相关文件**:
- 数据文件: `data/news.json` 等
- 前端逻辑: `js/main.js`
- 服务器: `server-json.js`

---

## 总结

### 核心文件

1. **前端核心**: `js/main.js` (1500行) - 所有页面的逻辑控制器
2. **后端核心**: `server-json.js` (2022行) - API服务器
3. **数据存储**: `data/*.json` (7个JSON文件)
4. **自动化**: `sync-reports-to-website.sh` + `html-to-json-converter.js`

### 交互关系

```
用户 → HTML → main.js → API → server-json.js → JSON文件
                     ↑                        ↓
                     └─────── 数据返回 ←───────┘

外部HTML → sync脚本 → 转换器 → JSON → API → server-json.js → 数据库
  ↑                                              ↓
  └─────────────── Cron定时任务 ←──────────────┘
```

### 数据流向

1. **读取数据**: JSON文件 → server-json.js → API → main.js → 页面渲染
2. **写入数据**: 管理员操作 → main.js → API → server-json.js → JSON文件
3. **自动同步**: 外部HTML → 转换器 → JSON → API → server-json.js → JSON文件
