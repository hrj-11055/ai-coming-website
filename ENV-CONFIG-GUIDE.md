# API 环境配置说明

## 📝 配置日期
2025-02-03

---

## ✅ 已完成的配置

API Key 现已安全地配置在环境变量中，通过后端代理调用，**无需在前端代码中暴露敏感信息**。

---

## 🔧 配置步骤

### 1. 打开 .env 文件

```bash
cd /Users/MarkHuang/Downloads/ai-coming-website/website
nano .env  # 或使用您喜欢的编辑器
```

### 2. 配置 API Key

找到以下配置项（第 41 行）：

```bash
# =====================================================
# SiliconFlow API Configuration 硅基流动API配置
# =====================================================
# 获取方式：访问 https://siliconflow.cn → 控制台 → API密钥
SILICONFLOW_API_KEY=sk-your_api_key_here
SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
SILICONFLOW_MODEL=Qwen/Qwen2.5-7B-Instruct
```

**将 `sk-your_api_key_here` 替换为您的真实 API Key**

### 3. 保存文件

如果使用 nano：
- 按 `Ctrl + O` 保存
- 按 `Enter` 确认
- 按 `Ctrl + X` 退出

### 4. 重启服务器

```bash
# 停止当前服务器（如果在运行）
# 然后重新启动
npm start
```

---

## 🏗️ 架构说明

### 之前（不安全）
```
前端 (index.html)
    ↓ 直接调用
硅基流动 API
    ↓
需要在前端暴露 API Key ❌
```

### 现在（安全）
```
前端 (index.html)
    ↓ POST /api/ai/chat
后端 API 代理 (server-json.js)
    ↓ 使用环境变量
硅基流动 API
    ↓
API Key 安全存储在后端 ✅
```

---

## 📊 API 代理接口

### 接口地址
```
POST /api/ai/chat
```

### 请求格式
```json
{
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的AI助手..."
    },
    {
      "role": "user",
      "content": "用户的问题"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 响应格式
```json
{
  "id": "chatcmpl-xxx",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI的回答内容..."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 500,
    "total_tokens": 515
  }
}
```

---

## 🔐 安全优势

| 特性 | 说明 |
|-----|------|
| ✅ **API Key 隐藏** | 前端无法访问，只存储在后端环境变量中 |
| ✅ **集中管理** | 所有 API 配置在 `.env` 文件中统一管理 |
| ✅ **错误处理** | 后端统一处理 API 错误，返回友好提示 |
| ✅ **环境隔离** | 开发/生产环境可使用不同的 API Key |
| ✅ **版本控制安全** | `.env` 文件不会被提交到 Git（已在 .gitignore 中） |

---

## 🧪 测试配置

### 1. 启动服务器
```bash
npm start
```

### 2. 访问搜索页面
浏览器打开：`http://localhost:3000`

### 3. 输入问题测试
在搜索框中输入任何 AI 相关问题，例如：
- "什么是机器学习？"
- "深度学习的应用有哪些？"
- "GPT-4相比GPT-3有什么改进？"

### 4. 查看结果
- 如果 API Key 配置正确，将看到 AI 的回答
- 如果 API Key 未配置，将看到错误提示

---

## 🐛 故障排查

### 问题 1: 提示 "API_KEY未配置"

**原因：** `.env` 文件中的 `SILICONFLOW_API_KEY` 仍然是默认值

**解决方案：**
1. 检查 `.env` 文件第 41 行
2. 确认 `SILICONFLOW_API_KEY` 已替换为真实的 API Key
3. 重启服务器

### 问题 2: 提示 "API请求失败: 401"

**原因：** API Key 错误或已过期

**解决方案：**
1. 登录硅基流动控制台确认 API Key 是否正确
2. 检查 API Key 是否已过期
3. 重新生成 API Key 并更新 `.env` 文件

### 问题 3: 服务器启动后仍然使用旧配置

**原因：** 环境变量未重新加载

**解决方案：**
```bash
# 完全停止服务器
Ctrl + C

# 重新启动
npm start
```

---

## 📝 配置文件说明

### .env 文件
**作用：** 存储实际的环境变量值
**位置：** `/Users/MarkHuang/Downloads/ai-coming-website/website/.env`
**注意：** 不要提交到 Git（已在 .gitignore 中）

### .env.example 文件
**作用：** 环境变量配置示例
**位置：** `/Users/MarkHuang/Downloads/ai-coming-website/website/.env.example`
**用途：** 给其他开发者参考，可以提交到 Git

---

## 🔄 修改 AI 模型

如需更换其他 AI 模型，编辑 `.env` 文件第 43 行：

```bash
# 可选模型（示例）：
SILICONFLOW_MODEL=Qwen/Qwen2.5-72B-Instruct
SILICONFLOW_MODEL=deepseek-ai/DeepSeek-V2.5
SILICONFLOW_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

可用模型列表：访问 https://docs.siliconflow.cn/models

---

## 📚 相关文档

- **API-SETUP-GUIDE.md** - 硅基流动 API 完整配置指南
- **SEARCH-PAGE-UPDATE.md** - 搜索页面更新说明
- **FRONTEND-MODIFICATIONS.md** - 前端功能修改说明

---

## 🎯 快速配置清单

- [ ] 1. 访问 https://siliconflow.cn 获取 API Key
- [ ] 2. 编辑 `.env` 文件
- [ ] 3. 将 `SILICONFLOW_API_KEY` 替换为真实值
- [ ] 4. 保存 `.env` 文件
- [ ] 5. 重启服务器 (`npm start`)
- [ ] 6. 访问 http://localhost:3000 测试搜索

---

**配置完成后，API Key 将安全地存储在后端，前端通过代理接口调用，完全无需在前端暴露任何敏感信息！** 🔐
