#!/bin/bash

# 服务器端自动同步设置脚本
# 功能：每60秒检查并同步新的JSON日报到网站项目

SERVER="root@8.135.37.159"

echo "📋 设置服务器端自动同步..."
echo ""

# 1. 创建同步脚本
echo "1️⃣ 创建同步脚本..."
ssh $SERVER "cat > /var/www/ai-coming-website/auto-sync.sh << 'EOFSCRIPT'
#!/bin/bash

SOURCE_DIR=\"/var/www/json/report\"
TARGET_DIR=\"/var/www/ai-coming-website/data\"
LOG_FILE=\"/var/www/ai-coming-website/auto-sync.log\"

log() {
    echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] \$1\" >> \"\$LOG_FILE\"
}

log \"检查新文件...\"

# 同步JSON文件（只同步变化的）
rsync -avz --include=\"*.json\" --exclude=\"*\" \
    \"\$SOURCE_DIR/\" \"\$TARGET_DIR/\" >> \"\$LOG_FILE\" 2>&1

# 检查是否有新文件同步过来
NEW_FILES=\$(find \"\$TARGET_DIR\" -name \"*.json\" -mmin -2 -type f 2>/dev/null)
if [ -n \"\$NEW_FILES\" ]; then
    log \"发现新文件已同步，无需重启服务（API会自动读取）\"
fi

EOFSCRIPT
"

# 2. 设置执行权限
echo "2️⃣ 设置执行权限..."
ssh $SERVER "chmod +x /var/www/ai-coming-website/auto-sync.sh"

# 3. 创建定时任务（使用crontab）
echo "3️⃣ 设置定时任务（每分钟执行一次）..."
ssh $SERVER "crontab -l 2>/dev/null | grep -v 'auto-sync.sh' > /tmp/crontab.tmp"
ssh $SERVER "echo '* * * * * /var/www/ai-coming-website/auto-sync.sh > /dev/null 2>&1' >> /tmp/crontab.tmp"
ssh $SERVER "crontab /tmp/crontab.tmp"
ssh $SERVER "rm /tmp/crontab.tmp"

# 4. 手动执行一次同步
echo "4️⃣ 执行首次同步..."
ssh $SERVER "bash /var/www/ai-coming-website/auto-sync.sh"

echo ""
echo "✅ 服务器端自动同步设置完成！"
echo ""
echo "📊 同步配置："
echo "  - 源目录: /var/www/json/report/"
echo "  - 目标目录: /var/www/ai-coming-website/data/"
echo "  - 同步间隔: 每60秒"
echo "  - 日志文件: /var/www/ai-coming-website/auto-sync.log"
echo ""
echo "🔍 查看日志："
echo "  ssh $SERVER \"tail -f /var/www/ai-coming-website/auto-sync.log\""
