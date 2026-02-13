#!/bin/bash

# ============================================
# 日报同步服务设置
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPORT_SOURCE_DIR="/var/www/html/reports"
PROJECT_DIR="/var/www/ai-coming-website"
SYNC_SCRIPT="$PROJECT_DIR/sync-reports-to-website.sh"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  日报同步服务设置${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 检查脚本是否存在
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo -e "${RED}❌ 脚本不存在: $SYNC_SCRIPT${NC}"
    exit 1
fi

chmod +x "$SYNC_SCRIPT"
echo -e "${GREEN}✓ 脚本权限已设置${NC}"

# 创建必要目录
echo ""
echo -e "${YELLOW}[1/3] 创建必要目录...${NC}"
mkdir -p "$REPORT_SOURCE_DIR"
mkdir -p "$PROJECT_DIR/reports-archive"
mkdir -p "$PROJECT_DIR/logs"
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 测试运行一次
echo ""
echo -e "${YELLOW}[2/3] 测试运行...${NC}"
echo "源目录: $REPORT_SOURCE_DIR"
echo "项目目录: $PROJECT_DIR"
echo ""

FILE_COUNT=$(find "$REPORT_SOURCE_DIR" -name "*.html" 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  源目录中没有HTML文件${NC}"
    echo ""
    echo "你可以："
    echo "  1. 上传测试HTML文件到: $REPORT_SOURCE_DIR"
    echo "  2. 然后运行: $SYNC_SCRIPT"
else
    echo -e "${GREEN}✓ 发现 $FILE_COUNT 个HTML文件${NC}"
    echo ""
    read -p "是否现在同步这些文件? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        bash "$SYNC_SCRIPT"
    fi
fi

# 设置定时任务
echo ""
echo -e "${YELLOW}[3/3] 设置定时任务...${NC}"
echo ""
echo "设置每天 09:05 自动同步..."
echo ""

# 删除旧的cron任务
(crontab -l 2>/dev/null | grep -v "sync-reports-to-website") | crontab -

# 添加新的cron任务：每天9:05
(crontab -l 2>/dev/null; echo "5 9 * * * $SYNC_SCRIPT >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -

echo -e "${GREEN}✓ 定时任务已设置：每天 09:05${NC}"
echo ""
echo "查看定时任务:"
crontab -l | grep "sync-reports"
echo ""
echo "查看日志:"
echo "  tail -f $PROJECT_DIR/logs/report-sync.log"

if [ -n "$cron_expr" ]; then
    # 删除旧的cron任务
    (crontab -l 2>/dev/null | grep -v "sync-reports-to-website") | crontab -

    # 添加新的cron任务
    (crontab -l 2>/dev/null; echo "$cron_expr $SYNC_SCRIPT >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -

    echo -e "${GREEN}✓ 定时任务已设置${NC}"
    echo ""
    echo "查看定时任务:"
    crontab -l | grep "sync-reports"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✓ 设置完成！${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "源目录: $REPORT_SOURCE_DIR"
echo "项目目录: $PROJECT_DIR"
echo ""
echo "常用命令:"
echo "  手动同步: $SYNC_SCRIPT"
echo "  查看日志: tail -f $PROJECT_DIR/logs/report-sync.log"
echo "  查看任务: crontab -l | grep sync-reports"
echo ""
echo "📝 使用说明:"
echo "  - 每天 09:05 自动检测最新日报并同步"
echo "  - 已处理的文件会归档到: $PROJECT_DIR/reports-archive"
echo "  - 手动同步命令: $SYNC_SCRIPT"
echo ""
