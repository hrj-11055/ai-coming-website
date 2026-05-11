# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- 交互事件埋点系统（`POST /api/interaction/track`、汇总接口）
- AI 用量统计页面与 API（`/api/ai-usage/*`）
- 首页生成等待提示

### Changed

- DeepSeek 默认模型切换为 `deepseek-v4-pro`
- 微信公众号播客草稿标题使用 `YYYY.MM.DD.` 格式
- AI 能力库英雄区重新设计
- Skill 卡片点击打开新标签页

### Fixed

- 首页展示生成等待提示

## [0.2.0] - 2026-03-20

### Added

- 产品文档 `docs/PRODUCT.md`，明确产品范围、用户对象与能力边界
- 播客邮件通知：播客 `ready` 后自动发送音频和口播稿到邮箱
- 播客服务器优先对齐机制与审计命令
- About 页面：公司介绍、客户 Logo、AI 转型咨询展示
- AI 能力库页面（Skills + MCP Server 目录）
- AI 能力库详情页：截图、示例 prompt、lightbox
- 工具集分类色彩与导航优化
- 周关键词调度器（应用内 5 分钟轮询 + 外部 cron）
- 数据备份与恢复脚本
- 代码/服务器漂移审计脚本

### Changed

- AI 工具集分区：`Manus` → 国外区，`Dify` → 国内区
- 明确工具页以 `frontend/modules/tools-catalog.js` 为展示数据源
- 微信公众号播客稿通过 DeepSeek 格式化
- 播客链路收敛为服务器优先治理
- 历史文档统一归档到 `docs/archive/legacy/`
- README 重写为活跃入口文档
- 公开版本统一为 `0.2.0`

### Fixed

- 播客口播稿要求场景过渡
- 播客开场/结尾链更新
- 微信 token 获取在无当日内容时不报错
- 新闻页资源缓存 bust

## [0.1.0] - 2026-02-13

### Added

- 首页：AI 搜索入口、提示词辅助、品牌展示
- AI 资讯页：每日新闻列表、热点关键词云、时间线/文章/大纲/统计四种视图
- AI 工具集页：按分类展示，区分国内/国外
- 管理后台：登录、流量统计、IP 封禁
- JSON 文件存储运行时（`server-json.js` + `server/runtime.js`）
- JWT 认证体系
- 每日播客生成链路：DeepSeek 口播稿 + TTS + 音频播放
- 新闻导入后自动触发播客生成
- 微信公众号草稿自动上传脚本
- 周关键词自动生成（DeepSeek）
- 新闻页面模块化重构
- 访问埋点与 IP 地理定位
- 每日新闻自动归档
- Linux 服务器部署支持（Mutagen 同步）

### Changed

- 首页引导区多次迭代优化
- 新闻页首屏加载优化（缓存、超时、延迟加载侧面板）

### Fixed

- 新闻页 Tailwind 布局偏移修复
- 关键词云位置调整
- 新闻 JSON 同步选择与数据拷贝加固
- 播客配置校验恢复
- YunTTS Bearer 认证修复
- YunTTS clone 字段名修正
- 播客文章跨源去重

[Unreleased]: https://github.com/hrj-11055/ai-coming-website/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/hrj-11055/ai-coming-website/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/hrj-11055/ai-coming-website/releases/tag/v0.1.0
