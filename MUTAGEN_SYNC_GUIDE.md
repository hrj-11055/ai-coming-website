# Mutagen 双向同步使用指南

## 📋 已创建的文件

### 1. 配置文件
- **mutagen.yml** - Mutagen 同步配置模板（需要手动填入服务器信息）
- **sync-setup.sh** - 自动配置脚本（推荐使用）

### 2. 测试脚本
- **test-sync.sh** - 同步效果测试脚本

---

## 🚀 快速开始（3步）

### 步骤 1: 配置 SSH 连接（如果还没有）

```bash
# 复制 SSH 公钥到服务器（实现无密码登录）
ssh-copy-id user@your-server-ip

# 测试连接
ssh user@your-server-ip
```

### 步骤 2: 运行同步设置脚本

```bash
# 方式A: 交互式配置（推荐）
./sync-setup.sh

# 脚本会提示你输入:
# - 服务器地址: user@hostname (例如: root@192.168.1.100)
# - 服务器路径: /var/www/ai-coming-website (默认)
```

### 步骤 3: 测试同步效果

```bash
./test-sync.sh
```

---

## 📝 手动配置（可选）

如果你想手动配置而不是使用脚本：

### 1. 编辑 mutagen.yml

```bash
# 编辑配置文件
nano mutagen.yml
```

修改这两行：
```yaml
# 第13行，填入服务器信息
destination: YOUR_USERNAME@YOUR_SERVER_IP:/var/www/ai-coming-website
```

### 2. 启动同步

```bash
# 创建同步会话
mutagen sync create -c mutagen.yml

# 查看状态
mutagen sync list
```

---

## 🔧 常用命令

### 查看同步状态
```bash
# 简洁查看
mutagen sync list

# 详细信息
mutagen sync list ai-website

# 项目模式
mutagen project list
```

### 控制同步
```bash
# 暂停同步
mutagen sync pause ai-website
mutagen project pause

# 恢复同步
mutagen sync resume ai-website
mutagen project resume

# 终止同步
mutagen sync terminate ai-website
mutagen project terminate

# 手动触发同步
mutagen sync flush ai-website
```

### 查看日志
```bash
# 查看同步日志
mutagen sync list ai-website

# 清除同步状态（强制重新扫描）
mutagen sync flush ai-website
```

---

## 📂 同步规则说明

### 会同步的内容：
✅ 所有源代码文件 (.js, .html, .css)
✅ 配置文件 (.json, .yml, .sh)
✅ data/ 目录（数据文件）
✅ logos/ 目录（资源文件）
✅ README.md, CLAUDE.md（重要文档）

### 不会同步的内容：
❌ node_modules/（依赖包）
❌ .env（环境变量，需在服务器单独配置）
❌ backup/（备份文件）
❌ test-*.html, debug.html（测试文件）
❌ server.js, server-ubuntu.js（旧版服务器）
❌ .git/（版本控制）
❌ *.log（日志文件）

---

## 🎯 同步效果测试

运行完整测试：
```bash
./test-sync.sh
```

测试包括：
1. ✅ Mac → 服务器 文件创建同步
2. ✅ 服务器 → Mac 文件创建同步
3. ✅ 文件修改同步
4. ✅ 大文件同步（1MB）

---

## ⚙️ 服务器配置

同步完成后，需要在服务器上配置环境：

### 1. 安装依赖
```bash
ssh user@server
cd /var/www/ai-coming-website
npm install --production
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
nano .env
```

必需配置：
```bash
PORT=3000
JWT_SECRET=your-secret-key-here
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123456
```

### 3. 启动网站
```bash
# 使用PM2（推荐）
npm install -g pm2
pm2 start server-json.js --name "ai-news-system"
pm2 save
pm2 startup

# 或直接运行
node server-json.js
```

---

## 🔍 故障排查

### 问题1: SSH连接失败
```bash
# 检查SSH配置
ssh -v user@server

# 复制SSH密钥
ssh-copy-id user@server
```

### 问题2: 同步状态显示错误
```bash
# 查看详细错误信息
mutagen sync list ai-website

# 重启同步会话
mutagen sync terminate ai-website
mutagen sync create -c mutagen.yml
```

### 问题3: 文件没有同步
```bash
# 检查文件是否被忽略
# 查看 mutagen.yml 中的 ignore 规则

# 手动触发同步
mutagen sync flush ai-website
```

### 问题4: 权限问题
```bash
# 在服务器上设置正确的权限
sudo chown -R user:group /var/www/ai-coming-website
chmod -R 755 /var/www/ai-coming-website
```

---

## 📊 同步性能优化

### 当前配置：
- ✅ 批量模式：开启（batchMode: true）
- ✅ 扫描模式：完整扫描（scanMode: full）
- ✅ 冲突策略：保留新版本（conflictStrategy: newer）

### 调优建议：
如果同步频繁，可以调整：
```yaml
# 在 mutagen.yml 中添加
watch:
  mode: portable
  pollingInterval: 10s
```

---

## 🔄 完整工作流程

```bash
# 1. 在 Mac 上修改代码
vim main.js

# 2. 自动同步到服务器（无需手动操作）
# Mutagen 会自动检测并同步

# 3. 在服务器上查看（可选）
ssh user@server "cat /var/www/ai-coming-website/main.js"

# 4. 重启服务（如果需要）
pm2 restart ai-news-system
```

---

## 📱 实时监控

### 查看实时状态
```bash
# 持续监控同步状态
watch -n 2 'mutagen sync list'
```

### 日志监控
```bash
# 查看服务器日志
ssh user@server "pm2 logs ai-news-system"
```

---

## ✅ 检查清单

部署前检查：
- [ ] SSH 密钥已配置
- [ ] 服务器目录已创建
- [ ] Mutagen 同步会话已创建
- [ ] 同步测试通过
- [ ] 服务器已安装 Node.js
- [ ] 已运行 npm install
- [ ] .env 文件已配置
- [ ] 网站服务已启动
- [ ] 可以通过浏览器访问

---

## 🎉 成功标志

当一切正常时，你应该看到：

```bash
$ mutagen sync list
Name: ai-website
Identifier: ...
Status: Watching for changes
Alpha: /Users/MarkHuang/ai-coming-website
Beta: user@server:/var/www/ai-coming-website

┌────────────────────────────────────────────────────┐
│ Bandwidth   │ Files  │ Files  │ Bytes     │ Bytes  │
│ saved      │ scanned│ changed│ received  │ sent   │
├─────────────┼────────┼────────┼───────────┼────────┤
│ ~0 B/s     │ ...    │ ...    │ ...       │ ...    │
└─────────────┴────────┴────────┴───────────┴────────┘

Status: Ok
```

状态显示 **"Status: Ok"** 表示同步正常工作！
