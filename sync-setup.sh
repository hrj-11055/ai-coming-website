#!/bin/bash

# ============================================
# Mutagen 同步设置脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Mutagen 双向同步设置${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# =====================================================
# 1. 获取服务器信息
# =====================================================

if [ -z "$SERVER_USER" ]; then
    echo -e "${YELLOW}请输入服务器连接信息:${NC}"
    echo -e "示例: root@192.168.1.100 或 ubuntu@your-domain.com"
    read -p "服务器地址 (user@hostname): " SERVER_USER_HOST
else
    SERVER_USER_HOST=$SERVER_USER
fi

if [ -z "$SERVER_PATH" ]; then
    read -p "服务器项目路径 [/var/www/ai-coming-website]: " SERVER_PATH_INPUT
    SERVER_PATH=${SERVER_PATH_INPUT:-/var/www/ai-coming-website}
else
    SERVER_PATH=$SERVER_PATH
fi

echo ""
echo -e "${GREEN}连接信息:${NC} $SERVER_USER_HOST"
echo -e "${GREEN}目标路径:${NC} $SERVER_PATH"
echo ""

# =====================================================
# 2. 测试SSH连接
# =====================================================

echo -e "${YELLOW}[1/5] 测试SSH连接...${NC}"
if ssh -o ConnectTimeout=5 "$SERVER_USER_HOST" "echo 'SSH连接成功'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH连接正常${NC}"
else
    echo -e "${RED}✗ SSH连接失败${NC}"
    echo -e "${YELLOW}请检查:${NC}"
    echo "  1. 服务器地址是否正确"
    echo "  2. SSH密钥是否已配置"
    echo "  3. 服务器SSH服务是否运行"
    echo ""
    echo "配置SSH密钥提示:"
    echo "  # 复制公钥到服务器"
    echo "  ssh-copy-id $SERVER_USER_HOST"
    exit 1
fi
echo ""

# =====================================================
# 3. 在服务器上创建目录
# =====================================================

echo -e "${YELLOW}[2/5] 在服务器上创建目录...${NC}"
ssh "$SERVER_USER_HOST" "mkdir -p $SERVER_PATH && echo '目录创建成功'"
echo -e "${GREEN}✓ 服务器目录已创建${NC}"
echo ""

# =====================================================
# 4. 生成 Mutagen 配置
# =====================================================

echo -e "${YELLOW}[3/5] 生成 Mutagen 配置文件...${NC}"

cat > mutagen.project.yml <<EOF
# Mutagen 项目配置
# 自动生成于: $(date)

sync:
  defaults:
    mode: two-way-resolved
    conflictStrategy: newer
    permissions:
      mode: portable
      owner: false
      group: false

  # AI网站项目同步
  ai-website:
    source: .
    destination: $SERVER_USER_HOST:$SERVER_PATH
    mode: two-way-resolved

    # 排除规则
    ignore:
      vcs: true

      paths:
        # 依赖包
        - /node_modules
        - package-lock.json

        # 环境和日志
        - /.env
        - /.env.local
        - /logs
        - *.log
        - .DS_Store

        # 备份和测试文件
        - /backup
        - test-*.html
        - test_*.py
        - qwen-comparison-*.json
        - test-*-quickstart.md

        # 旧版文件
        - server.js
        - server-ubuntu.js

        # 文档（保留重要文档）
        - *.md
        - !README.md
        - !CLAUDE.md

    # 权限
    permissions:
      mode: portable
      defaultFileMode: 0644
      defaultDirectoryMode: 0755

    # 性能
    batchMode: true
    symlinkMode: posix-raw
EOF

echo -e "${GREEN}✓ 配置文件已生成: mutagen.project.yml${NC}"
echo ""

# =====================================================
# 5. 停止现有同步会话（如果存在）
# =====================================================

echo -e "${YELLOW}[4/5] 检查现有同步会话...${NC}"
if mutagen sync list | grep -q "ai-website"; then
    echo "发现现有同步会话，正在终止..."
    mutagen sync terminate ai-website
    echo -e "${GREEN}✓ 旧会话已终止${NC}"
else
    echo -e "${GREEN}✓ 没有现有会话${NC}"
fi
echo ""

# =====================================================
# 6. 创建并启动同步
# =====================================================

echo -e "${YELLOW}[5/5] 创建并启动同步会话...${NC}"

# 使用项目配置文件
mutagen project start

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  同步设置完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# =====================================================
# 7. 显示同步状态
# =====================================================

echo -e "${BLUE}当前同步状态:${NC}"
mutagen sync list
echo ""

# =====================================================
# 8. 常用命令提示
# =====================================================

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  常用命令${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "查看同步状态:"
echo "  mutagen sync list"
echo "  mutagen project list"
echo ""
echo "查看同步日志:"
echo "  mutagen sync flush ai-website"
echo ""
echo "暂停同步:"
echo "  mutagen sync pause ai-website"
echo "  mutagen project pause"
echo ""
echo "恢复同步:"
echo "  mutagen sync resume ai-website"
echo "  mutagen project resume"
echo ""
echo "终止同步:"
echo "  mutagen sync terminate ai-website"
echo "  mutagen project terminate"
echo ""
echo "手动触发同步:"
echo "  mutagen sync flush ai-website"
echo ""
echo -e "${YELLOW}提示: 文件修改后会自动同步${NC}"
echo ""

# =====================================================
# 9. 测试同步
# =====================================================

echo -e "${YELLOW}是否现在测试同步效果? (y/n)${NC}"
read -p "> " TEST_SYNC

if [ "$TEST_SYNC" = "y" ] || [ "$TEST_SYNC" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}创建测试文件...${NC}"
    echo "Test at $(date)" > .sync-test.txt

    echo -e "${YELLOW}等待同步（5秒）...${NC}"
    sleep 5

    echo -e "${YELLOW}检查服务器文件...${NC}"
    if ssh "$SERVER_USER_HOST" "test -f $SERVER_PATH/.sync-test.txt && cat $SERVER_PATH/.sync-test.txt"; then
        echo -e "${GREEN}✓ 同步测试成功！${NC}"

        # 清理测试文件
        rm .sync-test.txt
        ssh "$SERVER_USER_HOST" "rm $SERVER_PATH/.sync-test.txt"
    else
        echo -e "${RED}✗ 同步测试失败${NC}"
    fi
fi

echo ""
echo -e "${GREEN}设置完成！${NC}"
