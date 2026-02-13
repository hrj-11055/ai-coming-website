# API 自动化上传指南

## 📖 概述

管理后台前端页面已删除，现在通过 **API 接口** 进行数据管理。本文档说明如何使用API进行自动化数据操作。

---

## 🔐 认证说明

### JWT Token 获取

虽然前端登录页面已删除，但仍可通过以下方式获取 JWT Token：

#### 方式一：使用环境变量中的默认管理员账户

```bash
# 默认账户（在 .env 中配置）
用户名: admin
密码: admin123456
```

#### 方式二：通过 API 登录获取 Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123456"
  }'
```

**响应示例：**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "super_admin"
  }
}
```

**保存 Token 到环境变量：**
```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📝 API 接口说明

### 1. 新闻管理 API

#### 1.1 批量上传新闻（推荐）

**接口：** `POST /api/news/batch`

**说明：** 批量上传新闻数据，会自动归档旧新闻

**请求示例：**

```bash
curl -X POST http://localhost:3000/api/news/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "articles": [
      {
        "title": "OpenAI发布GPT-5模型",
        "key_point": "性能提升显著突破",
        "summary": "OpenAI今日正式发布GPT-5大语言模型，相比GPT-4在推理能力、代码生成和创意写作方面有显著提升。",
        "source_url": "https://openai.com/blog/gpt-5",
        "source_name": "RSS",
        "category": "技术",
        "sub_category": "大语言模型",
        "country": "global",
        "importance_score": 9,
        "published_at": "2025-02-03T09:00:00Z"
      },
      {
        "title": "中国发布AI发展行动计划",
        "key_point": "政策支持AI产业发展",
        "summary": "工信部发布新一代人工智能发展行动计划，提出到2027年实现核心技术突破。",
        "source_url": "https://miit.gov.cn",
        "source_name": "政府网",
        "category": "政策",
        "sub_category": "产业政策",
        "country": "china",
        "importance_score": 8,
        "published_at": "2025-02-03T10:00:00Z"
      }
    ]
  }'
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 新闻标题 |
| `key_point` | string | ✅ | 关键要点（最多30字符） |
| `summary` | string | ✅ | 新闻摘要 |
| `source_url` | string | ✅ | 原始链接 |
| `source_name` | string | ✅ | 来源名称（RSS/网页/公众号/Twitter/其他） |
| `category` | string | ✅ | 主分类（技术/商业/政策/产品/人物） |
| `sub_category` | string | ⚠️ | 子分类 |
| `country` | string | ✅ | 地区（china/global） |
| `importance_score` | number | ✅ | 重要性（1-10） |
| `published_at` | string | ✅ | 发布时间（ISO 8601格式） |

**响应示例：**
```json
{
  "message": "成功导入 2 篇新闻",
  "archived": 15,
  "todayCount": 2
}
```

---

#### 1.2 获取新闻列表

**接口：** `GET /api/news`

**参数：**
- `category`: 分类筛选（可选）
- `country`: 地区筛选（china/global，可选）
- `limit`: 显示数量（可选，默认20）
- `offset`: 偏移量（可选，用于分页）

**请求示例：**
```bash
curl "http://localhost:3000/api/news?category=技术&country=global&limit=10"
```

---

#### 1.3 添加单条新闻

**接口：** `POST /api/news`

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "title": "测试新闻",
    "key_point": "测试要点",
    "summary": "测试摘要",
    "source_url": "https://example.com",
    "source_name": "测试",
    "category": "技术",
    "country": "global",
    "importance_score": 5,
    "published_at": "2025-02-03T12:00:00Z"
  }'
```

---

### 2. 每周资讯 API

#### 2.1 批量上传每周资讯

**接口：** `POST /api/weekly-news/batch`

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/weekly-news/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "articles": [
      {
        "title": "2025年第5周AI技术动态",
        "key_point": "多模态AI成为主流",
        "summary": "本周AI技术领域出现重要变化，多模态AI应用场景不断扩大。",
        "source_url": "https://example.com/weekly-5",
        "source_name": "公众号",
        "category": "技术",
        "weekly_category": "tech",
        "country": "global",
        "importance_score": 9,
        "published_at": "2025-02-03T09:00:00Z",
        "week_number": "2025-W05",
        "week_start_date": "2025-01-27",
        "is_weekly_featured": true
      }
    ]
  }'
```

---

### 3. 关键词管理 API

#### 3.1 获取关键词列表

**接口：** `GET /api/keywords`

**请求示例：**
```bash
curl http://localhost:3000/api/keywords
```

---

#### 3.2 批量上传关键词

**接口：** `POST /api/keywords/batch`

**请求示例：**
```bash
curl -X POST http://localhost:3000/api/keywords/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "keywords": [
      { "text": "GPT-5", "weight": 10, "size": "large" },
      { "text": "多模态AI", "weight": 9, "size": "medium" },
      { "text": "AI Agent", "weight": 8, "size": "medium" }
    ]
  }'
```

---

### 4. 系统统计 API

#### 4.1 获取统计数据

**接口：** `GET /api/stats`

**请求示例：**
```bash
curl http://localhost:3000/api/stats
```

**响应示例：**
```json
{
  "keywords": 30,
  "news": 50,
  "dailyNews": 20,
  "weeklyNews": 30,
  "highImportanceNews": 15
}
```

---

## 🤖 自动化脚本示例

### Node.js 脚本

创建 `scripts/auto-upload-news.js`:

