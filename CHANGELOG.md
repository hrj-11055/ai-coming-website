# Changelog

## 0.2.0 - 2026-03-20

### 新功能

- 新增 [docs/PRODUCT.md](/Users/MarkHuang/ai-coming-website/docs/PRODUCT.md)，明确当前 AIcoming 网站的产品范围、用户对象、页面结构与能力边界。
- 将服务器优先的播客脚本、提示词与相关运维脚本收敛到当前主线版本。

### 修复

- 修正 AI 工具集分区：`Manus` 调整到国外区，`Dify` 调整到国内区。
- 明确工具页当前以 `frontend/modules/tools-catalog.js` 为展示数据源，消除“修改 `data/tools.json` 就能直接影响工具页”的认知漂移。

### 文档

- 重写 [README.md](/Users/MarkHuang/ai-coming-website/README.md)，改为当前项目的活跃入口文档。
- 更新 [docs/archive/legacy/README.md](/Users/MarkHuang/ai-coming-website/docs/archive/legacy/README.md)，明确活跃文档与归档文档边界。
- 将公开产品版本统一为 `0.2.0`。
