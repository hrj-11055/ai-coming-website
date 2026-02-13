# 提示词对比测试工具 (Python版)

## 概述

这是一个用Python编写的提示词对比测试工具，用于评估两个不同版本的系统提示词在相同测试用例下的生成效果差异。

## 功能特性

- 🔄 **自动对比测试**：对每个测试用例分别使用原提示词和新提示词进行测试
- 📊 **CSV格式输出**：生成易于在Excel中打开和分析的CSV文件
- 📈 **详细统计数据**：记录响应时长、Token使用量、输出长度等关键指标
- 📝 **完整内容保存**：保存完整的生成内容用于详细对比分析
- 🎯 **多维度分析**：支持自定义测试用例和提示词版本

## 快速开始

### 1. 安装依赖

```bash
pip3 install --break-system-packages requests python-dotenv
```

或使用提供的requirements.txt：

```bash
pip3 install --break-system-packages -r scripts/requirements.txt
```

### 2. 配置环境变量

确保 `.env` 文件中包含以下配置：

```env
QWEN_API_KEY=your_api_key_here
QWEN_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
QWEN_MODEL=qwen-plus
```

### 3. 运行测试

```bash
# 使用npm脚本
npm run test:prompt:py

# 或直接运行
python3 scripts/prompt_comparison_test.py
```

## 输出文件

测试完成后会在 `results/` 目录下生成两个文件：

### 1. CSV报告文件

文件名格式：`prompt-comparison-{timestamp}.csv`

**包含字段：**
- 测试用例ID
- 测试名称
- 提示词版本（原提示词 / 新提示词）
- 响应时长
- 总Token数
- 输入Token数
- 输出Token数
- 输出长度（字符数）
- 完整生成内容

**示例数据：**

```csv
测试用例ID,测试名称,提示词版本,响应时长(ms),总Token数,输入Token数,输出Token数,输出长度,完整生成内容
1,产业链研究,原提示词,24560,2847,1870,977,1489,"```markdown..."
1,产业链研究,新提示词,51123,4007,2007,2000,3271,"🔍 **小元说AI 已激活..."
```

### 2. JSON原始数据

文件名格式：`prompt-comparison-{timestamp}.json`

包含完整的测试数据，用于程序化分析和二次处理。

## 测试用例

默认包含以下5个测试用例：

| ID | 名称 | 提示内容 |
|----|------|----------|
| 1 | 产业链研究 | 我需要研究中国新能源汽车产业链，尤其是整车厂 |
| 2 | 产品经理学习路径 | 我想做一个产品经理，如何学习这方面的知识 |
| 3 | 能力探索 | 你可以帮我做什么 |
| 4 | 提示词生成 | 我需要生成一个互联网顶级产品经理身份的提示词 |
| 5 | 职业规划 | 我毕业2年，是初级产品经理，想成为资深产品经理进入大厂工作 |

## 自定义配置

### 修改测试用例

编辑 `scripts/prompt_comparison_test.py` 中的 `TEST_CASES` 列表：

```python
TEST_CASES = [
    {
        'id': 1,
        'name': '测试名称',
        'prompt': '你的测试提示内容'
    },
    # 添加更多测试用例...
]
```

### 修改提示词文件

- 原提示词：`config/original-prompt.txt`
- 新提示词：`config/new-prompt.txt`

### 修改API参数

编辑 `Config` 类中的配置：

```python
class Config:
    API_KEY = os.getenv('QWEN_API_KEY')
    API_URL = os.getenv('QWEN_API_URL')
    MODEL = os.getenv('QWEN_MODEL', 'qwen-plus')
```

## 测试输出说明

### 终端输出

测试过程中会实时显示：

```
🚀 开始测试，共 5 个测试用例，每个测试2个提示词版本
总计: 10 次API调用

📋 测试进度: 1/5 - 产业链研究
--------------------------------------------------------------------------------

[1/10] 原提示词测试...
📝 测试用例 1: 产业链研究
   提示词版本: 原提示词
   用户输入: 我需要研究中国新能源汽车产业链，尤其是整车厂...
   ✅ 响应成功 | 时长: 24.56秒 | Token: 2847
```

### 统计摘要

测试完成后显示：

```
📊 原提示词统计:
   平均响应时长: 27.80秒
   平均Token数: 2877
   平均输出长度: 1579 字符

📊 新提示词统计:
   平均响应时长: 57.85秒
   平均Token数: 3991
   平均输出长度: 3343 字符

🔄 对比分析:
   新提示词响应速度降低: 108.1%
```

## 数据分析建议

### Excel分析

1. 打开CSV文件（使用utf-8-sig编码，自动支持中文）
2. 使用数据透视表进行多维度分析
3. 创建对比图表

### Python分析

```python
import pandas as pd

# 读取CSV
df = pd.read_csv('results/prompt-comparison-{timestamp}.csv')

# 分组统计
stats = df.groupby('提示词版本').agg({
    '响应时长': 'mean',
    '总Token数': 'mean',
    '输出长度': 'mean'
})

print(stats)
```

## 性能优化建议

1. **API限流**：测试间自动延迟1.5秒，避免触发API限流
2. **超时设置**：默认120秒超时，可根据需要调整
3. **批量测试**：支持自定义测试用例数量

## 故障排除

### ModuleNotFoundError: No module named 'requests'

安装依赖：

```bash
pip3 install --break-system-packages requests python-dotenv
```

### API调用失败

检查：
1. `.env` 文件中的 API_KEY 是否正确
2. 网络连接是否正常
3. API URL 是否可访问

### CSV文件中文乱码

使用 `utf-8-sig` 编码已确保Excel兼容。如果仍有问题：
- 在Excel中选择"数据" → "获取数据" → "从文本/CSV"
- 选择文件后，编码选择"UTF-8"

## 版本历史

- **v1.0** (2025-01-10): 初始版本
  - 支持CSV输出
  - 5个预设测试用例
  - 完整的统计分析

## 相关文件

- `scripts/prompt_comparison_test.py` - 主测试脚本
- `scripts/prompt-comparison-test.js` - Node.js版本
- `config/original-prompt.txt` - 原提示词配置
- `config/new-prompt.txt` - 新提示词配置
- `scripts/requirements.txt` - Python依赖列表

## 许可证

MIT
