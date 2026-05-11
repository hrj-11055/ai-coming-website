# Mutagen 同步忽略说明

## 不同步到服务器的目录和文件

### 个人数据目录（不在项目内）
- `~/日记/` - 个人编程日记，仅保存在本地
- `~/.claude/history.jsonl` - Claude Code对话历史
- `~/.claude/todos/` - 任务跟踪记录

### 项目内已配置忽略（见 mutagen.yml）
以下目录和文件已在 mutagen.yml 中配置为不同步：
- `node_modules/` - 依赖包
- `.env` - 环境变量配置
- `logs/` - 日志文件
- `*.log` - 日志文件
- `.DS_Store` - macOS系统文件
- `backup/` - 备份文件
- `test-*.html` - 测试文件
- `*_GUIDE.md`, `*_TEST.md` - 文档文件

## 为什么日记不同步？

1. **隐私安全**: 日记包含个人工作记录和思考，不应公开
2. **本地管理**: 日记仅用于个人回顾，不需要在服务器上访问
3. **避免冲突**: 个人笔记不应该与团队项目混淆

## 如何确认日记不会被同步？

运行以下命令检查同步状态：
```bash
mutagen sync list
```

输出应该显示同步范围是：
- Alpha: `/Users/MarkHuang/ai-coming-website`
- Beta: `root@8.135.37.159:/var/www/ai-coming-website`

不包含 `~/日记` 目录。

## 如果需要备份日记

建议使用其他方式备份个人日记：
1. **Git仓库**: 在 `~/日记` 目录初始化git仓库，推送到私有GitHub/GitLab
2. **云存储**: 使用iCloud、Dropbox等同步到个人云盘
3. **Time Machine**: macOS自带备份工具
4. **rsync**: 定期同步到其他本地或远程位置

## 注意事项

- ❌ 不要将日记目录添加到项目的mutagen.yml中
- ❌ 不要创建符号链接将日记链接到项目目录
- ✅ 保持日记独立于项目目录
- ✅ 定期备份日记到安全的位置
