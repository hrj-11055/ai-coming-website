# 服务器文件对比分析

## 📊 三个服务器文件对比

| 特性 | server.js | server-json.js ⭐ | server-mysql.js |
|------|-----------|------------------|-----------------|
| **代码行数** | 496行 | 2022行 (4倍) | 538行 |
| **数据库** | SQLite3 | JSON文件 | MySQL |
| **API端点数** | ~11个 | ~41个 (近4倍) | ~30个 |
| **状态** | ❌ 已弃用 | ✅ 当前使用 | ✅ 生产环境 |
| **新功能** | ❌ 无 | ✅ 完整 | ✅ 完整 |

---

## 🔍 详细对比

### server.js (旧版本 - 496行)

**数据库**: SQLite3 (`sqlite3` 库)
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(DATA_DIR, 'ai_news.db'), ...);
```

**API端点** (约11个):
- POST /api/auth/login
- GET /api/keywords
- POST /api/keywords
- DELETE /api/keywords/:id
- POST /api/keywords/batch
- GET /api/news
- POST /api/news
- DELETE /api/news/:id
- POST /api/news/batch
- GET /api/stats
- GET /api/backup
- POST /api/restore

**缺失功能**:
- ❌ 访问追踪 (visit-logs)
- ❌ IP封禁管理 (banned-ips)
- ❌ 归档系统 (archive)
- ❌ 每周资讯管理 (weekly-news)
- ❌ AI工具管理 (tools)
- ❌ 系统设置 (settings)

**问题**:
1. 使用 SQLite3 需要额外的数据库文件
2. 功能不完整，缺少很多新特性
3. 代码较旧，不再维护

---

### server-json.js (当前使用 - 2022行) ⭐

**数据库**: JSON文件
```javascript
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const VISIT_LOGS_FILE = path.join(DATA_DIR, 'visit-logs.json');
// ... 直接读写JSON文件
```

**API端点** (约41个):

**认证** (1个):
- POST /api/auth/login

**关键词** (3个):
- GET /api/keywords
- POST /api/keywords
- DELETE /api/keywords/:id

**新闻** (9个):
- GET /api/news
- POST /api/news
- DELETE /api/news/:id
- POST /api/news/batch
- GET /api/weekly-news
- POST /api/weekly-news
- PUT /api/weekly-news/:id
- DELETE /api/weekly-news/:id
- POST /api/weekly-news/batch

**访问统计** ⭐新增 (4个):
- POST /api/visit/track
- GET /api/visit/province-stats
- GET /api/visit/logs
- DELETE /api/visit/logs/cleanup

**工具管理** (7个):
- GET /api/tools
- GET /api/tools/:id
- POST /api/tools
- PUT /api/tools/:id
- DELETE /api/tools/:id
- POST /api/tools/batch
- POST /api/tools/upload-logo

**IP封禁** ⭐新增 (4个):
- GET /api/banned-ips
- POST /api/banned-ips
- DELETE /api/banned-ips/:id
- GET /api/banned-ips/check

**系统** (2个):
- GET /api/settings
- POST /api/settings

**归档** (3个):
- GET /api/archive/dates
- GET /api/archive/:date
- DELETE /api/archive/:date

**统计** (2个):
- GET /api/stats
- GET /api/stats/dashboard

**工具分类** (2个):
- GET /api/tools/categories
- POST /api/tools/categories

**优势**:
- ✅ 无需数据库，使用JSON文件存储
- ✅ 功能完整，包含所有新特性
- ✅ 开发环境友好，数据容易查看和修改
- ✅ 自动初始化数据文件
- ✅ 有访问追踪、IP封禁、归档等高级功能

---

### server-mysql.js (生产环境 - 538行)

**数据库**: MySQL
```javascript
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});
```

**特点**:
- ✅ 使用MySQL数据库，性能更好
- ✅ 适合生产环境
- ✅ 支持并发访问
- ❌ 需要额外安装和配置MySQL

---

## 💡 为什么 server.js 可以删除？

### 1. 功能过时
server.js 是早期的版本，只有496行代码，缺少大量新功能：
- 没有访问追踪系统 (visit-logs)
- 没有IP封禁管理 (banned-ips)
- 没有归档系统 (archive)
- 没有每周资讯管理
- 没有AI工具管理

### 2. 使用不同的数据库
- server.js: SQLite3 (需要 `ai_news.db` 文件)
- server-json.js: JSON文件 (当前使用)
- server-mysql.js: MySQL (生产环境)

### 3. package.json 配置
```json
{
  "scripts": {
    "start": "node server-mysql.js",      // MySQL模式
    "start:legacy": "node server-json.js", // JSON模式 ⭐当前使用
    "start:dev": "nodemon server-json.js"
  }
}
```
注意：没有 `server.js` 的启动命令！

### 4. 代码对比

**server.js 的典型API** (简单):
```javascript
app.get('/api/news', (req, res) => {
    db.all('SELECT * FROM news ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
```

**server-json.js 的对应API** (功能更完整):
```javascript
app.get('/api/news', (req, res) => {
    let news = readData(NEWS_FILE);

    // 支持筛选
    if (country === 'china' || country === 'global') {
        news = news.filter(item => item.country === country);
    }

    // 支持分页
    const limit = parseInt(req.query.limit) || 20;
    news = news.slice(0, limit);

    // 支持排序
    news.sort((a, b) => b.importance_score - a.importance_score);

    res.json(news);
});
```

---

## 🎯 推荐的部署策略

### 开发环境
```bash
npm run start:legacy  # 使用 server-json.js
```
- ✅ 无需数据库
- ✅ 数据容易查看和修改
- ✅ 快速启动

### 生产环境
```bash
npm start  # 使用 server-mysql.js
```
- ✅ MySQL性能更好
- ✅ 支持高并发
- ✅ 数据更安全

---

## ✅ 结论

**server.js 确实可以删除**，因为：

1. ❌ 它是旧版本，使用SQLite数据库
2. ❌ 功能不完整，只有11个API端点
3. ❌ 没有package.json中的启动脚本
4. ❌ 缺少所有新功能（访问追踪、IP封禁、归档等）
5. ✅ 已被 server-json.js 完全替代

**保留的服务器**:
- ✅ `server-json.js` (2022行) - 当前主推，JSON存储
- ✅ `server-mysql.js` (538行) - 生产环境，MySQL存储

**删除的服务器**:
- ❌ `server.js` (496行) - 旧版本，SQLite，功能过时
- ❌ `server-ubuntu.js` (38行) - 只改了HOST配置，可合并到 server-json.js

---

## 🔄 如果你想切换数据库

### 从 server.js (SQLite) 迁移到 server-json.js (JSON)

你的数据已经在 `data/` 目录中，无需迁移！
- server.js 使用 `data/ai_news.db` (SQLite文件)
- server-json.js 使用 `data/*.json` (JSON文件)

如果你一直在用 server.json，说明数据已经是JSON格式了。

### 从 JSON 迁移到 MySQL

项目提供了迁移脚本：
```bash
npm run db:migrate  # 运行 scripts/migrate-data.js
```

---

## 📝 总结

| 文件 | 状态 | 原因 |
|------|------|------|
| server.js | ❌ 删除 | 旧版SQLite，功能不完整 |
| server-ubuntu.js | ❌ 删除 | 只改了HOST配置，可合并 |
| server-json.js | ✅ 保留 | 当前使用，功能完整 |
| server-mysql.js | ✅ 保留 | 生产环境，MySQL数据库 |
