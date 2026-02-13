# 日报同步系统 - 快速开始

## 🚀 一键设置

```bash
ssh root@8.135.37.159
cd /var/www/ai-coming-website
./setup-report-sync.sh
```

选择 **选项1**：每天 09:05 自动同步

---

## 📊 工作流程

```
Mac生成日报 → 上传到 /var/www/html/reports
    ↓
每天 09:05 自动运行
    ↓
sync-reports-to-website.sh:
    1. 复制HTML到项目目录
    2. html-to-json-converter.js 转换
    3. POST /api/news/batch 导入
    4. 归档到 reports-archive/
    ↓
在 news.html 查看日报
```

---

## ✅ 完成！

设置后：
- ✅ 每天 09:05 自动检测新日报
- ✅ 自动转换并导入到网站
- ✅ 在 news.html 查看日报

---

## 📱 手动同步

```bash
cd /var/www/ai-coming-website
./sync-reports-to-website.sh
```

---

## 🔍 查看日志

```bash
tail -f /var/www/ai-coming-website/logs/report-sync.log
```

---

## 📞 快速命令

```bash
# 查看定时任务
crontab -l | grep sync-reports

# 删除定时任务
crontab -l | grep -v sync-reports | crontab -

# 手动同步
./sync-reports-to-website.sh

# 查看日志
tail -f logs/report-sync.log

# 查看归档
ls -la reports-archive/
```

---

**每天09:05自动同步，日报自动上线！** 🎊
