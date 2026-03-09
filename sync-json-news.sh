#!/bin/bash

# ============================================
# JSON新闻同步脚本 - 每天9:05自动同步最新新闻
# 数据源: /var/www/json/report/*.json
# ============================================

set -e

# 配置
REPORT_SOURCE_DIR="/var/www/json/report"
PROJECT_DIR="/var/www/ai-coming-website"
LOG_FILE="$PROJECT_DIR/logs/json-sync.log"
API_URL="http://localhost:3000/api/news/batch"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123456"

# 创建必要目录
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$PROJECT_DIR/reports-archive"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "============================================"
log "📰 JSON新闻同步开始"
log "============================================"

# 检查源目录
if [ ! -d "$REPORT_SOURCE_DIR" ]; then
    log "❌ 源目录不存在: $REPORT_SOURCE_DIR"
    exit 1
fi

today=$(date +%F)
yesterday=$(date -d "yesterday" +%F)

# 在 [昨天, 今天] 窗口内挑选最新日期文件，避免被异常mtime旧文件误导
candidate_rows=""
while IFS= read -r file; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")
    name_date=$(echo "$filename" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}' || true)
    [ -n "$name_date" ] || continue
    if [[ "$name_date" < "$yesterday" || "$name_date" > "$today" ]]; then
        continue
    fi
    mtime=$(stat -c %Y "$file")
    candidate_rows+="${name_date}|${mtime}|${file}"$'\n'
done < <(find "$REPORT_SOURCE_DIR" -name "*.json" -type f 2>/dev/null)

if [ -z "$candidate_rows" ]; then
    log "📭 未找到可导入日报（允许区间: $yesterday ~ $today）"
    exit 0
fi

selected=$(printf "%s" "$candidate_rows" | sed '/^$/d' | sort -t'|' -k1,1r -k2,2nr | head -1)
name_date=$(echo "$selected" | cut -d'|' -f1)
LATEST_JSON=$(echo "$selected" | cut -d'|' -f3-)

if [ ! -f "$LATEST_JSON" ]; then
    log "❌ 候选文件不存在: $LATEST_JSON"
    exit 1
fi

filename=$(basename "$LATEST_JSON")
file_date=$(stat -c %y "$LATEST_JSON" | cut -d' ' -f1)

log ""
log "📄 发现最新新闻: $filename"
log "📅 文件时间: $file_date"

# 检查JSON文件是否有效
if ! jq empty "$LATEST_JSON" 2>/dev/null; then
    log "❌ JSON文件格式无效: $LATEST_JSON"
    exit 1
fi

# 检查JSON格式并提取articles数组
article_count=$(jq '.articles | length' "$LATEST_JSON" 2>/dev/null || echo "0")
if [ "$article_count" -eq 0 ]; then
    log "⚠️  JSON文件中没有文章数据"
    exit 1
fi

log "📊 文章数量: $article_count"

# 获取Token
log "🔐 获取认证Token..."
token=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" \
    | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$token" ]; then
    log "❌ 获取Token失败"
    exit 1
fi

log "✅ Token获取成功"

# 提取articles数组并创建包装JSON（API期望 {date, articles: [...]} 格式）
wrapped_json="$PROJECT_DIR/data/wrapped-import.json"
jq --arg report_date "$name_date" '{date: $report_date, articles: .articles}' "$LATEST_JSON" > "$wrapped_json"

# 导入到网站
log "📤 导入到网站..."

response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d @"$wrapped_json")

# 检查结果
if echo "$response" | grep -q "success\|成功导入\|导入完成\|今日资讯\|todayCount"; then
    log "✅ 成功导入 $article_count 篇文章"

    # 归档副本（保留源目录原文件）
    archive_dir="$PROJECT_DIR/reports-archive"
    mkdir -p "$archive_dir"
    cp -f "$LATEST_JSON" "$archive_dir/"
    log "📁 已归档副本: $filename"

    # 同步到 data 目录，供网站接口直接读取
    daily_data_file="$PROJECT_DIR/data/news-$name_date.json"
    compatibility_data_file="$PROJECT_DIR/data/$name_date.json"
    cp -f "$LATEST_JSON" "$daily_data_file"
    cp -f "$LATEST_JSON" "$compatibility_data_file"
    chmod 644 "$daily_data_file" "$compatibility_data_file" 2>/dev/null || true
    log "🗂️  已写入 data: $(basename "$daily_data_file"), $(basename "$compatibility_data_file")"

    # 清理临时文件
    rm -f "$wrapped_json"

    log ""
    log "============================================"
    log "✨ 同步完成！"
    log "============================================"
else
    log "❌ 导入失败: $response"
    rm -f "$wrapped_json"
    exit 1
fi

exit 0
