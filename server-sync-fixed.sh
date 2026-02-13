#!/bin/bash

# 服务器端数据同步脚本
# 将 /var/www/json/report/ 的JSON日报同步到网站项目 data/ 目录

SOURCE_DIR="/var/www/json/report"
TARGET_DIR="/var/www/ai-coming-website/data"
LOG_FILE="/tmp/server-sync.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始同步JSON日报到网站项目..."

# 检查源目录
if [ ! -d "$SOURCE_DIR" ]; then
    log "错误：源目录不存在 $SOURCE_DIR"
    exit 1
fi

# 检查目标目录
if [ ! -d "$TARGET_DIR" ]; then
    log "错误：目标目录不存在 $TARGET_DIR"
    exit 1
fi

# 同步所有JSON文件
rsync -avz --include="*.json" --exclude="*" \
    "$SOURCE_DIR/" "$TARGET_DIR/" 2>&1 | tee -a "$LOG_FILE"

# 重启Node.js服务以加载新数据
log "重启Node.js服务..."
if pgrep -f "node.*server-json.js" > /dev/null; then
    pkill -f "node.*server-json.js"
    sleep 2
    cd /var/www/ai-coming-website
    nohup node server-json.js > /tmp/server-json.log 2>&1 &
    log "Node.js服务已重启，PID: $!"
else
    log "警告：未找到运行中的Node.js服务"
fi

log "同步完成！"
