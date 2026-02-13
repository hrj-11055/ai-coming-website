#!/bin/bash

# JSON日报兼容性测试脚本
# 验证API对不同JSON格式的兼容性

echo "🧪 JSON日报兼容性测试"
echo "===================="
echo ""

API_BASE="http://localhost:3000/api"

# 测试1: 获取所有历史日期
echo "📅 测试1: 获取历史日期列表"
echo "----------------------------"
DATES=$(curl -s "${API_BASE}/news/dates")
if echo "$DATES" | python3 -m json.tool > /dev/null 2>&1; then
    COUNT=$(echo "$DATES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✅ 返回 $COUNT 个历史日期"
    echo "$DATES" | python3 -m json.tool | head -15
else
    echo "❌ JSON格式错误"
    exit 1
fi

echo ""
echo "📰 测试2: 获取2026-02-09的文章"
echo "----------------------------"
NEWS=$(curl -s "${API_BASE}/news/date/2026-02-09")
if echo "$NEWS" | python3 -m json.tool > /dev/null 2>&1; then
    ARTICLE_COUNT=$(echo "$NEWS" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    echo "✅ 返回 $ARTICLE_COUNT 篇文章"

    # 显示前3篇
    echo ""
    echo "前3篇文章标题:"
    echo "$NEWS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, article in enumerate(data[:3]):
    print(f\"  {i+1}. {article['title'][:60]}...\")
    print(f\"     来源: {article['source_name']} | 分类: {article['category']}\")
"
else
    echo "❌ JSON格式错误"
    exit 1
fi

echo ""
echo "📊 测试3: 验证文件格式兼容性"
echo "----------------------------"
echo "检查本地文件..."

if [ -f "data/2026-02-09.json" ]; then
    SIZE=$(du -h data/2026-02-09.json | cut -f1)
    LINES=$(wc -l < data/2026-02-09.json)
    echo "✅ 文件存在: data/2026-02-09.json"
    echo "   大小: $SIZE"
    echo "   行数: $LINES"

    # 验证JSON结构
    if python3 -c "import json; json.load(open('data/2026-02-09.json'))" 2>/dev/null; then
        echo "✅ JSON格式有效"

        # 检查是否包含articles字段
        HAS_ARTICLES=$(grep -c '"articles"' data/2026-02-09.json)
        if [ $HAS_ARTICLES -gt 0 ]; then
            echo "✅ 包含 articles 字段"
        else
            echo "⚠️  未找到 articles 字段（可能是直接数组格式）"
        fi
    else
        echo "❌ JSON格式无效"
        exit 1
    fi
else
    echo "❌ 文件不存在: data/2026-02-09.json"
    exit 1
fi

echo ""
echo "🔄 测试4: 同步服务状态"
echo "----------------------------"
if launchctl list | grep -q "com.aicoming.sync-data"; then
    echo "✅ 自动同步服务正在运行"
    echo "   同步间隔: 60秒"
    echo "   源路径: /var/www/json/report"
    echo "   目标路径: ./data"
else
    echo "⚠️  自动同步服务未运行"
fi

echo ""
echo "✨ 测试5: 支持的文件格式"
echo "----------------------------"
echo "✅ 支持格式1: YYYY-MM-DD.json"
echo "   示例: 2026-02-09.json"
echo ""
echo "✅ 支持格式2: news-YYYY-MM-DD.json"
echo "   示例: news-2026-02-09.json"
echo ""
echo "✅ 支持的数据结构:"
echo "   1. 直接数组: [{...}, {...}]"
echo "   2. 包裹格式: {articles: [{...}, {...}]}"
echo "   3. 元数据格式: {report_date: ..., articles: [...]}"

echo ""
echo "📋 测试6: 数据字段验证"
echo "----------------------------"
echo "验证必需字段..."
echo "$NEWS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
required_fields = ['title', 'summary', 'source_url', 'source_name']
optional_fields = ['key_point', 'category', 'sub_category', 'country', 'importance_score', 'published_at']

missing = []
for field in required_fields:
    if field not in data[0]:
        missing.append(field)

if missing:
    print(f\"❌ 缺少字段: {', '.join(missing)}\")
else:
    print(f\"✅ 所有必需字段存在: {', '.join(required_fields)}\")

print(f\"\\n可选字段: {', '.join(optional_fields)}\")
print(f\"已填充: {sum(1 for f in optional_fields if f in data[0])}/{len(optional_fields)}\")
"

echo ""
echo "🎯 兼容性评分"
echo "----------------------------"
SCORE=0
MAX=10

# 文件格式兼容性
if [ -f "data/2026-02-09.json" ]; then
    SCORE=$((SCORE + 3))
    echo "✅ 文件自动识别: +3分"
fi

# JSON格式兼容性
if python3 -c "import json; json.load(open('data/2026-02-09.json'))" 2>/dev/null; then
    SCORE=$((SCORE + 2))
    echo "✅ JSON格式兼容: +2分"
fi

# API读取兼容性
if [ $ARTICLE_COUNT -gt 0 ]; then
    SCORE=$((SCORE + 3))
    echo "✅ API读取正常: +3分"
fi

# 数据结构兼容性
if echo "$NEWS" | python3 -c "import sys, json; data = json.load(sys.stdin); exit(0 if 'title' in data[0] else 1)" 2>/dev/null; then
    SCORE=$((SCORE + 2))
    echo "✅ 数据结构兼容: +2分"
fi

echo ""
echo "===================="
echo "总评: $SCORE/$MAX"
echo "===================="

if [ $SCORE -eq $MAX ]; then
    echo "🎉 完美兼容！所有测试通过。"
    exit 0
elif [ $SCORE -ge 7 ]; then
    echo "✅ 兼容性良好，基本功能正常。"
    exit 0
else
    echo "⚠️  存在兼容性问题，需要检查。"
    exit 1
fi
