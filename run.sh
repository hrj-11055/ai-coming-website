#!/bin/bash

# ============================================
# AI资讯管理系统 - 一键启动脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="AI资讯管理系统"
VERSION="2.0.0"
DEFAULT_PORT=3000

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  ${PROJECT_NAME} v${VERSION}${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 1. 检查 Node.js 是否安装
echo -e "${YELLOW}[1/5] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js 未安装，请先安装 Node.js${NC}"
    echo "  下载地址: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js 已安装: $NODE_VERSION${NC}"
echo ""

# 2. 检查依赖是否安装
echo -e "${YELLOW}[2/5] 检查项目依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装项目依赖...${NC}"
    npm install
    echo -e "${GREEN}✓ 依赖安装完成${NC}"
else
    echo -e "${GREEN}✓ 项目依赖已存在${NC}"
fi
echo ""

# 3. 检查 .env 配置文件
echo -e "${YELLOW}[3/5] 检查配置文件...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}正在创建 .env 配置文件...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ 请编辑 .env 文件,配置以下必要信息:${NC}"
    echo "  - JWT_SECRET (JWT密钥)"
    echo "  - 数据库配置 (如使用MySQL)"
    echo "  - SILICONFLOW_API_KEY (API密钥)"
    echo ""
    read -p "按回车键继续 (请确保已配置 .env 文件)..."
else
    echo -e "${GREEN}✓ 配置文件已存在${NC}"
fi
echo ""

# 4. 检查 MySQL (可选)
echo -e "${YELLOW}[4/5] 检查 MySQL 数据库...${NC}"
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓ MySQL 已安装${NC}"
else
    echo -e "${YELLOW}⚠ MySQL 未检测到,将使用 JSON 文件存储模式${NC}"
fi
echo ""

# 5. 启动服务器
echo -e "${YELLOW}[5/5] 启动服务器...${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  服务器即将启动${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# 获取端口号 (从 .env 或使用默认值)
PORT=$(grep "^PORT=" .env 2>/dev/null | cut -d '=' -f2)
PORT=${PORT:-$DEFAULT_PORT}

echo -e "${BLUE}访问地址:${NC} http://localhost:$PORT"
echo -e "${BLUE}默认管理员:${NC} admin / admin123456"
echo -e "${BLUE}按 Ctrl+C 停止服务器${NC}"
echo ""

# 检查启动模式
if [ "$1" == "--dev" ] || [ "$1" == "-d" ]; then
    echo -e "${YELLOW}使用开发模式启动 (nodemon + JSON)...${NC}"
    npm run start:legacy
elif [ "$1" == "--mysql" ] || [ "$1" == "-m" ]; then
    echo -e "${YELLOW}使用 MySQL 数据库模式启动...${NC}"
    npm start
else
    echo -e "${YELLOW}使用 JSON 文件模式启动 (无需数据库)...${NC}"
    npm run start:legacy
fi
