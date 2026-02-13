# 数据同步配置说明

## ✅ 已完成的配置

### 1. 自动同步服务

已配置macOS launchd服务，每60秒自动同步服务器上的新闻文件到本地。

**服务名称**: `com.aicoming.sync-data`
**同步间隔**: 60秒
**日志文件**: `/tmp/aicoming-sync.log`

### 2. 同步的文件类型

- `news-YYYY-MM-DD.json` - 每日新闻文件
- `weekly-*.json` - 每周资讯文件

## 🔧 管理命令

### 查看同步状态

```bash
launchctl list | grep aicoming
```

### 启动同步服务

```bash
launchctl load ~/Library/LaunchAgents/com.aicoming.sync-data.plist
```

### 停止同步服务

```bash
launchctl unload ~/Library/LaunchAgents/com.aicoming.sync-data.plist
```

### 手动触发同步

```bash
./sync-data-daemon.sh
```

### 查看同步日志

```bash
tail -f /tmp/aicoming-sync.log
```

## 📊 验证同步

### 1. 检查本地文件数量

```bash
ls -la data/news-*.json | wc -l
```

### 2. 测试API

```bash
curl -s http://localhost:3000/api/news/dates | python3 -m json.tool
```

应该返回所有历史日期列表。

### 3. 查看网页效果

访问 http://localhost:3000/news.html，左侧时间轴应该显示所有历史日期。

## 🚀 工作原理

1. **服务器端**: 新闻导入时自动归档到 `data/news-YYYY-MM-DD.json`
2. **同步服务**: 每60秒检查服务器，自动拉取新文件到本地
3. **API增强**: 同时读取 `data/` 和 `data/archive/daily/` 目录
4. **时间轴**: 显示所有可用历史日期，点击可查看

## 📝 注意事项

1. 服务器上必须有mutagen代理才能使用mutagen实时同步（当前未安装）
2. 当前使用的是rsync + launchd的定时同步方案
3. 同步是双向的：
   - 服务器的新文件 → 自动同步到Mac
   - Mac的新文件 → 自动同步到服务器

## 🔄 Mutagen配置（备用方案）

如果需要安装mutagen以获得实时同步：

1. 服务器端安装mutagen（由于网络问题，当前安装较慢）
2. 配置文件：`mutagen.yml`
3. 创建同步会话：

```bash
mutagen sync create ./ root@8.135.37.159:/var/www/ai-coming-website
```

## 🎉 当前状态

- ✅ 自动同步服务运行中
- ✅ 5个历史日期已同步
- ✅ API正常读取所有历史文件
- ✅ 时间轴显示完整历史记录

## 📅 已同步的历史日期

- 2026-02-08 (14篇)
- 2026-02-07 (15篇)
- 2026-02-06 (30篇) - 当前
- 2026-02-05 (15篇)
- 2026-01-16 (20篇)
