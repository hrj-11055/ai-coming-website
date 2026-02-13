#!/bin/bash

# ============================================
# 设置日报自动导入服务
# 提供3种运行模式：
# 1. 手动执行 - 测试用
# 2. 定时任务 - cron方式
# 3. 守护进程 - 后台持续运行
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  日报自动导入服务设置${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

PROJECT_DIR="/var/www/ai-coming-website"
SCRIPT_NAME="auto-daily-report-import.sh"
SCRIPT_PATH="$PROJECT_DIR/$SCRIPT_NAME"

# 检查脚本是否存在
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${YELLOW}⚠️  脚本不存在: $SCRIPT_PATH${NC}"
    echo "请确保 auto-daily-report-import.sh 在项目目录中"
    exit 1
fi

# 确保脚本可执行
chmod +x "$SCRIPT_PATH"
echo -e "${GREEN}✓ 脚本已设置执行权限${NC}"
echo ""

# =====================================================
# 选择运行模式
# =====================================================

echo "请选择运行模式:"
echo ""
echo "  1) 手动执行（测试用）"
echo "  2) 定时任务（每小时检查一次）"
echo "  3) 守护进程（后台持续运行）"
echo "  4) 查看当前状态"
echo "  5) 停止服务"
echo ""
read -p "请输入选项 (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}手动执行模式${NC}"
        echo "================================"
        bash "$SCRIPT_PATH"
        ;;

    2)
        echo ""
        echo -e "${YELLOW}定时任务模式${NC}"
        echo "================================"

        # 检查crontab
        if ! command -v crontab &> /dev/null; then
            echo -e "${YELLOW}⚠️  crontab 未安装${NC}"
            echo "安装命令: apt-get install cron"
            exit 1
        fi

        # 添加cron任务
        (crontab -l 2>/dev/null | grep -v "$SCRIPT_NAME"; echo "0 * * * * $SCRIPT_PATH >> /var/www/ai-coming-website/logs/cron.log 2>&1") | crontab -

        echo -e "${GREEN}✓ 定时任务已设置（每小时执行）${NC}"
        echo ""
        echo "查看当前定时任务:"
        crontab -l | grep "$SCRIPT_NAME"
        echo ""
        echo "查看日志:"
        echo "  tail -f /var/www/ai-coming-website/logs/auto-import.log"
        ;;

    3)
        echo ""
        echo -e "${YELLOW}守护进程模式${NC}"
        echo "================================"

        # 使用nohup后台运行
        nohup bash "$SCRIPT_PATH" > /dev/null 2>&1 &
        echo $! > "$PROJECT_DIR/auto-import.pid"

        echo -e "${GREEN}✓ 守护进程已启动${NC}"
        echo "PID: $(cat $PROJECT_DIR/auto-import.pid)"
        echo ""
        echo "查看日志:"
        echo "  tail -f /var/www/ai-coming-website/logs/auto-import.log"
        echo ""
        echo "停止服务:"
        echo "  kill $(cat $PROJECT_DIR/auto-import.pid)"
        ;;

    4)
        echo ""
        echo -e "${YELLOW}当前状态${NC}"
        echo "================================"
        echo ""

        # 检查进程
        if [ -f "$PROJECT_DIR/auto-import.pid" ]; then
            PID=$(cat "$PROJECT_DIR/auto-import.pid")
            if ps -p "$PID" > /dev/null 2>&1; then
                echo -e "${GREEN}✓ 守护进程运行中${NC}"
                echo "PID: $PID"
                ps -f -p "$PID"
            else
                echo -e "${YELLOW}⚠️  守护进程未运行${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  未找到守护进程${NC}"
        fi

        echo ""

        # 检查cron
        if crontab -l 2>/dev/null | grep -q "$SCRIPT_NAME"; then
            echo -e "${GREEN}✓ 定时任务已设置${NC}"
            crontab -l | grep "$SCRIPT_NAME"
        else
            echo -e "${YELLOW}⚠️  定时任务未设置${NC}"
        fi

        echo ""

        # 显示最近日志
        if [ -f "$PROJECT_DIR/logs/auto-import.log" ]; then
            echo "最近日志:"
            echo "--------------------------------"
            tail -10 "$PROJECT_DIR/logs/auto-import.log"
        else
            echo "暂无日志"
        fi
        ;;

    5)
        echo ""
        echo -e "${YELLOW}停止服务${NC}"
        echo "================================"

        # 停止守护进程
        if [ -f "$PROJECT_DIR/auto-import.pid" ]; then
            PID=$(cat "$PROJECT_DIR/auto-import.pid")
            if ps -p "$PID" > /dev/null 2>&1; then
                kill "$PID"
                rm -f "$PROJECT_DIR/auto-import.pid"
                echo -e "${GREEN}✓ 守护进程已停止${NC}"
            else
                echo -e "${YELLOW}⚠️  进程不存在${NC}"
                rm -f "$PROJECT_DIR/auto-import.pid"
            fi
        fi

        # 停止cron任务
        if crontab -l 2>/dev/null | grep -q "$SCRIPT_NAME"; then
            (crontab -l 2>/dev/null | grep -v "$SCRIPT_NAME") | crontab -
            echo -e "${GREEN}✓ 定时任务已删除${NC}"
        fi

        echo ""
        echo -e "${GREEN}✓ 所有服务已停止${NC}"
        ;;

    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}设置完成！${NC}"
echo -e "${GREEN}============================================${NC}"
