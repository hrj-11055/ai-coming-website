#!/bin/bash

# ============================================
# JSON新闻检查同步脚本 - 每天10:00检查并同步
# 检查是否有新文件需要同步，如果有则执行同步
# ============================================

set -e

# 配置
REPORT_SOURCE_DIR="/var/www/json/report"
PROJECT_DIR="/var/www/ai-coming-website"
LOG_FILE="$PROJECT_DIR/logs/json-sync.log"
SYNC_SCRIPT="$PROJECT_DIR/sync-json-news.sh"

# 创建必要目录
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "============================================"
log "📋 JSON新闻检查同步开始"
log "============================================"

# 检查源目录
if [ ! -d "$REPORT_SOURCE_DIR" ]; then
    log "❌ 源目录不存在: $REPORT_SOURCE_DIR"
    exit 1
fi

# 获取最新的JSON文件
LATEST_JSON=$(find "$REPORT_SOURCE_DIR" -name "*.json" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)

if [ -z "$LATEST_JSON" ]; then
    log "📭 没有找到JSON文件"
    exit 0
fi

# 获取文件日期
filename=$(basename "$LATEST_JSON")
file_date=$(stat -c %y "$LATEST_JSON" | cut -d' ' -f1)

# 获取news.json的最新文章日期
NEWS_FILE="$PROJECT_DIR/data/news.json"
if [ -f "$NEWS_FILE" ]; then
    latest_news_date=$(jq -r '.[0].published_at // ""' "$NEWS_FILE" 2>/dev/null | cut -d' ' -f1 | cut -d'T' -f1)
else
    latest_news_date=""
fi

log "📄 最新源文件: $filename"
log "📅 源文件日期: $file_date"
log "📊 当前网站最新: ${latest_news_date:-无}"

# 比较日期，如果源文件更新则执行同步
if [ "$file_date" != "$latest_news_date" ]; then
    log "✅ 发现新数据，开始同步..."
    bash "$SYNC_SCRIPT"
else
    log "ℹ️  数据已是最新，无需同步"
fi

log "============================================"
log "✨ 检查完成！"
log "============================================"

exit 0
