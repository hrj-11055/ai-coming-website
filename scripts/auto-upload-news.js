#!/usr/bin/env node

/**
 * 自动上传新闻脚本
 * 用于自动化批量上传新闻数据到AI资讯系统
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const JWT_TOKEN = process.env.JWT_TOKEN;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 登录获取Token
 */
async function login() {
  try {
    log('正在登录...', colors.blue);

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';

    const response = await axios.post(`${API_BASE}/api/auth/login`, {
      username,
      password
    });

    const token = response.data.token;
    log('登录成功！', colors.green);
    return token;
  } catch (error) {
    log('登录失败: ' + (error.response?.data?.error || error.message), colors.red);
    throw error;
  }
}

/**
 * 批量上传新闻
 */
async function uploadNews(newsData) {
  try {
    log(`准备上传 ${newsData.length} 条新闻...`, colors.blue);

    const response = await axios.post(
      `${API_BASE}/api/news/batch`,
      { articles: newsData },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data;
    log(`✅ 上传成功！`, colors.green);
    log(`   - 新增新闻: ${result.todayCount} 篇`, colors.green);
    log(`   - 归档旧闻: ${result.archived} 天`, colors.green);

    return result;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;
    log(`❌ 上传失败: ${errorMsg}`, colors.red);

    if (error.response?.status === 401) {
      log('Token可能已过期，请重新登录', colors.yellow);
    }

    throw error;
  }
}

/**
 * 从JSON文件读取新闻数据
 */
function loadNewsFromFile(filePath) {
  try {
    log(`读取文件: ${filePath}`, colors.blue);

    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`文件不存在: ${fullPath}`);
    }

    const data = fs.readFileSync(fullPath, 'utf8');
    const newsData = JSON.parse(data);

    if (!Array.isArray(newsData)) {
      throw new Error('数据格式错误：应该是数组格式');
    }

    // 验证数据格式
    for (let i = 0; i < newsData.length; i++) {
      const item = newsData[i];
      if (!item.title || !item.summary) {
        throw new Error(`第 ${i + 1} 条数据缺少必要字段 (title, summary)`);
      }
    }

    log(`✅ 成功读取 ${newsData.length} 条新闻`, colors.green);
    return newsData;
  } catch (error) {
    log(`文件读取失败: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    log('========================================', colors.blue);
    log('   AI新闻自动上传工具', colors.blue);
    log('========================================\n', colors.blue);

    // 检查参数
    const filePath = process.argv[2];
    if (!filePath) {
      log('用法: node auto-upload-news.js <news-data.json>', colors.yellow);
      log('示例: node auto-upload-news.js ../data/news-upload.json', colors.yellow);
      process.exit(1);
    }

    // 检查Token
    let token = JWT_TOKEN;
    if (!token) {
      log('未找到JWT_TOKEN环境变量', colors.yellow);
      log('正在尝试登录...', colors.yellow);

      token = await login();
      log(`\n请设置环境变量以便下次使用:`, colors.yellow);
      log(`export JWT_TOKEN=${token}\n`, colors.blue);
      return;
    }

    // 读取并上传新闻
    const newsData = loadNewsFromFile(filePath);
    await uploadNews(newsData);

    log('\n========================================', colors.green);
    log('   完成！', colors.green);
    log('========================================', colors.green);

  } catch (error) {
    log('\n执行失败', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

// 运行主函数
main();
