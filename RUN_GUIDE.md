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
npm start              # MySQL 模式
npm run start:legacy   # JSON 模式
npm run start:dev      # 开发模式

# 数据库初始化 (仅 MySQL 模式)
npm run db:init

# 安装项目依赖
npm install

# 测试模型对比
npm run test:models
```

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
