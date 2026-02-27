# API内容接入测试指南

## 概述

本文档详细说明如何将HTML格式的AI日报文章导入到系统中，包括格式转换、API测试和完整的工作流程。

## 📋 目录

1. [文章格式要求](#文章格式要求)
2. [转换工具使用](#转换工具使用)
3. [API接口说明](#api接口说明)
4. [完整导入流程](#完整导入流程)
5. [常见问题](#常见问题)

---

## 文章格式要求

### API期望的JSON格式

系统使用RESTful API管理文章，期望以下JSON格式：

```json
[
  {
    "title": "文章标题",
    "key_point": "核心观点（深度研判）",
    "summary": "文章摘要（情报速递）",
    "source_url": "原文链接URL",
    "source_name": "来源名称",
    "category": "主分类",
    "sub_category": "子分类",
    "country": "china/global",
    "importance_score": 7,
    "published_at": "2025-02-05T09:00:00Z"
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| title | string | ✅ | 文章标题 | "OpenAI发布GPT-5" |
| key_point | string | ❌ | 核心观点/深度研判 | "性能提升50%" |
| summary | string | ✅ | 文章摘要 | "OpenAI今日发布..." |
| source_url | string | ❌ | 原文链接 | "https://..." |
| source_name | string | ❌ | 来源名称 | "OpenAI官网" |
| category | string | ❌ | 主分类 | "技术/产品/政策" |
| sub_category | string | ❌ | 子分类 | "大语言模型" |
| country | string | ❌ | 国家 | "china/global" |
| importance_score | number | ❌ | 重要性分数 | 1-10 |
| published_at | string | ❌ | 发布时间 | ISO 8601格式 |

### 分类体系

**主分类 (category)**:
- `技术` - 技术突破、研究论文
- `产品` - 产品发布、功能更新
- `政策` - 政策法规、行业标准
- `融资` - 融资动态、IPO
- `应用` - 行业应用、落地案例

**子分类 (sub_category)**:
- `大语言模型` - GPT、Claude等
- `AI应用` - 各行业AI应用
- `智能硬件` - 芯片、设备
- `计算机视觉` - 图像、视频
- `自动驾驶` - 汽车相关
- `产业政策` - 政策法规

---

## 转换工具使用

### HTML转JSON转换器

系统提供了自动转换工具，将HTML格式的日报转换为API可接受的JSON格式。

#### 工具位置
```
/scripts/html-to-json-converter.js
```

#### 使用方法

**基本用法**:
```bash
cd scripts
node html-to-json-converter.js <HTML文件路径>
```

**指定输出文件**:
```bash
node html-to-json-converter.js ../AI_Daily_2026-01-16.html output.json
```

**示例**:
```bash
node html-to-json-converter.js /Users/MarkHuang/Downloads/ai-coming-website/AI_Daily_2026-01-16.html
```

#### 输出结果

```
📖 正在读取: AI_Daily_2026-01-16.html
✅ 已转换 20 篇文章
📁 保存到: ../data/news-2026-01-16.json

📋 转换预览:
--------------------------------------------------------------------------------

1. OpenAI 优化 ChatGPT 记忆功能
   分类: 技术 / 大语言模型
   重要性: 7/10
   摘要: OpenAI 通过官方渠道宣布...

... 还有 17 篇文章

--------------------------------------------------------------------------------
✅ 转换完成！
```

#### 转换功能

转换工具会自动：

1. **提取文章信息**
   - 从HTML section中提取标题
   - 提取【情报速递】作为摘要
   - 提取【深度研判】作为核心观点
   - 提取来源和原文链接

2. **智能分类**
   - 根据关键词自动判断分类
   - 识别子分类（如大语言模型、AI应用等）
   - 推断重要性分数（1-10分）

3. **数据清理**
   - 移除HTML标签
   - 清理多余空白
   - 规范化格式

#### HTML格式要求

转换工具期望的HTML格式：

```html
<section style="margin-bottom: 30px; padding: 20px; background-color: #f7f7f7;">
    <h3>文章标题</h3>
    <p><strong>【情报速递】</strong>摘要内容...</p>
    <p><strong>【深度研判】</strong>核心观点...</p>
    <section>
        🔗 来源: 来源名称<br>
        🔗 原文链接: <a href="URL">点击阅读</a>
    </section>
</section>
```

**关键要素**:
- 使用 `<section>` 标签包裹每篇文章
- 使用 `<h3>` 标签标记标题
- 使用 `【情报速递】` 标记摘要
- 使用 `【深度研判】` 标记核心观点
- 使用 `🔗 来源:` 标记来源
- 使用 `🔗 原文链接:` 标记URL

---

## API接口说明

### 1. 批量导入新闻API

**端点**: `POST /api/news/batch`

**认证**: 需要管理员Token

**请求头**:
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "articles": [
    {
      "title": "文章标题",
      "key_point": "核心观点",
      "summary": "摘要内容",
      "source_url": "https://...",
      "source_name": "来源",
      "category": "技术",
      "importance_score": 7
    }
  ]
}
```

**成功响应** (200):
```json
{
  "message": "成功导入 20 篇新闻",
  "archived": 1,
  "todayCount": 20
}
```

**错误响应** (400):
```json
{
  "error": "新闻数据格式错误"
}
```

### 2. 获取新闻列表API

**端点**: `GET /api/news`

**认证**: 不需要

**查询参数**:
- `limit` - 返回数量（可选）

**示例**:
```bash
curl http://localhost:3000/api/news?limit=20
```

### 3. 管理员登录API

**端点**: `POST /api/auth/login`

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123456"
}
```

**响应**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "admin",
    "role": "super_admin"
  }
}
```

---

## 完整导入流程

### 方法1: 使用自动化脚本（推荐）

#### 步骤1: 转换HTML为JSON

```bash
cd /Users/MarkHuang/Downloads/ai-coming-website/website/scripts
node html-to-json-converter.js /path/to/AI_Daily_2026-01-16.html
```

#### 步骤2: 运行导入测试

```bash
node api-import-test.js
```

脚本会自动：
1. 登录管理员账号
2. 导入新闻数据
3. 验证导入结果
4. 显示文章预览

**完整输出示例**:
```
🚀 开始API导入测试...

1️⃣  登录管理员账号...
✅ 登录成功

2️⃣  导入新闻数据...
📦 准备导入 20 篇文章...
✅ 导入成功！
   - 导入文章数: 20
   - 归档旧文章: 1 篇

3️⃣  验证导入结果...
✅ 验证成功！当前系统中有 20 篇文章

📋 文章预览:
1. OpenAI 优化 ChatGPT 记忆功能...
   分类: 技术 / 大语言模型
   重要性: 7/10

✅ 所有测试通过！

🌐 访问地址: http://localhost:3000
```

### 方法2: 手动使用cURL

#### 步骤1: 登录获取Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

保存返回的 `token` 值。

#### 步骤2: 导入新闻

```bash
curl -X POST http://localhost:3000/api/news/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d @/path/to/news-2026-01-16.json
```

将 `YOUR_TOKEN_HERE` 替换为实际的token。

### 方法3: 使用浏览器控制台

#### 步骤1: 登录并获取Token

1. 访问 http://localhost:3000/admin-login.html
2. 登录管理员账号
3. 打开浏览器控制台
4. 运行以下代码获取Token:

```javascript
localStorage.getItem('admin_token')
```

#### 步骤2: 在控制台中导入数据

```javascript
// 读取JSON文件
const response = await fetch('/data/news-2026-01-16.json');
const articles = await response.json();

// 导入数据
const token = localStorage.getItem('admin_token');
const result = await fetch('/api/news/batch', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ articles })
});

const data = await result.json();
console.log('导入结果:', data);
```

### 方法4: 使用Postman

#### 创建请求

1. **新建请求**: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123456"
     }
     ```

2. **保存Token**: 从响应中复制token

3. **导入新闻**: 新建POST请求
   - URL: `http://localhost:3000/api/news/batch`
   - Headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer {粘贴token}`
   - Body: 选择JSON文件或粘贴JSON内容

---

## 数据验证

### 验证导入结果

#### 1. 访问首页查看

访问 http://localhost:3000，查看"今日快讯"部分是否显示新导入的文章。

#### 2. 使用API验证

```bash
curl http://localhost:3000/api/news | jq '.[] | {title, category, importance_score}'
```

#### 3. 检查数据文件

```bash
cat /Users/MarkHuang/Downloads/ai-coming-website/website/data/news.json | jq '.[] | .title' | head -5
```

#### 4. 查看归档数据

导入时会自动归档旧文章，检查归档文件:

```bash
ls -la /Users/MarkHuang/Downloads/ai-coming-website/website/data/archive/daily/
```

---

## 常见问题

### Q1: 转换工具提示"未找到任何文章"

**原因**: HTML格式不符合要求

**解决**:
1. 检查HTML是否包含 `<section>` 标签
2. 确认每篇文章有 `<h3>` 标题
3. 检查是否有 `【情报速递】` 标记

### Q2: API返回401错误

**原因**: Token无效或缺失

**解决**:
1. 重新登录获取新Token
2. 检查Token格式: `Bearer {token}`
3. 确认Token未过期（24小时有效期）

### Q3: 导入后文章不显示

**原因**: 可能是浏览器缓存

**解决**:
1. 刷新页面（Ctrl+R 或 Cmd+R）
2. 清除浏览器缓存
3. 检查控制台是否有错误

### Q4: 部分文章分类不正确

**原因**: 关键词匹配不准确

**解决**:
1. 编辑JSON文件手动调整分类
2. 修改转换工具的关键词列表
3. 重新转换和导入

### Q5: 服务器未运行

**错误信息**: `ECONNREFUSED`

**解决**:
```bash
cd /Users/MarkHuang/Downloads/ai-coming-website/website
npm start
# 或
./run.sh
```

### Q6: 归档数据丢失

**原因**: 导入时旧文章被归档

**解决**:
归档数据保存在 `data/archive/daily/` 目录，可以恢复：

```bash
# 查看归档列表
curl http://localhost:3000/api/archive/dates

# 恢复指定日期的数据
curl http://localhost:3000/api/archive/2025-02-04
```

---

## 高级用法

### 批量处理多个HTML文件

```bash
#!/bin/bash
# 批量转换脚本

for file in /path/to/htmls/*.html; do
    echo "处理: $file"
    node html-to-json-converter.js "$file"
done
```

### 自定义分类规则

编辑 `html-to-json-converter.js`，修改关键词映射：

```javascript
const keywords = {
    '技术': ['模型', '算法', 'AI', '人工智能'],
    '产品': ['发布', '推出', '上线'],
    // 添加更多关键词...
};
```

### 导入后自动刷新缓存

```bash
# 导入数据后清除服务器缓存（如果有的话）
curl -X POST http://localhost:3000/api/cache/clear \
  -H "Authorization: Bearer $TOKEN"
```

---

## 最佳实践

### 1. 定期备份数据

```bash
# 备份当前数据
cp data/news.json data/backup/news-$(date +%Y%m%d).json
```

### 2. 使用版本控制

```bash
# 将数据文件纳入Git
git add data/news.json
git commit -m "更新新闻: $(date +%Y-%m-%d)"
```

### 3. 验证数据质量

导入前检查JSON格式：

```bash
# 验证JSON格式
cat news-2026-01-16.json | jq '.'
```

### 4. 分批导入

对于大量文章，建议分批导入：

```bash
# 每次导入10篇
jq '.[:10]' news-2026-01-16.json > batch1.json
jq '.[10:20]' news-2026-01-16.json > batch2.json
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `/scripts/html-to-json-converter.js` | HTML转JSON转换工具 |
| `/scripts/api-import-test.js` | API导入测试脚本 |
| `/data/news-2026-01-16.json` | 转换后的JSON文件 |
| `/data/news.json` | 当前活跃的新闻数据 |
| `/data/archive/daily/` | 历史归档数据 |

---

## 联系支持

如有问题，请查看：
- 历史架构文档索引: `docs/archive/legacy/README.md`
- API文档: 服务器启动后的控制台输出
- 示例文件: `data/news-upload-example.json`

---

**最后更新**: 2025-02-05
**版本**: 1.0.0
