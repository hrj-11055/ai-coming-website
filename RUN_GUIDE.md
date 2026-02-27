# 快速启动指南

## 一键运行脚本

项目已配置好一键运行脚本 `run.sh`,支持多种启动模式。

### 基本用法

```bash
# 默认模式 - 使用 JSON 文件存储(无需数据库)
./run.sh

# 开发模式 - 使用 nodemon 自动重启
./run.sh --dev

# MySQL 数据库模式 - 需要配置数据库
./run.sh --mysql
```

### 访问信息

- **网站地址**: http://localhost:3000
- **默认管理员**: admin / admin123456

### 模式说明

#### 1. JSON 模式 (默认)
- 无需安装和配置 MySQL
- 使用 JSON 文件存储数据
- 适合快速测试和开发
- 数据存储在 `data/` 目录

#### 2. MySQL 模式
- 需要先安装和配置 MySQL
- 性能更好,适合生产环境
- 首次使用需要初始化数据库:
  ```bash
  npm run db:init
  ```

#### 3. 开发模式
- 使用 nodemon 自动重启
- 代码修改后自动生效
- 适合开发调试

### 其他命令

```bash
# 直接使用 npm 命令
npm start              # JSON 模式（默认）
npm run start:legacy   # JSON 模式（兼容别名）
npm run start:mysql    # MySQL 模式（仅迁移/验证使用）
npm run start:dev      # 开发模式

# 数据库初始化 (仅 MySQL 模式)
npm run db:init

# 安装项目依赖
npm install

# 测试模型对比
npm run test:models
```

### 前端模块化调试（news.html）

`news.html` 现通过 ES Module 入口加载：

- 入口：`frontend/bootstrap.js`
- 兼容桥接：`frontend/modules/compat-globals.js`
- 核心实现：`frontend/modules/core-news.js`

定位问题时优先顺序：
1. `frontend/modules/core-news.js`（业务逻辑）
2. `frontend/modules/compat-globals.js`（`window` 兼容导出）
3. `news.html` 内联事件/初始化脚本

### 注意事项

1. **端口配置**: 默认端口 3000,可在 `.env` 文件中修改 `PORT` 变量
2. **停止服务**: 在终端按 `Ctrl+C` 停止服务器
3. **环境配置**: 如需修改配置,编辑 `.env` 文件
4. **数据备份**: JSON 模式下定期备份 `data/` 目录

### 故障排除

**问题**: 端口被占用
```bash
# 查找占用进程
lsof -i :3000
# 杀死进程
kill -9 <PID>
```

**问题**: 依赖安装失败
```bash
# 清除缓存重新安装
rm -rf node_modules package-lock.json
npm install
```

**问题**: MySQL 连接失败
- 检查 MySQL 服务是否启动
- 检查 `.env` 中的数据库配置
- 使用 JSON 模式作为替代方案

**问题**: SSH 能连端口但握手阶段断开（`kex_exchange_identification`）
- 高概率是本地 TUN 代理干扰 SSH 握手（不是服务器挂了）
- 优先关闭本地代理 TUN，再重试 `ssh -vvv <host>`
- 完整排障记录见：
  - `docs/SSH_TUN_PROXY_INCIDENT_2026-02-27.md`

### MySQL 迁移建议

- 当前主线固定为 JSON 存储。
- 仅在需要迁移时使用 MySQL：
  - `npm run db:init`
  - `npm run db:migrate`
  - `npm run start:mysql`
