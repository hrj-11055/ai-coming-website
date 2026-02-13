# JSON日报同步配置说明

## 📋 概述

日报已从HTML格式改为JSON格式输出，直接同步到AI资讯板块，无需额外转换。

## 🗂️ 文件路径

### 服务器端
- **原始位置**: `/var/www/json/reports/`
- **文件格式**: `news-YYYY-MM-DD.json` 或 `AI_Daily_YYYY-MM-DD.json`

### 本地
- **同步位置**: `/Users/MarkHuang/ai-coming-website/data/`
- **自动同步**: 每60秒检查一次

## 🔧 已完成的配置

### 1. 服务器目录创建 ✅
```bash
/var/www/json/reports/  # 已创建
```

### 2. 同步脚本更新 ✅
`sync-data-daemon.sh` 已更新，现在会同步：
- `/var/www/ai-coming-website/data/` → 本地 `data/`
- `/var/www/json/reports/` → 本地 `data/`

### 3. 自动同步服务 ✅
macOS launchd服务每60秒自动运行同步

## 📝 JSON文件格式要求

### 标准格式
文件应包含 `articles` 数组或直接是文章数组：

```json
{
  "articles": [
    {
      "title": "文章标题",
      "key_point": "关键点",
      "summary": "摘要内容",
      "source_url": "https://...",
      "source_name": "来源",
      "category": "技术",
      "sub_category": "大语言模型",
      "country": "global",
      "importance_score": 7,
      "published_at": "2026-02-09T09:00:00.000Z"
    }
  ]
}
```

或直接数组格式：
```json
[
  {
    "title": "文章标题",
    ...
  }
]
```

### 文件命名规范

推荐使用以下格式之一：
- `news-2026-02-09.json` (推荐)
- `AI_Daily_2026-02-09.json`
- `2026-02-09.json`

## 🚀 使用方法

### 方法1：手动上传JSON文件到服务器

```bash
# 1. 生成的JSON文件上传到服务器
scp your-report.json root@8.135.37.159:/var/www/json/reports/news-2026-02-09.json

# 2. 等待60秒自动同步，或手动触发
./sync-data-daemon.sh

# 3. 刷新网页查看
open http://localhost:3000/news.html
```

### 方法2：在服务器上直接生成JSON文件

如果您有生成JSON日报的脚本：

```bash
# 在服务器上直接生成到指定目录
ssh root@8.135.37.159

# 生成JSON文件
cat > /var/www/json/reports/news-2026-02-09.json << 'EOF'
{
  "articles": [
    {
      "title": "示例新闻",
      "key_point": "关键点",
      "summary": "摘要",
      "source_url": "https://example.com",
      "source_name": "示例来源",
      "category": "技术",
      "sub_category": "大语言模型",
      "country": "global",
      "importance_score": 7,
      "published_at": "2026-02-09T09:00:00.000Z"
    }
  ]
}
EOF

# 文件会自动同步到Mac并在网站上显示
```

### 方法3：使用API直接导入

```bash
# 直接通过API导入JSON数据
curl -X POST http://localhost:3000/api/news/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @your-report.json
```

## ✅ 验证步骤

### 1. 检查同步状态
```bash
# 查看同步日志
tail -f /tmp/aicoming-sync.log

# 检查本地文件
ls -lh data/news-*.json
```

### 2. 测试API
```bash
# 获取所有历史日期
curl -s http://localhost:3000/api/news/dates | python3 -m json.tool

# 获取特定日期的新闻
curl -s http://localhost:3000/api/news/date/2026-02-09 | python3 -m json.tool
```

### 3. 查看网页效果
访问 http://localhost:3000/news.html

应该能看到：
- ✅ 左侧时间轴显示新日期
- ✅ 点击日期可查看文章列表
- ✅ 文章按重要性排序显示

## 🔄 工作流程

```
生成JSON日报
    ↓
上传到 /var/www/json/reports/
    ↓
自动同步到本地 data/ (60秒内)
    ↓
API自动读取并显示在网站
```

## 📊 数据字段说明

### 必填字段
- `title`: 标题
- `summary`: 摘要
- `source_url`: 来源链接
- `source_name`: 来源名称

### 可选字段（如不填会自动生成）
- `key_point`: 关键点（会使用summary前100字）
- `category`: 分类（默认"技术"）
- `sub_category`: 子分类（默认为空）
- `country`: 地区（默认"global"）
- `importance_score`: 重要性（默认5分）
- `published_at`: 发布时间（默认当前时间）

## 🛠️ 故障排除

### 问题1：文件没有同步

**检查**:
```bash
# 检查服务器文件是否存在
ssh root@8.135.37.159 "ls -la /var/www/json/reports/"

# 手动触发同步
./sync-data-daemon.sh
```

### 问题2：网页上看不到新文章

**检查**:
```bash
# 查看文件内容是否正确
cat data/news-2026-02-09.json | python3 -m json.tool

# 测试API
curl -s http://localhost:3000/api/news/dates
```

### 问题3：文件格式错误

**解决**:
确保JSON文件格式正确，可以使用在线工具验证：
https://jsonlint.com/

## 📈 监控和维护

### 查看同步服务状态
```bash
# 检查服务是否运行
launchctl list | grep aicoming

# 重启服务
launchctl unload ~/Library/LaunchAgents/com.aicoming.sync-data.plist
launchctl load ~/Library/LaunchAgents/com.aicoming.sync-data.plist
```

### 查看同步日志
```bash
# 实时查看日志
tail -f /tmp/aicoming-sync.log

# 查看错误日志
tail -f /tmp/aicoming-sync.err
```

## 🎉 优势

相比之前的HTML格式：

- ✅ **更简单**: 无需转换，直接是JSON
- ✅ **更快速**: 直接同步，无需处理
- ✅ **更可靠**: JSON格式验证更严格
- ✅ **更灵活**: 可以手动编辑或批量处理
- ✅ **自动化**: 完全自动同步到网站

## 📝 示例

### 完整的JSON日报文件

```json
{
  "articles": [
    {
      "title": "OpenAI发布GPT-5预览版",
      "key_point": "OpenAI宣布GPT-5预览版发布，性能提升40%",
      "summary": "OpenAI今日宣布GPT-5预览版正式发布，新模型在推理能力、多模态理解和代码生成方面都有显著提升...",
      "source_url": "https://openai.com/blog/gpt-5-preview",
      "source_name": "OpenAI Blog",
      "category": "技术",
      "sub_category": "大语言模型",
      "country": "global",
      "importance_score": 9,
      "published_at": "2026-02-09T09:00:00.000Z"
    },
    {
      "title": "谷歌Gemini 2.0超越GPT-4",
      "key_point": "谷歌发布Gemini 2.0，多项基准测试超越GPT-4",
      "summary": "谷歌今日发布Gemini 2.0模型，在多项基准测试中超越GPT-4...",
      "source_url": "https://blog.google/technology/ai/gemini-2",
      "source_name": "Google AI Blog",
      "category": "技术",
      "sub_category": "大语言模型",
      "country": "global",
      "importance_score": 8,
      "published_at": "2026-02-09T09:00:00.000Z"
    }
  ]
}
```

文件名: `news-2026-02-09.json`
