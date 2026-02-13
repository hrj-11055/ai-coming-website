/**
 * API导入测试脚本
 * 测试将转换后的JSON数据导入到系统
 */

const fs = require('fs');
const path = require('path');

// API配置
const API_BASE_URL = 'http://localhost:3000/api';
const JSON_FILE = path.join(__dirname, '../data/news-2026-01-16.json');

/**
 * 获取管理员Token
 */
async function getAdminToken() {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin123456'
        })
    });

    if (!response.ok) {
        throw new Error('登录失败');
    }

    const data = await response.json();
    return data.token;
}

/**
 * 导入新闻数据
 */
async function importNews(token, jsonFile) {
    // 读取JSON文件
    const articles = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

    console.log(`📦 准备导入 ${articles.length} 篇文章...`);

    // 导入数据
    const response = await fetch(`${API_BASE_URL}/news/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ articles })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导入失败');
    }

    const result = await response.json();
    return result;
}

/**
 * 验证导入结果
 */
async function verifyImport() {
    const response = await fetch(`${API_BASE_URL}/news`);

    if (!response.ok) {
        throw new Error('获取新闻失败');
    }

    const news = await response.json();
    return news;
}

/**
 * 主函数
 */
async function main() {
    console.log('🚀 开始API导入测试...\n');

    try {
        // 1. 登录获取Token
        console.log('1️⃣  登录管理员账号...');
        const token = await getAdminToken();
        console.log('✅ 登录成功\n');

        // 2. 导入新闻数据
        console.log('2️⃣  导入新闻数据...');
        const importResult = await importNews(token, JSON_FILE);
        console.log(`✅ 导入成功！`);
        console.log(`   - 导入文章数: ${importResult.todayCount}`);
        console.log(`   - 归档旧文章: ${importResult.archived} 篇\n`);

        // 3. 验证导入结果
        console.log('3️⃣  验证导入结果...');
        const news = await verifyImport();
        console.log(`✅ 验证成功！当前系统中有 ${news.length} 篇文章\n`);

        // 4. 显示前3篇文章预览
        console.log('📋 文章预览:');
        console.log('-'.repeat(80));
        news.slice(0, 3).forEach((article, index) => {
            console.log(`\n${index + 1}. ${article.title}`);
            console.log(`   分类: ${article.category} / ${article.sub_category || '无'}`);
            console.log(`   来源: ${article.source_name}`);
            console.log(`   重要性: ${article.importance_score}/10`);
            console.log(`   摘要: ${article.summary.substring(0, 80)}...`);
        });

        console.log('\n' + '-'.repeat(80));
        console.log('✅ 所有测试通过！\n');

        console.log('🌐 你可以访问以下地址查看导入的文章:');
        console.log('   http://localhost:3000');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        console.error('\n请检查:');
        console.error('1. 服务器是否运行 (npm start)');
        console.error('2. JSON文件是否存在');
        console.error('3. 网络连接是否正常\n');
        process.exit(1);
    }
}

// 运行测试
if (require.main === module) {
    main();
}

module.exports = { importNews, verifyImport };
