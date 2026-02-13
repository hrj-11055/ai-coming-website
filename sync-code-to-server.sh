#!/bin/bash

# Mac本地代码同步到服务器
# 用途：将本地修改的代码文件同步到服务器

SERVER="root@8.135.37.159"
LOCAL_DIR="/Users/MarkHuang/ai-coming-website"
REMOTE_DIR="/var/www/ai-coming-website"

echo "📤 同步代码到服务器..."
echo "本地: $LOCAL_DIR"
echo "服务器: $SERVER:$REMOTE_DIR"
echo ""

# 使用rsync同步代码文件
# 排除：node_modules, logs, .git, 运行时数据等
rsync -avz --delete \
    --exclude='node_modules/' \
    --exclude='*.log' \
    --exclude='.git/' \
    --exclude='.DS_Store' \
    --exclude='tmp/' \
    --exclude='*.tmp' \
    --exclude='*.bak' \
    --exclude='*.backup' \
    --exclude='package-lock.json' \
    --exclude='data/news.json' \
    --exclude='data/visit-logs.json' \
    --exclude='data/api-calls.json' \
    --exclude='data/banned-ips.json' \
    --exclude='data/wrapped-import.json' \
    --exclude='data/archive/' \
    --exclude='data/reports-archive/' \
    --include='data/' \
    --include='config/' \
    --include='config/**' \
    --include='scripts/' \
    --include='scripts/**' \
    --include='pic/' \
    --include='pic/**' \
    --include='*.js' \
    --include='*.html' \
    --include='*.css' \
    --include='*.sh' \
    --include='*.md' \
    --include='*.txt' \
    --include='*.py' \
    --include='*.jpg' \
    --include='*.jpeg' \
    --include='*.png' \
    --include='*.gif' \
    --include='*.svg' \
    --include='*.ico' \
    --include='*.webp' \
    --include='data/admins.json' \
    --include='data/keywords.json' \
    --include='data/settings.json' \
    --include='data/tools.json' \
    --include='data/tool-categories.json' \
    --include='data/weekly-news.json' \
    --exclude='*' \
    "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

echo ""
echo "✅ 代码同步完成！"
echo ""
echo "🔄 重启服务器Node.js服务..."
ssh $SERVER "cd /var/www/ai-coming-website && lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; nohup node server-json.js > /tmp/server-json.log 2>&1 &"

sleep 2

echo ""
echo "✅ 服务已重启"
echo ""
echo "🌐 访问服务器: http://8.135.37.159:3000"
