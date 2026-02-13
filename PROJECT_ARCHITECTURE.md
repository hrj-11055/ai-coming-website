# AI资讯管理系统 - 项目架构说明文档

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 项目文件结构](#3-项目文件结构)
- [4. 核心文件说明](#4-核心文件说明)
- [5. 文件调用关系](#5-文件调用关系)
- [6. 系统架构](#6-系统架构)
- [7. API接口说明](#7-api接口说明)
- [8. 数据流向](#8-数据流向)
- [9. 启动流程](#9-启动流程)
- [10. 扩展指南](#10-扩展指南)

---

## 1. 项目概述

### 1.1 项目简介

**AI资讯管理系统** 是一个企业级的内容管理系统，专门用于管理和展示AI相关的新闻资讯、工具库和关键词云。系统支持前后端分离架构，提供完整的管理后台和用户访问追踪功能。

### 1.2 核心功能

- **资讯管理**: 每日快讯、每周资讯的发布和管理
- **关键词云**: 动态关键词展示和权重管理
- **AI工具库**: AI工具的展示、分类和搜索
- **用户追踪**: 基于IP的地理位置统计和访问分析
- **管理后台**: 完整的后台管理系统和数据分析

### 1.3 项目版本

- **当前版本**: 2.0.0
- **开发模式**: JSON文件存储 / MySQL数据库存储（双模式支持）

---

## 2. 技术栈

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| HTML5 | - | 页面结构 |
| CSS3 | - | 样式设计 |
| JavaScript (ES6+) | - | 前端交互逻辑 |
| Chart.js | 4.4.0 | 数据可视化图表 |
| Font Awesome | 6.4.0 | 图标库 |
| Tailwind CSS | CDN | 响应式布局 |

### 2.2 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | - | 运行时环境 |
| Express | 4.18.2 | Web框架 |
| JWT | 9.0.2 | 用户认证 |
| bcryptjs | 2.4.3 | 密码加密 |
| cors | 2.8.5 | 跨域处理 |
| dotenv | 16.6.1 | 环境变量 |
| MySQL2 | 3.16.2 | 数据库驱动（MySQL模式） |
| nodemon | 3.0.1 | 开发热重载 |

### 2.3 数据存储

- **JSON模式**: 使用本地JSON文件存储（默认）
- **MySQL模式**: 使用MySQL数据库存储（生产环境推荐）

---

## 3. 项目文件结构

```
ai-coming-website/website/
├── 📄 前端页面 (HTML)
│   ├── index.html                    # 主页面 (37KB) - 资讯首页
│   ├── news.html                     # 新闻详情页 (16KB)
│   ├── admin-login.html              # 管理员登录页 (11KB)
│   ├── admin-analytics.html          # 地理位置统计页 (20KB)
│   └── footer.html                   # 页脚组件 (378B)
│
├── 🎨 样式文件
│   └── styles.css                    # 全局样式表 (12KB)
│
├── 💻 JavaScript文件
│   ├── main.js                       # 前端主逻辑 (54KB)
│   ├── api.js                        # API客户端 (8.2KB)
│   ├── server-json.js                # 后端服务器-JSON模式 (60KB) ⭐核心
│   ├── server-mysql.js               # 后端服务器-MySQL模式 (18KB)
│   ├── server.js                     # 后端服务器-旧版 (16KB)
│   └── admin-accounts-secure.js      # 管理员账号配置 (765B)
│
├── ⚙️ 配置文件
│   ├── package.json                  # 项目依赖配置
│   ├── .env                          # 环境变量配置
│   ├── .env.example                  # 环境变量模板
│   ├── run.sh                        # 一键启动脚本
│   └── start.sh                      # 启动脚本
│
├── 📁 数据目录 (data/)
│   ├── admins.json                   # 管理员账号数据
│   ├── keywords.json                 # 关键词数据
│   ├── news.json                     # 每日快讯数据
│   ├── weekly-news.json              # 每周资讯数据
│   ├── tools.json                    # AI工具数据
│   ├── tool-categories.json          # 工具分类数据
│   ├── settings.json                 # 系统设置
│   ├── visit-logs.json               # 访问日志数据 ⭐新增
│   └── archive/                      # 历史归档
│       ├── daily/                    # 每日归档
│       └── weekly/                   # 每周归档
│
├── 🔧 配置目录 (config/)
│   ├── database.js                   # 数据库配置
│   └── system-prompt.txt             # 系统提示词
│
├── 📜 脚本目录 (scripts/)
│   ├── auto-upload-news.js           # 自动上传脚本
│   └── migrate-data.js               # 数据迁移脚本
│
├── 🗄️ 数据库 (database/)
│   └── schema.sql                    # MySQL数据库结构
│
├── 🖼️ 资源目录
│   ├── logos/                        # AI工具Logo图片 (42个文件)
│   └── pic/                          # 项目图片
│
├── 📦 备份目录 (backup/)
│   ├── admin-dashboard-backup.html
│   ├── admin-login-backup.html
│   └── ...
│
└── 📚 文档目录
    ├── README.md                     # 项目说明
    ├── RUN_GUIDE.md                  # 运行指南 ⭐新增
    ├── LOCATION_TRACKING_GUIDE.md    # 地理位置追踪指南 ⭐新增
    ├── PROJECT_ARCHITECTURE.md       # 项目架构说明 ⭐本文档
    ├── API-SETUP-GUIDE.md            # API配置指南
    ├── MYSQL-SETUP-GUIDE.md          # MySQL配置指南
    └── ...
```

---

## 4. 核心文件说明

### 4.1 前端页面文件

#### index.html (37KB)
**作用**: 系统主页面，展示AI资讯和关键词云

**核心功能**:
- 关键词云动态展示
- 今日快讯列表
- 每周资讯列表
- AI工具搜索
- 访问追踪自动上报
- 管理后台入口

**引用文件**:
```html
<script src="main.js"></script>
<link rel="stylesheet" href="styles.css">
```

**关键元素**:
- `<div id="keywordWall">` - 关键词云容器
- `<div id="todayNews">` - 今日快讯容器
- `<div id="weeklyNews">` - 每周资讯容器
- `<div class="footer">` - 包含管理后台链接

#### news.html (16KB)
**作用**: 新闻详情页面

**核心功能**:
- 展示完整新闻内容
- 支持多媒体内容

#### admin-login.html (11KB)
**作用**: 管理员登录页面

**核心功能**:
- 用户名密码登录
- JWT Token存储
- 自动登录检测
- 登录状态管理

**调用API**:
```javascript
POST /api/auth/login
```

#### admin-analytics.html (20KB)
**作用**: 地理位置统计管理页面 ⭐新增

**核心功能**:
- 省份访问统计展示
- Chart.js柱状图可视化
- 详细访问日志查询
- 数据筛选和分页
- 旧日志清理

**调用API**:
```javascript
GET  /api/visit/province-stats  // 省份统计
GET  /api/visit/logs            // 访问日志
DELETE /api/visit/logs/cleanup  // 清理日志
```

### 4.2 前端JavaScript文件

#### main.js (54KB) ⭐核心前端文件
**作用**: 前端主逻辑控制

**主要模块**:

```javascript
// 1. 访问追踪模块 (lines 1-25)
async function trackVisit() {
    fetch('/api/visit/track', { method: 'POST' })
}

// 2. 关键词管理模块 (lines 50-200)
function initKeywords()
function generateWordCloud()
function updateKeywordWeight()

// 3. 新闻加载模块 (lines 250-450)
function loadNewsData()
function renderNewsItem()
function filterArticles()

// 4. 每周资讯模块 (lines 500-700)
function loadWeeklyNewsData()
function filterByCategory()

// 5. AI工具搜索模块 (lines 750-950)
function searchTools()
function renderTools()
```

**调用API列表**:
```javascript
GET  /api/keywords           // 获取关键词
GET  /api/news               // 获取快讯
GET  /api/weekly-news        // 获取每周资讯
GET  /api/tools              // 获取工具列表
GET  /api/tools/categories   // 获取工具分类
POST /api/visit/track        // 记录访问 ⭐新增
```

**全局变量**:
```javascript
let currentFilter = 'all'      // 当前筛选条件
let currentCategory = 'all'    // 当前分类
let currentTab = 'today'       // 当前标签页
let aiKeywords = []            // 关键词数据
```

#### api.js (8.2KB)
**作用**: API客户端封装

**核心功能**:
- 统一的API请求封装
- 错误处理
- Token管理

**示例**:
```javascript
// API调用示例
async function fetchNews() {
    const response = await fetch('/api/news');
    const data = await response.json();
    return data;
}
```

### 4.3 后端服务器文件

#### server-json.js (60KB) ⭐核心后端文件
**作用**: 主服务器 - JSON文件存储模式

**技术栈**: Node.js + Express + JSON文件存储

**主要模块结构**:

```javascript
// ==================== 初始化模块 (lines 1-150) ====================
require('dotenv').config()           // 环境变量
const app = express()                 // Express应用
const DATA_DIR = path.join(__dirname, 'data')

// 数据文件路径定义 (lines 20-32)
const VISIT_LOGS_FILE = path.join(DATA_DIR, 'visit-logs.json')
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json')
const NEWS_FILE = path.join(DATA_DIR, 'news.json')
// ... 更多文件路径

// 初始化数据文件 (lines 54-105)
function initDataFiles()

// ==================== 认证中间件 (lines 200-280) ====================
function authenticateToken(req, res, next)
function verifyAdmin(req, res, next)

// ==================== API路由模块 ====================

// 1. 认证API (lines 285-308)
POST /api/auth/login                  // 管理员登录

// 2. 关键词API (lines 310-380)
GET    /api/keywords                  // 获取关键词
POST   /api/keywords                  // 添加关键词
DELETE /api/keywords/:id              // 删除关键词

// 3. 新闻管理API (lines 382-553)
GET    /api/news                      // 获取快讯
POST   /api/news/batch                // 批量导入快讯
DELETE /api/news/:id                  // 删除快讯
GET    /api/weekly-news               // 获取每周资讯
POST   /api/weekly-news               // 创建每周资讯
PUT    /api/weekly-news/:id           // 更新每周资讯
DELETE /api/weekly-news/:id           // 删除每周资讯

// 4. 地理位置统计API (lines 555-736) ⭐新增
POST   /api/visit/track               // 记录访问
GET    /api/visit/province-stats      // 省份统计
GET    /api/visit/logs                // 访问日志
DELETE /api/visit/logs/cleanup        // 清理日志

// 5. 统计API (lines 738-770)
GET    /api/stats                     // 系统统计

// 6. 设置API (lines 772-810)
GET    /api/settings                  // 获取设置
POST   /api/settings                  // 更新设置

// 7. 工具管理API (lines 812-950)
GET    /api/tools                     // 获取工具列表
GET    /api/tools/:id                 // 获取工具详情
POST   /api/tools                     // 添加工具
PUT    /api/tools/:id                 // 更新工具
DELETE /api/tools/:id                 // 删除工具
POST   /api/tools/batch               // 批量导入工具
POST   /api/tools/upload-logo         // 上传Logo

// 8. 归档API (lines 952-1050)
GET    /api/archive/dates             // 获取归档日期列表
GET    /api/archive/:date             // 获取指定日期数据
DELETE /api/archive/:date             // 删除归档数据
```

**核心函数**:

```javascript
// 1. IP地址解析 (lines 572-600) ⭐新增
async function getProvinceFromIP(ip)

// 2. 数据读写 (lines 124-143)
function readData(filename)
function writeData(filename, data)

// 3. ID生成 (lines 107-121)
function generateId(type = 'daily')

// 4. 归档功能 (lines 146-198)
function archiveOldNews()
function archiveWeeklyNews()
```

**中间件链**:
```javascript
app.use(cors())                        // 跨域处理
app.use(express.json())                // JSON解析
app.use(express.static(...))           // 静态文件服务
app.use(authenticateToken)             // 认证中间件（特定路由）
```

**启动流程**:
```javascript
1. 加载环境变量
2. 创建Express应用
3. 初始化数据文件 (initDataFiles)
4. 配置中间件
5. 注册API路由
6. 启动服务器 (app.listen)
```

#### server-mysql.js (18KB)
**作用**: MySQL数据库模式服务器

**差异点**:
- 使用MySQL代替JSON文件
- 数据库连接池管理
- SQL查询代替文件读写

**数据库配置**:
```javascript
{
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}
```

#### server.js (16KB)
**作用**: 旧版服务器（已废弃）

### 4.4 数据文件

#### data/admins.json
管理员账号数据

```json
[
    {
        "id": 1,
        "username": "admin",
        "password_hash": "$2a$10$...",
        "role": "super_admin",
        "created_at": "2026-02-05T01:58:16.859Z"
    }
]
```

#### data/visit-logs.json ⭐新增
访问日志数据

```json
[
    {
        "id": 1707123456789,
        "ip": "123.45.67.89",
        "province": "广东省",
        "country": "中国",
        "date": "2025-02-05T10:30:00.000Z",
        "userAgent": "Mozilla/5.0..."
    }
]
```

#### data/keywords.json
关键词云数据

```json
[
    {
        "id": 1707123456789,
        "text": "人工智能",
        "weight": 5,
        "size": "large",
        "created_at": "2025-02-05T10:30:00.000Z"
    }
]
```

#### data/news.json
每日快讯数据

#### data/weekly-news.json
每周资讯数据

#### data/tools.json
AI工具数据

### 4.5 配置文件

#### .env
环境变量配置

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# JWT配置
JWT_SECRET=ai-coming-secret-key

# 管理员账号
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123456

# 数据库配置（MySQL模式）
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_news_system

# API配置
SILICONFLOW_API_KEY=sk-...
QWEN_API_KEY=sk-...
```

#### package.json
项目依赖配置

```json
{
  "name": "ai-news-backend",
  "version": "2.0.0",
  "main": "server-json.js",
  "scripts": {
    "start": "node server-mysql.js",
    "start:dev": "nodemon server-mysql.js",
    "start:legacy": "node server-json.js",      // JSON模式
    "dev": "nodemon server-mysql.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.16.2"
  }
}
```

---

## 5. 文件调用关系

### 5.1 前端文件调用链

```
用户访问
    ↓
index.html
    ├── <link href="styles.css">          # 加载样式
    ├── <script src="main.js">            # 加载主逻辑
    └── <div id="keywordWall">            # 关键词云容器
            ↓
        main.js 执行
            ├── trackVisit()              # 自动上报访问
            │   └── POST /api/visit/track
            ├── initKeywords()            # 初始化关键词
            │   └── GET /api/keywords
            ├── loadNewsData()            # 加载快讯
            │   └── GET /api/news
            └── loadWeeklyNewsData()      # 加载每周资讯
                └── GET /api/weekly-news
```

### 5.2 管理后台调用链

```
用户点击"管理后台"
    ↓
admin-analytics.html
    ├── 检查登录状态
    │   ├── 未登录 → 跳转 admin-login.html
    │   └── 已登录 → 加载数据
    └── 加载数据
        ├── loadProvinceStats()
        │   └── GET /api/visit/province-stats
        └── loadLogs()
            └── GET /api/visit/logs

admin-login.html
    ├── 用户提交登录表单
    ├── POST /api/auth/login
    ├── 保存Token到localStorage
    └── 跳转回 admin-analytics.html
```

### 5.3 后端处理流程

```
HTTP请求到达
    ↓
server-json.js
    ↓
中间件处理
    ├── cors()                    # 跨域检查
    ├── express.json()            # JSON解析
    └── authenticateToken()       # Token验证（部分路由）
    ↓
路由匹配
    ├── /api/auth/*              # 认证路由
    ├── /api/keywords/*          # 关键词路由
    ├── /api/news/*              # 新闻路由
    ├── /api/visit/*             # 访问统计 ⭐新增
    └── ...
    ↓
业务逻辑处理
    ├── 读取JSON文件 (readData)
    ├── 处理业务逻辑
    └── 写入JSON文件 (writeData)
    ↓
返回响应
    └── res.json(data)
```

### 5.4 数据流向图

```
┌─────────────┐
│   前端页面   │
│  (HTML/JS)  │
└──────┬──────┘
       │ HTTP请求
       ↓
┌─────────────┐
│  API路由层   │
│ (server.js) │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  业务逻辑层  │
│  (Controllers)│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  数据访问层  │
│ (Data Layer) │
└──────┬──────┘
       │
    ┌──┴──┐
    ↓     ↓
┌────┐ ┌──────┐
│JSON│ │ MySQL│
│File│ │  DB  │
└────┘ └──────┘
```

---

## 6. 系统架构

### 6.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户层 (User Layer)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐      │
│  │ 普通用户  │  │ 管理员   │  │   访客追踪系统    │      │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘      │
└───────┼─────────────┼─────────────────┼────────────────┘
        │             │                 │
┌───────┴─────────────┴─────────────────┴────────────────┐
│                  前端展示层 (Frontend)                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────────────┐    │
│  │index.html │  │news.html  │  │admin-analytics   │    │
│  │ main.js   │  │styles.css │  │admin-login.html  │    │
│  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘    │
└────────┼──────────────┼─────────────────┼───────────────┘
         │              │                 │
         │              │                 │
┌────────┴──────────────┴─────────────────┴───────────────┐
│                API网关层 (API Gateway)                  │
│              Express.js + CORS + JWT                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  /api/auth  │ /api/news │ /api/visit │ ...      │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────┐
│              业务逻辑层 (Business Logic)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐      │
│  │ Auth Module │ │ News Module │ │Visit Module  │      │
│  │ Keyword Mgr │ │  Tool Mgr   │ │Stats Module  │      │
│  └─────────────┘ └─────────────┘ └──────────────┘      │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────┐
│              数据持久层 (Data Persistence)               │
│         ┌─────────────┐         ┌─────────────┐         │
│         │ JSON Files  │         │   MySQL     │         │
│         │ (Dev Mode)  │         │ (Prod Mode) │         │
│         └─────────────┘         └─────────────┘         │
└──────────────────────────────────────────────────────────┘
```

### 6.2 分层架构说明

#### 层级1: 用户层 (User Layer)
- **普通用户**: 浏览资讯、搜索工具
- **管理员**: 登录后台、管理内容、查看统计
- **访客追踪**: 自动记录访问信息

#### 层级2: 前端展示层 (Presentation Layer)
- **页面组件**: HTML页面结构
- **样式层**: CSS样式设计
- **交互逻辑**: JavaScript业务逻辑

#### 层级3: API网关层 (API Gateway)
- **路由管理**: Express路由
- **跨域处理**: CORS中间件
- **认证授权**: JWT Token验证

#### 层级4: 业务逻辑层 (Business Logic)
- **认证模块**: 登录、Token验证
- **内容模块**: 新闻、关键词、工具管理
- **统计模块**: 访问统计、数据分析

#### 层级5: 数据持久层 (Data Persistence)
- **JSON存储**: 开发环境
- **MySQL存储**: 生产环境

### 6.3 模块化设计

```
┌─────────────────────────────────────────────┐
│           核心模块划分                      │
├─────────────────────────────────────────────┤
│  📢 内容管理模块                            │
│  ├── 关键词管理 (keywords)                  │
│  ├── 每日快讯 (daily news)                  │
│  ├── 每周资讯 (weekly news)                 │
│  └── 内容归档 (archive)                     │
│                                             │
│  🛠️ 工具管理模块                           │
│  ├── 工具列表 (tools list)                  │
│  ├── 工具分类 (categories)                  │
│  ├── Logo上传 (logo upload)                 │
│  └── 工具搜索 (search)                      │
│                                             │
│  🔐 认证授权模块                            │
│  ├── 用户登录 (login)                       │
│  ├── Token管理 (JWT)                        │
│  ├── 权限验证 (auth)                        │
│  └── 密码加密 (bcrypt)                      │
│                                             │
│  📊 统计分析模块 ⭐新增                     │
│  ├── 访问追踪 (visit tracking)              │
│  ├── 地理位置 (IP location)                 │
│  ├── 省份统计 (province stats)              │
│  └── 数据可视化 (visualization)             │
│                                             │
│  ⚙️ 系统配置模块                            │
│  ├── 系统设置 (settings)                    │
│  ├── 环境变量 (env config)                  │
│  └── 数据迁移 (migration)                   │
└─────────────────────────────────────────────┘
```

---

## 7. API接口说明

### 7.1 认证相关 API

```
POST /api/auth/login
功能: 管理员登录
请求体: { username, password }
响应: { success, token, user }
认证: 不需要
```

### 7.2 关键词管理 API

```
GET /api/keywords
功能: 获取关键词列表
响应: [{ id, text, weight, size, ... }]

POST /api/keywords
功能: 添加关键词
请求体: { text, weight, size }
认证: 需要

DELETE /api/keywords/:id
功能: 删除关键词
认证: 需要
```

### 7.3 新闻管理 API

```
GET /api/news
功能: 获取每日快讯
查询参数: ?limit=20
响应: [{ id, title, content, importance_score, ... }]

POST /api/news/batch
功能: 批量导入快讯
请求体: [{ title, content, source, ... }]
认证: 需要

GET /api/weekly-news
功能: 获取每周资讯
查询参数: ?category=技术&limit=10
响应: [{ id, title, category, content, ... }]

POST /api/weekly-news
功能: 创建每周资讯
请求体: { title, category, content, ... }
认证: 需要
```

### 7.4 地理位置统计 API ⭐新增

```
POST /api/visit/track
功能: 记录用户访问
响应: { success, province }
认证: 不需要
说明: 自动获取IP并识别省份

GET /api/visit/province-stats
功能: 获取省份统计数据
响应: { total, provinceStats: [{ province, count }] }
认证: 需要

GET /api/visit/logs
功能: 获取访问日志
查询参数: ?page=1&limit=20&province=广东省
响应: { logs: [...], pagination: {...} }
认证: 需要

DELETE /api/visit/logs/cleanup
功能: 清理旧日志
查询参数: ?days=30
响应: { success, deleted, remaining }
认证: 需要
```

### 7.5 工具管理 API

```
GET /api/tools
功能: 获取AI工具列表
查询参数: ?category=设计&search=AI&page=1
响应: { tools: [...], total, pagination }

GET /api/tools/categories
功能: 获取工具分类
响应: [{ id, name, count }]

POST /api/tools
功能: 添加工具
请求体: { name, category, description, website, ... }
认证: 需要

POST /api/tools/upload-logo
功能: 上传工具Logo
请求类型: multipart/form-data
认证: 需要
```

### 7.6 系统设置 API

```
GET /api/settings
功能: 获取系统设置
响应: { todayNewsDisplayCount, autoArchiveEnabled, ... }

POST /api/settings
功能: 更新系统设置
请求体: { todayNewsDisplayCount: 20, ... }
认证: 需要
```

### 7.7 归档管理 API

```
GET /api/archive/dates
功能: 获取历史归档日期列表
响应: { dates: ["2025-01-15", "2025-01-16"] }

GET /api/archive/:date
功能: 获取指定日期的历史数据
响应: { daily: [...], weekly: [...] }

DELETE /api/archive/:date
功能: 删除指定日期的归档
认证: 需要
```

---

## 8. 数据流向

### 8.1 用户访问流程

```
1. 用户访问 index.html
   ↓
2. main.js 自动执行 trackVisit()
   ↓
3. POST /api/visit/track
   ├─ 获取用户IP
   ├─ 调用 getProvinceFromIP(ip)
   │   └─ 淘宝IP接口 → 省份名称
   ├─ 检查今日是否已记录（去重）
   └─ 写入 visit-logs.json
   ↓
4. 加载页面内容
   ├─ GET /api/keywords → 渲染关键词云
   ├─ GET /api/news → 渲染今日快讯
   └─ GET /api/weekly-news → 渲染每周资讯
```

### 8.2 管理员登录流程

```
1. 访问 admin-analytics.html
   ↓
2. 检查 localStorage.getItem('admin_token')
   ├─ 存在 → 加载数据
   └─ 不存在 → 跳转 admin-login.html
   ↓
3. 输入用户名密码
   ↓
4. POST /api/auth/login
   ├─ 读取 admins.json
   ├─ bcrypt.compareSync(password, hash)
   ├─ 生成 JWT Token (24h有效)
   └─ 返回 { token, user }
   ↓
5. 保存 Token
   localStorage.setItem('admin_token', token)
   ↓
6. 跳转回 admin-analytics.html
   ↓
7. 使用 Token 访问受保护API
   GET /api/visit/province-stats
   Headers: Authorization: Bearer {token}
```

### 8.3 内容管理流程

```
添加新闻流程:
1. 管理员登录后台
2. POST /api/news/batch
   Headers: Authorization: Bearer {token}
   Body: [{ title, content, source, ... }]
   ↓
3. server-json.js 处理
   ├─ authenticateToken() 验证Token
   ├─ 读取 news.json
   ├─ 生成唯一ID
   ├─ 添加时间戳
   └─ 写入 news.json
   ↓
4. 返回成功响应
   ↓
5. 前端刷新列表
   GET /api/news
```

---

## 9. 启动流程

### 9.1 服务器启动流程

```
执行: npm start
或: npm run start:legacy (JSON模式)
↓
1. Node.js 加载 server-json.js
↓
2. require('dotenv').config()
   └─ 读取 .env 文件
↓
3. 创建 Express 应用
   const app = express()
↓
4. 配置中间件
   app.use(cors())
   app.use(express.json())
   app.use(express.static('.'))
↓
5. initDataFiles() - 初始化数据文件
   ├─ 检查 data/*.json 是否存在
   ├─ 不存在则创建空文件
   └─ 初始化默认管理员账号
       └─ 读取 .env 中的 DEFAULT_ADMIN_*
       └─ bcrypt.hashSync(password)
       └─ 写入 admins.json
↓
6. 注册API路由
   app.post('/api/auth/login', ...)
   app.get('/api/keywords', ...)
   ... (约30个API端点)
↓
7. 启动HTTP服务器
   app.listen(PORT)
   └─ 默认: http://localhost:3000
↓
8. 控制台输出
   ├─ ✅ 系统提示词已加载
   ├─ Default admin initialized
   ├─ 服务器运行在 http://localhost:3000
   └─ API文档列表
```

### 9.2 前端加载流程

```
用户访问: http://localhost:3000
↓
1. 浏览器请求 index.html
↓
2. Express静态文件服务返回 index.html
↓
3. 浏览器解析HTML
   ├─ <link href="styles.css"> → 加载样式
   ├─ <script src="main.js"> → 加载脚本
   └─ 渲染DOM结构
↓
4. main.js 执行
   ├─ trackVisit() → POST /api/visit/track
   ├─ initKeywords() → GET /api/keywords
   ├─ generateWordCloud() → 渲染关键词
   └─ loadNewsData() → GET /api/news
↓
5. 页面完全加载完成
```

### 9.3 环境变量加载顺序

```
1. 系统环境变量
   process.env
↓
2. .env 文件
   dotenv.config()
↓
3. 代码默认值
   const PORT = process.env.PORT || 3000
```

---

## 10. 扩展指南

### 10.1 添加新的API端点

**步骤**:

1. 在 `server-json.js` 中添加路由
```javascript
app.get('/api/new-endpoint', (req, res) => {
    // 业务逻辑
    res.json({ data: 'response' });
});
```

2. 如果需要认证，添加中间件
```javascript
app.get('/api/new-endpoint', authenticateToken, (req, res) => {
    // 业务逻辑
});
```

3. 在前端 `main.js` 中调用
```javascript
async function callNewAPI() {
    const response = await fetch('/api/new-endpoint');
    const data = await response.json();
    return data;
}
```

### 10.2 添加新的数据模型

**步骤**:

1. 在 `initDataFiles()` 中初始化文件
```javascript
const NEW_MODEL_FILE = path.join(DATA_DIR, 'new-model.json');
if (!fs.existsSync(NEW_MODEL_FILE)) {
    fs.writeFileSync(NEW_MODEL_FILE, JSON.stringify([]));
}
```

2. 创建CRUD API
```javascript
// 创建
app.post('/api/new-model', (req, res) => {
    const data = readData(NEW_MODEL_FILE);
    const newItem = { id: Date.now(), ...req.body };
    data.push(newItem);
    writeData(NEW_MODEL_FILE, data);
    res.json(newItem);
});

// 读取
app.get('/api/new-model', (req, res) => {
    const data = readData(NEW_MODEL_FILE);
    res.json(data);
});

// 更新
app.put('/api/new-model/:id', (req, res) => {
    const data = readData(NEW_MODEL_FILE);
    const index = data.findIndex(item => item.id === req.params.id);
    if (index !== -1) {
        data[index] = { ...data[index], ...req.body };
        writeData(NEW_MODEL_FILE, data);
        res.json(data[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// 删除
app.delete('/api/new-model/:id', (req, res) => {
    const data = readData(NEW_MODEL_FILE);
    const filtered = data.filter(item => item.id !== req.params.id);
    writeData(NEW_MODEL_FILE, filtered);
    res.json({ success: true });
});
```

### 10.3 切换到MySQL模式

**步骤**:

1. 安装MySQL并创建数据库
```bash
mysql -u root -p < database/schema.sql
```

2. 配置 `.env` 文件
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ai_news_system
```

3. 启动MySQL模式服务器
```bash
npm start  # 默认启动 server-mysql.js
```

### 10.4 部署到生产环境

**步骤**:

1. 使用 `deploy-linux.sh` 脚本
```bash
chmod +x deploy-linux.sh
./deploy-linux.sh
```

2. 或手动部署
```bash
# 设置环境变量
export NODE_ENV=production

# 启动服务
npm run start:prod

# 使用PM2管理进程
pm2 start server-mysql.js --name "ai-news-system"
```

### 10.5 添加新的前端页面

**步骤**:

1. 创建HTML文件 `new-page.html`
2. 引入样式和脚本
```html
<link rel="stylesheet" href="styles.css">
<script src="main.js"></script>
<script src="custom.js"></script>
```

3. 在 `index.html` 中添加链接
```html
<a href="new-page.html">新页面</a>
```

### 10.6 自定义样式

**方法**:

1. 直接修改 `styles.css`
2. 或创建自定义CSS文件
```html
<link rel="stylesheet" href="custom-styles.css">
```

3. 使用Tailwind CSS CDN（已集成）
```html
<div class="flex items-center justify-center p-4 bg-blue-500">
    <!-- 内容 -->
</div>
```

---

## 附录

### A. 文件大小统计

| 文件 | 大小 | 说明 |
|------|------|------|
| server-json.js | 60KB | 最大的后端文件，包含所有API |
| main.js | 54KB | 最大的前端文件，包含所有交互逻辑 |
| index.html | 37KB | 主页面 |
| admin-analytics.html | 20KB | 统计页面 ⭐新增 |
| server-mysql.js | 18KB | MySQL模式服务器 |
| styles.css | 12KB | 全局样式 |
| news.html | 16KB | 新闻页 |
| admin-login.html | 11KB | 登录页 |
| api.js | 8.2KB | API封装 |

### B. API端点数量统计

- **认证API**: 1个
- **关键词API**: 3个
- **新闻API**: 9个
- **工具API**: 7个
- **统计API**: 2个
- **访问统计API**: 4个 ⭐新增
- **设置API**: 2个
- **归档API**: 3个
- **总计**: 约31个API端点

### C. 依赖包清单

```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",        // 密码加密
    "cors": "^2.8.5",            // 跨域处理
    "dotenv": "^16.6.1",         // 环境变量
    "express": "^4.18.2",        // Web框架
    "jsonwebtoken": "^9.0.2",    // JWT认证
    "mysql2": "^3.16.2"          // MySQL驱动
  },
  "devDependencies": {
    "nodemon": "^3.0.1"          // 热重载
  }
}
```

### D. 端口使用情况

- **开发环境**: 3000 (默认)
- **生产环境**: 通过环境变量 `PORT` 配置

### E. 数据文件清单

| 文件 | 用途 | 格式 |
|------|------|------|
| admins.json | 管理员账号 | JSON数组 |
| keywords.json | 关键词云数据 | JSON数组 |
| news.json | 每日快讯 | JSON数组 |
| weekly-news.json | 每周资讯 | JSON数组 |
| tools.json | AI工具库 | JSON数组 |
| tool-categories.json | 工具分类 | JSON数组 |
| settings.json | 系统设置 | JSON对象 |
| visit-logs.json | 访问日志 ⭐新增 | JSON数组 |

---

## 更新日志

### v2.0.0 (2025-02-05) - 地理位置统计版本

**新增功能**:
- ✨ 用户访问追踪系统
- ✨ IP地址自动识别省份
- ✨ 地理位置统计分析
- ✨ 管理员登录系统
- ✨ 可视化数据图表

**新增文件**:
- admin-login.html (11KB)
- admin-analytics.html (20KB)
- data/visit-logs.json
- LOCATION_TRACKING_GUIDE.md
- RUN_GUIDE.md
- PROJECT_ARCHITECTURE.md (本文档)

**新增API**:
- POST /api/visit/track
- GET /api/visit/province-stats
- GET /api/visit/logs
- DELETE /api/visit/logs/cleanup

---

## 联系方式

- **项目**: AI资讯管理系统
- **版本**: 2.0.0
- **最后更新**: 2025-02-05
- **文档维护**: 开发团队

---

**文档结束**
