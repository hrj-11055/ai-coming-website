#!/bin/bash
# 将项目同步到服务器（排除不需要的文件）
# 用法: ./sync-to-server.sh

SERVER="root@8.135.37.159"
REMOTE_PATH="/var/www/ai-coming-website"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"

echo "==> 同步到 ${SERVER}:${REMOTE_PATH}"
rsync -avz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='*.log' \
  --exclude='logs/' \
  --exclude='.DS_Store' \
  --exclude='backup/' \
  --exclude='test-*.html' \
  --exclude='server.js' \
  --exclude='PROJECT_*.md' \
  --exclude='API_*.md' \
  --exclude='*_GUIDE.md' \
  --exclude='*_TEST.md' \
  --exclude='README_*.md' \
  "${LOCAL_PATH}/" "${SERVER}:${REMOTE_PATH}/"

echo "==> 同步完成"
