#!/bin/bash

# 数据同步守护进程
# 由launchd每60秒调用一次

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SERVER="root@8.135.37.159"
REMOTE_DATA_PATH="/var/www/ai-coming-website/data"
REMOTE_REPORTS_PATH="/var/www/json/report"
LOCAL_PATH="./data"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "开始检查同步..."

# 1. 从服务器拉取data目录中的新闻文件
log "同步data目录..."
rsync -avz --include="news-*.json" --include="weekly-*.json" --include="archive/" --exclude="*" \
    ${SERVER}:${REMOTE_DATA_PATH}/ ${LOCAL_PATH}/ 2>&1 | grep -E "news-|weekly-|sent|received|total" || true

# 2. 从服务器拉取JSON日报报告
log "同步JSON日报报告..."
rsync -avz --include="*.json" --exclude="*" \
    ${SERVER}:${REMOTE_REPORTS_PATH}/ ${LOCAL_PATH}/ 2>&1 | grep -E "sent|received|total" || log "无新JSON报告"

log "同步检查完成"