```javascript
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN;

// 登录获取Token（如果还没有）
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123456'
    });
    return response.data.token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 批量上传新闻
async function uploadNews(newsData) {
  try {
    const response = await axios.post(
      `${API_BASE}/api/news/batch`,
      { articles: newsData },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ 上传成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 上传失败:', error.response?.data || error.message);
    throw error;
  }
}

// 从JSON文件读取并上传
async function uploadFromJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const newsData = JSON.parse(data);

    console.log(`准备上传 ${newsData.length} 条新闻...`);
    await uploadNews(newsData);
  } catch (error) {
    console.error('文件读取失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    // 如果没有Token，先登录
    if (!JWT_TOKEN) {
      console.log('未找到JWT_TOKEN，正在登录...');
      const token = await login();
      console.log('登录成功，Token已保存');
      console.log('请设置环境变量: export JWT_TOKEN=' + token);
      return;
    }

    // 从文件上传
    const filePath = process.argv[2] || './data/news-upload.json';
    await uploadFromJsonFile(filePath);

    console.log('完成！');
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

main();
```

**使用方法：**

```bash
# 设置环境变量
export JWT_TOKEN="your_jwt_token_here"

# 运行脚本
node scripts/auto-upload-news.js data/news-upload.json
```

---

### Python 脚本

创建 `scripts/auto_upload_news.py`:

```python
import requests
import json
import os
from datetime import datetime

API_BASE = os.getenv('API_URL', 'http://localhost:3000')
JWT_TOKEN = os.getenv('JWT_TOKEN')

def login(username, password):
    """登录获取Token"""
    response = requests.post(f'{API_BASE}/api/auth/login', json={
        'username': username,
        'password': password
    })
    return response.json()['token']

def upload_news(news_data, token):
    """批量上传新闻"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    response = requests.post(
        f'{API_BASE}/api/news/batch',
        json={'articles': news_data},
        headers=headers
    )

    return response.json()

def main():
    # 如果没有Token，先登录
    if not JWT_TOKEN:
        print('未找到JWT_TOKEN，正在登录...')
        token = login('admin', 'admin123456')
        print(f'登录成功！Token: {token}')
        print('请设置环境变量: export JWT_TOKEN=' + token)
        return

    # 读取新闻数据
    with open('data/news-upload.json', 'r', encoding='utf-8') as f:
        news_data = json.load(f)

    # 上传新闻
    print(f'准备上传 {len(news_data)} 条新闻...')
    result = upload_news(news_data, JWT_TOKEN)
    print(f'✅ 上传成功: {result}')

if __name__ == '__main__':
    main()
```

**使用方法：**

```bash
# 安装依赖
pip install requests

# 设置环境变量
export JWT_TOKEN="your_jwt_token_here"

# 运行脚本
python scripts/auto_upload_news.py
```

---

## 📁 数据文件格式

### 新闻数据格式 (news-upload.json)

```json
[
  {
    "title": "新闻标题",
    "key_point": "关键要点（30字内）",
    "summary": "新闻摘要内容",
    "source_url": "https://example.com/news",
    "source_name": "RSS",
    "category": "技术",
    "sub_category": "人工智能",
    "country": "global",
    "importance_score": 8,
    "published_at": "2025-02-03T09:00:00Z"
  }
]
```

### 每周资讯格式 (weekly-news-upload.json)

```json
[
  {
    "title": "2025年第5周AI政策动态",
    "key_point": "多国加强AI监管",
    "summary": "本周全球AI政策领域出现重要变化...",
    "source_url": "https://example.com/weekly",
    "source_name": "公众号",
    "category": "政策",
    "weekly_category": "policy",
    "country": "global",
    "importance_score": 9,
    "published_at": "2025-02-03T09:00:00Z",
    "week_number": "2025-W05",
    "week_start_date": "2025-01-27",
    "is_weekly_featured": true
  }
]
```

---

## 🔧 常用命令

### 获取JWT Token

```bash
# 方式一：使用curl
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' \
  | jq -r '.token')

# 方式二：从环境变量
export JWT_TOKEN="your_token_here"
```

### 上传新闻数据

```bash
# 使用curl
curl -X POST http://localhost:3000/api/news/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d @data/news-upload.json

# 使用Node.js脚本
node scripts/auto-upload-news.js data/news-upload.json

# 使用Python脚本
python scripts/auto_upload_news.py
```

### 查看统计数据

```bash
curl http://localhost:3000/api/stats
```

---

## 📋 自动化任务设置

### 使用 Cron 定时任务

```bash
# 编辑crontab
crontab -e

# 每天早上8点自动上传新闻
0 8 * * * cd /path/to/website && node scripts/auto-upload-news.js data/news-upload.json >> /var/log/news-upload.log 2>&1

# 每周一早上9点上传每周资讯
0 9 * * 1 cd /path/to/website && python scripts/auto_upload_weekly.py
```

---

## ⚠️ 注意事项

1. **JWT Token 有效期**: 24小时，过期后需要重新登录获取
2. **批量上传会自动归档**: 调用 `/api/news/batch` 会自动将旧新闻归档
3. **重要性评分**: 建议设置为1-10，数字越大越重要
4. **发布时间格式**: 必须是 ISO 8601 格式（如：2025-02-03T09:00:00Z）
5. **分类规范**:
   - category: 技术/商业/政策/产品/人物
   - country: china/global

---

## 📞 故障排查

### Token 无效

```bash
# 重新获取Token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

### 上传失败

```bash
# 查看详细错误
curl -v -X POST http://localhost:3000/api/news/batch \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d @data/news-upload.json
```

### 查看服务器日志

```bash
pm2 logs
# 或
tail -f logs/combined.log
```

---

**总结：** 通过 API 接口，你可以轻松实现新闻数据的自动化上传和管理！
