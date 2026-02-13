#!/bin/bash

# 自动同步脚本 - 监控并同步data目录
# 使用方法: ./auto-sync-data.sh &

SERVER="root@8.135.37.159"
REMOTE_PATH="/var/www/ai-coming-website/data"
LOCAL_PATH="./data"
SYNC_INTERVAL=60  # 每60秒检查一次

echo "🔄 自动同步服务启动"
echo "   监控目录: $LOCAL_PATH"
echo "   同步间隔: ${SYNC_INTERVAL}秒"
echo "   按 Ctrl+C 停止"
echo ""

# 记录文件状态的临时文件
STATE_FILE="/tmp/news-sync-state.txt"

# 初始化状态文件
if [ ! -f "$STATE_FILE" ]; then
    ls -l $LOCAL_PATH/news-*.json 2>/dev/null | md5 > "$STATE_FILE"
fi

while true; do
    # 1. 从服务器拉取新文件
    echo "📡 [$(date '+%H:%M:%S')] 检查服务器更新..."
    rsync -avz --include="news-*.json" --include="weekly-*.json" --exclude="*" \
        ${SERVER}:${REMOTE_PATH}/ ${LOCAL_PATH}/ 2>&1 | grep -E "news-|sent|received" || true

    # 2. 检查本地是否有变化，如果有则推送到服务器
    CURRENT_STATE=$(ls -l $LOCAL_PATH/news-*.json 2>/dev/null | md5)
    LAST_STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "")

    if [ "$CURRENT_STATE" != "$LAST_STATE" ]; then
        echo "📤 [$(date '+%H:%M:%S')] 检测到本地变化，推送到服务器..."
        rsync -avz --include="news-*.json" --include="weekly-*.json" --exclude="*" \
            ${LOCAL_PATH}/ ${SERVER}:${REMOTE_PATH}/ 2>&1 | grep -E "news-|sent|received" || true

        # 更新状态
        echo "$CURRENT_STATE" > "$STATE_FILE"
        echo "✅ 同步完成"
    fi

    # 等待下次检查
    sleep $SYNC_INTERVAL
done
