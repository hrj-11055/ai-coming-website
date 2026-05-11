# AI 模型对比测试工具使用指南

## 📖 概述

这是一个用于对比不同 AI 模型在相同提示词下表现效果的测试工具。

**对比模型：**
- 🔵 DeepSeek-V3.2 (硅基流动 API)
- 🟢 Qwen-Plus (阿里云百炼 API)

## 🚀 快速开始

### 1. 配置 API Key

编辑 `.env` 文件，添加以下配置：

```bash
# 硅基流动 API (必需)
SILICONFLOW_API_KEY=sk-your_siliconflow_api_key_here

# 阿里云千问 API (可选，如不配置则跳过 Qwen 测试)
QWEN_API_KEY=sk-your_qwen_api_key_here
```

#### 获取 API Key：

**硅基流动 API:**
1. 访问 https://siliconflow.cn
2. 登录/注册账号
3. 进入控制台 → API密钥
4. 创建新密钥并复制

**阿里云千问 API:**
1. 访问 https://bailian.console.aliyun.com/
2. 登录阿里云账号
3. 进入 API-KEY管理
4. 创建新的 API-KEY 并复制

### 2. 运行测试

```bash
# 使用默认测试问题
node test-model-comparison.js

# 使用自定义问题
node test-model-comparison.js "什么是机器学习？"

# 测试多个问题
node test-model-comparison.js "问题1" "问题2" "问题3"
```

### 3. 查看结果

测试会在控制台输出：
- 📝 每个模型的完整回答
- ⚡ 响应时间对比
- 📊 Token 使用量对比
- 📏 回答长度对比

测试结束后会自动保存详细结果到 JSON 文件：
```
test-report-1738543200000.json
```

## 📋 默认测试问题

如果没有提供自定义问题，会使用以下默认问题进行测试：

1. "什么是机器学习？请用简单的语言解释。"
2. "写一个Python的快速排序算法。"
3. "解释一下深度学习和机器学习的区别。"

## 📊 输出示例

```
════════════════════════════════════════════════════════════════════════════════
📝 测试问题: 什么是机器学习？请用简单的语言解释。
════════════════════════════════════════════════════════════════════════════════

🔵 正在调用 DeepSeek-V3.2...
✅ DeepSeek-V3.2 响应成功 (1234ms)
   Tokens: 156 (输入: 45, 输出: 111)

🟢 正在调用 Qwen-Plus...
✅ Qwen-Plus 响应成功 (987ms)
   Tokens: 142 (输入: 45, 输出: 97)

────────────────────────────────────────────────────────────────────────────────
📊 对比结果
────────────────────────────────────────────────────────────────────────────────

🔵 DeepSeek-V3.2 回答:
────────────────────────
机器学习就像教小孩子认识世界...

🟢 Qwen-Plus 回答:
────────────────────────
机器学习是一种让计算机...

────────────────────────────────────────────────────────────────────────────────
⚡ 性能对比
────────────────────────────────────────────────────────────────────────────────
响应时间:
  DeepSeek-V3.2: 1234ms
  Qwen-Plus:     987ms
  → Qwen-Plus 快 20.0% (247ms)

Token 使用:
  DeepSeek-V3.2: 156 tokens
  Qwen-Plus:     142 tokens
```

## 🔧 高级配置

### 修改测试参数

编辑 `test-model-comparison.js` 文件中的配置：

```javascript
// 修改模型参数
{
    temperature: 0.7,      // 温度 (0-1，越高越随机)
    max_tokens: 2000,      // 最大生成token数
    stream: false          // 是否流式输出
}
```

### 修改默认测试问题

```javascript
const DEFAULT_QUERIES = [
    "你的自定义问题1",
    "你的自定义问题2",
    "你的自定义问题3"
];
```

### 添加更多模型

在 `test-model-comparison.js` 中添加新的配置：

```javascript
const YOUR_MODEL_CONFIG = {
    apiKey: process.env.YOUR_API_KEY,
    apiUrl: 'https://your-api-endpoint',
    model: 'your-model-name',
    name: 'Your-Model-Name'
};
```

## 📈 结果分析

### 评估维度

1. **响应速度**: 哪个模型响应更快？
2. **Token 效率**: 哪个模型使用的 token 更少？
3. **回答质量**: 回答是否准确、完整、易读？
4. **一致性**: 多次测试结果是否稳定？

### 性能对比指标

- **响应时间**: 实际网络请求 + 模型推理时间
- **Token 使用**: 输入 + 输出的总 token 数
- **回答长度**: 回答的字符数量
- **成本估算**: 根据各模型的定价计算费用

## 🐛 常见问题

### Q: 提示 "API Key 未配置"

**A:** 检查 `.env` 文件是否存在且包含正确的 API Key。确保不要提交 `.env` 文件到 git。

### Q: Qwen 测试失败

**A:** 可能原因：
1. API Key 配置错误
2. API Key 权限不足
3. 网络连接问题
4. API 限流（等待几分钟后重试）

### Q: 如何只测试 DeepSeek？

**A:** 不配置 `QWEN_API_KEY`，工具会自动跳过 Qwen 测试。

### Q: 测试结果如何解读？

**A:**
- 响应时间短 ≠ 模型更好，还要看回答质量
- Token 少 ≠ 成本低，不同模型定价不同
- 建议多次测试取平均值，避免偶然性

## 📝 测试建议

1. **批量测试**: 使用多个不同类型的问题测试
2. **场景化测试**: 针对你的实际使用场景设计问题
3. **重复测试**: 同一问题多次测试，检查稳定性
4. **对比记录**: 保存测试结果，长期跟踪模型表现

## 🔗 相关链接

- [硅基流动官网](https://siliconflow.cn)
- [阿里云百炼平台](https://bailian.console.aliyun.com/)
- [DeepSeek 文档](https://docs.deepseek.ai/)
- [Qwen 文档](https://help.aliyun.com/zh/dashscope/)

## 📄 许可证

MIT License
