# 提示词对比测试工具

这是一个用于对比不同提示词在同一AI模型上生成效果的测试工具。

## 功能特性

- 🔄 **自动对比**: 自动测试两个不同版本的提示词
- 📊 **详细报告**: 生成JSON和Markdown格式的测试报告
- 📈 **统计分析**: 计算响应时间、输出长度、Token使用等指标
- 🎯 **多维度分析**: 分析输出结构、代码块、步骤等特征
- 💾 **结果保存**: 自动保存测试结果到`results/`目录

## 快速开始

### 1. 配置环境变量

确保`.env`文件中包含以下配置：

```env
QWEN_API_KEY=your_api_key_here
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
QWEN_MODEL=qwen-plus
```

### 2. 配置提示词

编辑以下两个文件，放入你想要对比的提示词：

- `config/original-prompt.txt` - 原提示词
- `config/new-prompt.txt` - 新提示词

### 3. 运行测试

```bash
# 使用npm脚本运行
npm run test:prompt

# 或直接运行
node scripts/prompt-comparison-test.js
```

## 测试用例

脚本默认使用以下5个测试用例：

1. **产业链研究**: "我需要研究中国新能源汽车产业链，尤其是整车厂"
2. **产品经理学习路径**: "我想做一个产品经理，如何学习这方面的知识"
3. **能力探索**: "你可以帮我做什么"
4. **提示词生成**: "我需要生成一个互联网顶级产品经理身份的提示词"
5. **职业规划**: "我毕业2年，是初级产品经理，想成为资深产品经理进入大厂工作"

## 输出报告

测试完成后，会在`results/`目录下生成两个文件：

### 1. JSON报告 (`prompt-comparison-[timestamp].json`)

包含完整的测试数据：

```json
{
  "metadata": {
    "timestamp": "2025-01-10T...",
    "model": "qwen-plus",
    "totalTests": 5,
    "successfulTests": 10
  },
  "summary": {
    "originalPrompt": {
      "avgDuration": 2345,
      "avgLength": 1234,
      "avgTokens": 856,
      "successRate": 1.0
    },
    "newPrompt": {
      "avgDuration": 2100,
      "avgLength": 1456,
      "avgTokens": 923,
      "successRate": 1.0
    }
  },
  "results": [...]
}
```

### 2. Markdown报告 (`prompt-comparison-[timestamp].md`)

人类可读的测试报告，包含：

- 📊 统计摘要（平均响应时间、输出长度、Token数、成功率）
- 📝 每个测试用例的详细结果
- 📈 输出质量分析（结构特征、代码块、步骤等）

## 自定义测试

### 修改测试用例

编辑 `scripts/prompt-comparison-test.js` 中的 `TEST_CASES` 数组：

```javascript
const TEST_CASES = [
  {
    id: 1,
    name: '测试名称',
    prompt: '你的测试提示词'
  },
  // 添加更多测试用例...
];
```

### 修改模型参数

编辑脚本中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  API_KEY: process.env.QWEN_API_KEY,
  API_URL: process.env.QWEN_API_URL,
  MODEL: 'qwen-plus',        // 修改模型
  MAX_TOKENS: 2000,          // 修改最大token数
  TEMPERATURE: 0.7           // 修改温度参数
};
```

## 指标说明

### 性能指标

- **响应时间**: 从发送请求到收到响应的时间（毫秒）
- **输出长度**: 生成的文本字符数
- **Token使用**: 输入Token + 输出Token
- **成功率**: 成功响应的测试数 / 总测试数

### 质量指标

- **包含标题结构**: 输出是否使用Markdown标题（# 或 ##）
- **包含代码块**: 输出是否包含代码块（```）
- **包含步骤说明**: 输出是否包含编号步骤
- **章节数量**: 标题级别的数量

## 示例输出

```
🚀 提示词对比测试启动

模型: qwen-plus
API URL: https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
测试用例数: 5

📚 加载提示词...

✅ 原提示词长度: 5234 字符
✅ 新提示词长度: 5456 字符

📝 测试用例 1: 产业链研究
   使用提示词: 原提示词
   用户输入: 我需要研究中国新能源汽车产业链，尤其是整车厂...

📝 测试用例 1: 产业链研究
   使用提示词: 新提示词
   用户输入: 我需要研究中国新能源汽车产业链，尤其是整车厂...

...

📊 生成报告...

✅ 报告已保存:
   JSON: /path/to/results/prompt-comparison-1234567890.json
   Markdown: /path/to/results/prompt-comparison-1234567890.md

✅ 测试完成！

📈 简要统计:
   原提示词平均响应时间: 2345ms
   新提示词平均响应时间: 2100ms
   原提示词平均输出长度: 1234 字符
   新提示词平均输出长度: 1456 字符
```

## 故障排除

### API调用失败

- 检查`.env`文件中的API密钥是否正确
- 确认API URL是否可访问
- 检查网络连接

### 提示词文件未找到

- 确认`config/original-prompt.txt`和`config/new-prompt.txt`存在
- 脚本会在文件不存在时使用内置的默认提示词

### 结果目录创建失败

- 确保有权限创建`results/`目录
- 手动创建：`mkdir -p results`

## 高级用法

### 作为模块使用

```javascript
const { runTestCase, generateReport } = require('./scripts/prompt-comparison-test.js');

// 运行单个测试
const result = await runTestCase(
  { id: 1, name: '测试', prompt: '测试内容' },
  'system prompt here',
  '提示词名称'
);

// 生成报告
const report = generateReport(results);
```

## 贡献

欢迎提交问题和改进建议！

## 许可证

MIT
