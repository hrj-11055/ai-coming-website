# 代码同步指南

## 📂 目录说明

**本地 Mac**: `/Users/MarkHuang/ai-coming-website`
**服务器**: `/var/www/ai-coming-website`

## 🔄 同步方式

### 方式1: 手动同步代码到服务器（推荐）

当你修改了代码（.js, .html, .css等）后，运行：

```bash
./sync-code-to-server.sh
```

**这会：**
1. 同步所有代码文件到服务器
2. 自动重启服务器Node.js服务
3. 排除不需要同步的文件（node_modules, data等）

### 方式2: 仅同步单个文件

```bash
# 同步单个文件
scp server-json.js root@8.135.37.159:/var/www/ai-coming-website/

# 重启服务
ssh root@8.135.37.159 "cd /var/www/ai-coming-website && lsof -ti:3000 | xargs kill -9 2>/dev/null; nohup node server-json.js > /tmp/server-json.log 2>&1 &"
```

### 方式3: 服务器数据同步到Mac（自动）

Mac上已设置自动同步守护进程，每60秒从服务器拉取数据：

```bash
# 查看同步日志
tail -f /tmp/aicoming-sync.log

# 手动触发同步
./sync-data-daemon.sh
```

## 📊 同步内容说明

### 需要同步到服务器的（代码文件）
- ✅ `*.js` - JavaScript代码
- ✅ `*.html` - HTML页面
- ✅ `*.css` - 样式文件
- ✅ `*.sh` - Shell脚本
- ✅ `config/` - 配置文件
- ✅ `scripts/` - 脚本文件

### 不需要同步的（自动生成/数据）
- ❌ `node_modules/` - npm依赖包
- ❌ `data/` - 数据文件（单独同步）
- ❌ `*.log` - 日志文件
- ❌ `.git/` - Git仓库
- ❌ `package-lock.json` - 锁定文件

### 从服务器同步到Mac的（数据文件）
- ✅ `data/*.json` - 数据文件
- ✅ `data/archive/` - 归档文件
- ✅ `/var/www/json/report/*.json` - JSON日报

## 🔄 完整工作流程

### 修改代码后

```bash
# 1. 编辑本地代码
vim server-json.js

# 2. 同步到服务器
./sync-code-to-server.sh

# 3. 验证（自动完成）
curl http://8.135.37.159:3000/api/news/dates
```

### 服务器有新数据后

```bash
# 自动同步（无需手动）
# 数据会自动从服务器同步到Mac本地

# 查看同步状态
tail -f /tmp/aicoming-sync.log
```

## 🚨 重要提示

1. **代码修改**: Mac → 服务器（手动执行 `sync-code-to-server.sh`）
2. **数据同步**: 服务器 → Mac（自动每60秒）
3. **JSON日报**: 服务器自动同步到项目目录（每60秒）

## 📋 相关脚本

- `sync-code-to-server.sh` - 代码同步到服务器
- `sync-data-daemon.sh` - 数据同步守护进程
- `setup-server-sync.sh` - 服务器端自动同步设置
