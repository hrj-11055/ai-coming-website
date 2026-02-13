#!/bin/bash

# ============================================
# Mutagen 同步测试脚本
# ============================================

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Mutagen 同步效果测试${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# =====================================================
# 测试1: 检查同步会话状态
# =====================================================

echo -e "${YELLOW}[测试 1/5] 检查同步会话状态${NC}"
if mutagen sync list | grep -q "ai-website"; then
    echo -e "${GREEN}✓ 同步会话存在${NC}"
    mutagen sync list | grep "ai-website"
else
    echo -e "${RED}✗ 同步会话不存在${NC}"
    echo "请先运行: ./sync-setup.sh"
    exit 1
fi
echo ""

# =====================================================
# 测试2: Mac -> 服务器 同步测试
# =====================================================

echo -e "${YELLOW}[测试 2/5] Mac → 服务器 同步测试${NC}"

# 创建测试文件
TEST_FILE="test-sync-mac-to-server-$(date +%s).txt"
echo "Mac to Server Sync Test" > "$TEST_FILE"
echo "Timestamp: $(date)" >> "$TEST_FILE"
echo "Hostname: $(hostname)" >> "$TEST_FILE"

echo "创建测试文件: $TEST_FILE"
echo "等待同步（10秒）..."

# 等待同步
for i in {10..1}; do
    echo -n "$i "
    sleep 1
done
echo ""

# 检查服务器文件
echo "检查服务器..."
SERVER_PATH=$(grep "destination:" mutagen.yml | head -1 | sed 's/.*destination:.*@//' | sed 's/:.*//')
SERVER_USER=$(grep "destination:" mutagen.yml | head -1 | sed 's/.*destination://' | sed 's/@.*//')

# 从配置读取服务器信息
eval $(grep "SERVER_USER_HOST\|SERVER_PATH" sync-setup.sh | grep "^SERVER" | head -2)

if ssh "$SERVER_USER_HOST" "test -f $SERVER_PATH/$TEST_FILE"; then
    echo -e "${GREEN}✓ 文件已同步到服务器${NC}"
    ssh "$SERVER_USER_HOST" "cat $SERVER_PATH/$TEST_FILE"
else
    echo -e "${RED}✗ 文件未同步到服务器${NC}"
fi

# 清理本地测试文件
rm "$TEST_FILE"
echo ""

# =====================================================
# 测试3: 服务器 -> Mac 同步测试
# =====================================================

echo -e "${YELLOW}[测试 3/5] 服务器 → Mac 同步测试${NC}"

# 在服务器上创建文件
TEST_FILE_SERVER="test-sync-server-to-mac-$(date +%s).txt"
ssh "$SERVER_USER_HOST" "echo 'Server to Mac Sync Test' > $SERVER_PATH/$TEST_FILE_SERVER"
echo "在服务器创建文件: $TEST_FILE_SERVER"

echo "等待同步（10秒）..."
for i in {10..1}; do
    echo -n "$i "
    sleep 1
done
echo ""

# 检查本地文件
if [ -f "$TEST_FILE_SERVER" ]; then
    echo -e "${GREEN}✓ 文件已同步到 Mac${NC}"
    cat "$TEST_FILE_SERVER"
    rm "$TEST_FILE_SERVER"
else
    echo -e "${RED}✗ 文件未同步到 Mac${NC}"
fi
echo ""

# =====================================================
# 测试4: 文件修改同步测试
# =====================================================

echo -e "${YELLOW}[测试 4/5] 文件修改同步测试${NC}"

# 创建测试文件并修改
echo "Version 1" > test-modified.txt
echo "初始版本已创建"

sleep 3

echo "Version 2 - Modified at $(date)" > test-modified.txt
echo "文件已修改"

echo "等待同步（10秒）..."
for i in {10..1}; do
    echo -n "$i "
    sleep 1
done
echo ""

# 检查服务器文件版本
if ssh "$SERVER_USER_HOST" "grep -q 'Version 2' $SERVER_PATH/test-modified.txt"; then
    echo -e "${GREEN}✓ 文件修改已同步${NC}"
else
    echo -e "${RED}✗ 文件修改未同步${NC}"
fi

# 清理
rm test-modified.txt
ssh "$SERVER_USER_HOST" "rm $SERVER_PATH/test-modified.txt" 2>/dev/null || true
echo ""

# =====================================================
# 测试5: 大文件同步测试
# =====================================================

echo -e "${YELLOW}[测试 5/5] 大文件同步测试${NC}"

# 创建较大的测试文件（约1MB）
dd if=/dev/zero of=large-test-file.tmp bs=1024 count=1024 2>/dev/null
echo "创建1MB测试文件"

echo "等待同步（15秒）..."
for i in {15..1}; do
    echo -n "$i "
    sleep 1
done
echo ""

# 检查服务器文件大小
LOCAL_SIZE=$(stat -f%z large-test-file.tmp)
REMOTE_SIZE=$(ssh "$SERVER_USER_HOST" "stat -f%z $SERVER_PATH/large-test-file.tmp" 2>/dev/null || echo "0")

if [ "$LOCAL_SIZE" = "$REMOTE_SIZE" ]; then
    echo -e "${GREEN}✓ 大文件同步成功 ($LOCAL_SIZE bytes)${NC}"
else
    echo -e "${RED}✗ 大文件同步失败${NC}"
    echo "本地大小: $LOCAL_SIZE"
    echo "服务器大小: $REMOTE_SIZE"
fi

# 清理
rm large-test-file.tmp
ssh "$SERVER_USER_HOST" "rm $SERVER_PATH/large-test-file.tmp" 2>/dev/null || true
echo ""

# =====================================================
# 测试总结
# =====================================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  同步测试完成${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}详细状态信息:${NC}"
mutagen sync list
echo ""

echo -e "${YELLOW}同步统计:${NC}"
mutagen sync list ai-website | grep -A 20 "Status:" || true
echo ""

echo -e "${GREEN}测试完成！${NC}"
echo ""
echo "查看实时同步日志:"
echo "  mutagen sync list ai-website"
echo ""
