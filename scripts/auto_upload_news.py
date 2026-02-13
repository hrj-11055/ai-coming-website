#!/usr/bin/env python3
"""
自动上传新闻脚本
用于自动化批量上传新闻数据到AI资讯系统
"""

import requests
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# 配置
API_BASE = os.getenv('API_URL', 'http://localhost:3000')
JWT_TOKEN = os.getenv('JWT_TOKEN')

class Colors:
    reset = '\x1b[0m'
    green = '\x1b[32m'
    red = '\x1b[31m'
    yellow = '\x1b[33m'
    blue = '\x1b[34m'

def log(message, color=Colors.reset):
    print(f"{color}{message}{Colors.reset}")

def login(username, password):
    """登录获取Token"""
    try:
        log('正在登录...', Colors.blue)

        response = requests.post(f'{API_BASE}/api/auth/login', json={
            'username': username,
            'password': password
        })

        response.raise_for_status()
        token = response.json()['token']

        log('登录成功！', Colors.green)
        return token
    except requests.exceptions.RequestException as e:
        log(f'登录失败: {e}', Colors.red)
        raise

def upload_news(news_data, token):
    """批量上传新闻"""
    try:
        log(f'准备上传 {len(news_data)} 条新闻...', Colors.blue)

        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

        response = requests.post(
            f'{API_BASE}/api/news/batch',
            json={'articles': news_data},
            headers=headers
        )

        response.raise_for_status()
        result = response.json()

        log(f'✅ 上传成功！', Colors.green)
        log(f'   - 新增新闻: {result.get("todayCount", 0)} 篇', Colors.green)
        log(f'   - 归档旧闻: {result.get("archived", 0)} 天', Colors.green)

        return result
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                error_msg = error_data.get('error', error_msg)
            except:
                pass

            if e.response.status_code == 401:
                log('Token可能已过期，请重新登录', Colors.yellow)

        log(f'❌ 上传失败: {error_msg}', Colors.red)
        raise

def load_news_from_file(file_path):
    """从JSON文件读取新闻数据"""
    try:
        log(f'读取文件: {file_path}', Colors.blue)

        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f'文件不存在: {path.absolute()}')

        with open(path, 'r', encoding='utf-8') as f:
            news_data = json.load(f)

        if not isinstance(news_data, list):
            raise ValueError('数据格式错误：应该是数组格式')

        # 验证数据格式
        for i, item in enumerate(news_data):
            if not item.get('title') or not item.get('summary'):
                raise ValueError(f'第 {i + 1} 条数据缺少必要字段 (title, summary)')

        log(f'✅ 成功读取 {len(news_data)} 条新闻', Colors.green)
        return news_data
    except Exception as e:
        log(f'文件读取失败: {e}', Colors.red)
        raise

def main():
    try:
        log('=' * 40, Colors.blue)
        log('   AI新闻自动上传工具', Colors.blue)
        log('=' * 40 + '\n', Colors.blue)

        # 检查参数
        if len(sys.argv) < 2:
            log('用法: python auto_upload_news.py <news-data.json>', Colors.yellow)
            log('示例: python auto_upload_news.py ../data/news-upload.json', Colors.yellow)
            sys.exit(1)

        file_path = sys.argv[1]

        # 检查Token
        token = JWT_TOKEN
        if not token:
            log('未找到JWT_TOKEN环境变量', Colors.yellow)
            log('正在尝试登录...', Colors.yellow)

            username = os.getenv('ADMIN_USERNAME', 'admin')
            password = os.getenv('ADMIN_PASSWORD', 'admin123456')

            token = login(username, password)
            log(f'\n请设置环境变量以便下次使用:', Colors.yellow)
            log(f'export JWT_TOKEN={token}\n', Colors.blue)
            return

        # 读取并上传新闻
        news_data = load_news_from_file(file_path)
        upload_news(news_data, token)

        log('\n' + '=' * 40, Colors.green)
        log('   完成！', Colors.green)
        log('=' * 40, Colors.green)

    except Exception as e:
        log(f'\n执行失败: {e}', Colors.red)
        sys.exit(1)

if __name__ == '__main__':
    main()
