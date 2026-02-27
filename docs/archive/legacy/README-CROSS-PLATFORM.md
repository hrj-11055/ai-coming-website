# AI News Management System - Setup Guide

跨平台运行指南（Windows / macOS / Linux）

## Prerequisites 前置要求

- **Node.js**: v14.0.0 或更高版本
- **npm**: v6.0.0 或更高版本
- **Git**: （可选）用于版本控制

## Quick Start 快速开始

### 1. Install Dependencies 安装依赖

```bash
npm install
```

### 2. Configure Environment Variables 配置环境变量

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred settings
# Default settings are already configured
```

### 3. Start the Server 启动服务器

**macOS / Linux:**
```bash
# Option 1: Using npm script (Recommended)
npm start

# Option 2: Using shell script
./start.sh
```

**Windows:**
```cmd
# Option 1: Using npm script (Recommended)
npm start

# Option 2: Using batch script
start-server.bat
```

### 4. Access the System 访问系统

- **Main Website**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/data-manager.html
- **Keyword Manager**: http://localhost:3000/keyword-manager.html

## Default Credentials 默认凭据

```
Username: admin
Password: admin123456
```

⚠️ **Important**: 请在生产环境中修改默认密码！

## Development Mode 开发模式

Install nodemon for auto-restart on file changes:

```bash
npm run dev
# or
npm run start:dev
```

## Production Mode 生产模式

```bash
npm run start:prod
```

## Environment Variables 环境变量

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `STATIC_ROOT` | Static files directory | . (current directory) |
| `JWT_SECRET` | JWT signing secret | (required) |
| `DEFAULT_ADMIN_USERNAME` | Default admin username | admin |
| `DEFAULT_ADMIN_PASSWORD` | Default admin password | admin123456 |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | 10 |

## Project Structure 项目结构

```
website/
├── server-json.js           # Main server file
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables (create from .env.example)
├── .env.example             # Environment variables template
├── start.sh                 # macOS/Linux startup script
├── start-server.bat         # Windows startup script
├── data/                    # Data storage directory
│   ├── keywords.json        # Keyword configurations
│   ├── news.json            # News articles
│   ├── weekly-news.json     # Weekly news articles
│   ├── tools.json           # AI tools database
│   ├── settings.json        # System settings
│   └── admins.json          # Admin accounts
├── index.html               # Main homepage
├── aicoming_demo.html       # Demo word cloud interface
├── tools.html               # AI tools interface
├── admin-login.html         # Admin authentication
├── data-manager.html        # Data management interface
└── styles.css               # Main stylesheet
```

## Available Scripts 可用脚本

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run start:dev` | Same as `npm run dev` |
| `npm run start:prod` | Start in production mode |
| `npm run install:env` | Copy .env.example to .env |

## Troubleshooting 故障排除

### Port 3000 already in use 端口3000已被占用

**macOS / Linux:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Windows:**
```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

Or use a different port:
```bash
PORT=3001 npm start
```

### JWT_SECRET not set JWT_SECRET未设置

Make sure `.env` file exists and contains:
```
JWT_SECRET=your-secret-key-here
```

### Module not found errors 找不到模块

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### sqlite3 compilation issues sqlite3编译问题

If you encounter errors related to sqlite3:

```bash
# Rebuild native modules
npm rebuild sqlite3

# Or clean reinstall
rm -rf node_modules package-lock.json
npm install
```

## Security Notes 安全注意事项

1. **Change default password** in production
2. **Use strong JWT_SECRET** in production
3. **Don't commit .env file** to version control
4. **Enable HTTPS** in production
5. **Keep dependencies updated**

## Updating Dependencies 更新依赖

```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update major versions (use with caution)
npx npm-check-updates -u
npm install
```

## System Requirements 系统要求

### Minimum Requirements 最低要求
- **RAM**: 512MB
- **Disk Space**: 500MB
- **CPU**: Single core

### Recommended Requirements 推荐配置
- **RAM**: 2GB or more
- **Disk Space**: 1GB or more
- **CPU**: Dual core or more

## Support & Documentation 支持与文档

For feature documentation, see `README.md`

## License 许可证

MIT License

---

**让一部分人先用起来** - AIcoming 动态热点词云系统
