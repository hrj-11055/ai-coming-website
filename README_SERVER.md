# AI资讯管理系统 - 服务器端版本

## 概述
这是AI资讯管理系统的服务器端版本，使用Node.js + Express + SQLite实现真正的数据持久化存储。

## 技术栈
- **后端**: Node.js + Express
- **数据库**: SQLite（开发）/ MySQL（生产）
- **前端**: HTML + CSS + JavaScript
- **认证**: JWT Token

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
npm start
```

### 3. 访问系统
- 前端页面: http://localhost:3000
- 管理后台: http://localhost:3000/data-manager.html

## 默认账户
- 用户名: `admin`
- 密码: `admin123456`

## 数据存储
- 数据库文件: `./data/ai_news.db`
- 数据目录: `./data/`
- 上传文件: `./uploads/`

## API接口

### 认证
- `POST /api/auth/login` - 管理员登录

### 关键词管理
- `GET /api/keywords` - 获取关键词列表
- `POST /api/keywords` - 添加关键词
- `PUT /api/keywords/:id` - 更新关键词
- `DELETE /api/keywords/:id` - 删除关键词
- `POST /api/keywords/batch` - 批量导入关键词

### 新闻管理
- `GET /api/news` - 获取新闻列表
- `POST /api/news` - 添加新闻
- `PUT /api/news/:id` - 更新新闻
- `DELETE /api/news/:id` - 删除新闻
- `POST /api/news/batch` - 批量导入新闻

### 数据管理
- `GET /api/stats` - 获取统计数据
- `GET /api/backup` - 数据备份
- `POST /api/restore` - 数据恢复

## 部署到阿里云

### 1. 准备服务器
- 阿里云ECS实例
- 安装Node.js和MySQL
- 配置域名和SSL证书

### 2. 修改配置
```javascript
// server.js
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_NAME = process.env.DB_NAME || 'ai_news';
```

### 3. 数据库迁移
```bash
# 从SQLite迁移到MySQL
npm run migrate:mysql
```

### 4. 部署
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start server.js --name "ai-news-api"
pm2 startup
pm2 save
```

## 数据迁移

### 从localStorage迁移
1. 在旧系统中导出数据
2. 使用管理后台的导入功能
3. 数据会自动同步到服务器

### 备份和恢复
- 备份: 访问 `/api/backup` 获取完整数据
- 恢复: 使用管理后台的恢复功能

## 开发模式
```bash
npm run dev
```

## 文件结构
```
├── server.js              # 主服务器文件
├── api.js                 # API服务层
├── package.json           # 依赖配置
├── data/                  # 数据目录
│   └── ai_news.db        # SQLite数据库
├── uploads/               # 上传文件目录
├── index.html             # 前端页面
├── data-manager.html      # 管理后台
└── start.bat             # Windows启动脚本
```

## 注意事项
1. 确保 `data/` 目录有写入权限
2. 生产环境请修改JWT密钥
3. 定期备份数据库文件
4. 监控服务器资源使用情况

## 故障排除

### 数据库连接失败
- 检查 `data/` 目录是否存在
- 确保有写入权限

### API请求失败
- 检查服务器是否启动
- 查看控制台错误信息
- 检查网络连接

### 认证失败
- 检查JWT密钥配置
- 确认用户账户存在
- 检查密码是否正确

