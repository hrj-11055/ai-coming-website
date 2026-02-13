// JSON to MySQL Migration Script
// 数据迁移脚本 - 从JSON文件迁移到MySQL数据库
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const db = require('../config/database');

const DATA_DIR = path.join(__dirname, '../data');

async function migrateKeywords() {
    try {
        console.log('📝 迁移关键词数据...');

        const filePath = path.join(DATA_DIR, 'keywords.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  keywords.json 不存在，跳过');
            return;
        }

        const keywords = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (keywords.length === 0) {
            console.log('⚠️  keywords.json 为空，跳过');
            return;
        }

        let count = 0;
        for (const kw of keywords) {
            try {
                await db.insert(
                    `INSERT INTO keywords (text, weight, size, font_size, is_active, created_at, updated_at)
                     VALUES (?, ?, ?, ?, TRUE, ?, ?)`,
                    [kw.text, kw.weight, kw.size, kw.fontSize || null, kw.created_at, kw.updated_at]
                );
                count++;
            } catch (err) {
                console.error(`插入关键词失败: ${kw.text}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count}/${keywords.length} 个关键词`);
    } catch (error) {
        console.error('❌ 迁移关键词失败:', error.message);
    }
}

async function migrateNews() {
    try {
        console.log('📰 迁移新闻数据...');

        const filePath = path.join(DATA_DIR, 'news.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  news.json 不存在，跳过');
            return;
        }

        const news = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (news.length === 0) {
            console.log('⚠️  news.json 为空，跳过');
            return;
        }

        let count = 0;
        for (const item of news) {
            try {
                await db.insert(
                    `INSERT INTO news (legacy_id, title, key_point, summary, source_url, source_name,
                     category, sub_category, country, importance_score, published_at, is_today, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.id.toString(), item.title, item.key_point || '', item.summary,
                        item.source_url || '#', item.source_name || '其他',
                        item.category || '未分类', item.sub_category || '',
                        item.country || 'global', item.importance_score || 1,
                        item.published_at || null, item.is_today || false, item.created_at
                    ]
                );
                count++;
            } catch (err) {
                console.error(`插入新闻失败: ${item.title}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count}/${news.length} 条新闻`);
    } catch (error) {
        console.error('❌ 迁移新闻失败:', error.message);
    }
}

async function migrateWeeklyNews() {
    try {
        console.log('📅 迁移每周资讯数据...');

        const filePath = path.join(DATA_DIR, 'weekly-news.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  weekly-news.json 不存在，跳过');
            return;
        }

        const news = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (news.length === 0) {
            console.log('⚠️  weekly-news.json 为空，跳过');
            return;
        }

        let count = 0;
        for (const item of news) {
            try {
                await db.insert(
                    `INSERT INTO weekly_news (legacy_id, title, key_point, summary, source_url, source_name,
                     category, sub_category, weekly_category, country, importance_score, published_at,
                     week_number, week_start_date, is_weekly_featured, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.id.toString(), item.title, item.key_point || '', item.summary,
                        item.source_url || '#', item.source_name || '其他',
                        item.category || '未分类', item.sub_category || '',
                        item.weekly_category || 'tech', item.country || 'global',
                        item.importance_score || 1, item.published_at || null,
                        item.week_number || null, item.week_start_date || null,
                        item.is_weekly_featured || false, item.created_at
                    ]
                );
                count++;
            } catch (err) {
                console.error(`插入每周资讯失败: ${item.title}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count}/${news.length} 条每周资讯`);
    } catch (error) {
        console.error('❌ 迁移每周资讯失败:', error.message);
    }
}

async function migrateAdmins() {
    try {
        console.log('👤 迁移管理员数据...');

        const filePath = path.join(DATA_DIR, 'admins.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  admins.json 不存在，跳过');
            return;
        }

        const admins = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (admins.length === 0) {
            console.log('⚠️  admins.json 为空，跳过');
            return;
        }

        let count = 0;
        for (const admin of admins) {
            try {
                await db.insert(
                    'INSERT INTO admins (username, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?)',
                    [admin.username, admin.password_hash, admin.role, 'active', admin.created_at]
                );
                count++;
            } catch (err) {
                console.error(`插入管理员失败: ${admin.username}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count}/${admins.length} 个管理员`);
    } catch (error) {
        console.error('❌ 迁移管理员失败:', error.message);
    }
}

async function migrateTools() {
    try {
        console.log('🔧 迁移AI工具数据...');

        const filePath = path.join(DATA_DIR, 'tools.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  tools.json 不存在，跳过');
            return;
        }

        const tools = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (tools.length === 0) {
            console.log('⚠️  tools.json 为空，跳过');
            return;
        }

        let count = 0;
        for (const tool of tools) {
            try {
                await db.insert(
                    `INSERT INTO tools (legacy_id, name, slug, description, categories, subcategories,
                     region, region_support, language, price, rating, website, logo, tags, featured, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        tool.id, tool.name, tool.slug, tool.description,
                        JSON.stringify(tool.categories || []),
                        JSON.stringify(tool.subcategories || []),
                        tool.region || '国际',
                        JSON.stringify(tool.region_support || []),
                        JSON.stringify(tool.language || []),
                        tool.price || '免费', tool.rating || 0, tool.website,
                        tool.logo || null, JSON.stringify(tool.tags || []),
                        tool.featured || false, tool.created_at, tool.updated_at
                    ]
                );
                count++;
            } catch (err) {
                console.error(`插入工具失败: ${tool.name}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count}/${tools.length} 个AI工具`);
    } catch (error) {
        console.error('❌ 迁移AI工具失败:', error.message);
    }
}

async function migrateToolCategories() {
    try {
        console.log('📁 迁移工具分类数据...');

        const filePath = path.join(DATA_DIR, 'tool-categories.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  tool-categories.json 不存在，跳过');
            return;
        }

        const categories = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (categories.length === 0) {
            console.log('⚠️  tool-categories.json 为空，跳过');
            return;
        }

        let count = 0;
        for (const cat of categories) {
            try {
                const insertId = await db.insert(
                    'INSERT INTO tool_categories (parent_id, name, icon, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [null, cat.name, cat.icon, cat.description, count, cat.created_at || new Date().toISOString(), cat.updated_at || new Date().toISOString()]
                );

                // 插入子分类
                if (cat.children && cat.children.length > 0) {
                    for (const child of cat.children) {
                        await db.insert(
                            'INSERT INTO tool_categories (parent_id, name, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                            [insertId, child.name, child.description, 0, new Date().toISOString(), new Date().toISOString()]
                        );
                    }
                }

                count++;
            } catch (err) {
                console.error(`插入分类失败: ${cat.name}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count}/${categories.length} 个工具分类`);
    } catch (error) {
        console.error('❌ 迁移工具分类失败:', error.message);
    }
}

async function migrateSystemSettings() {
    try {
        console.log('⚙️  迁移系统设置...');

        const filePath = path.join(DATA_DIR, 'settings.json');
        if (!fs.existsSync(filePath)) {
            console.log('⚠️  settings.json 不存在，使用默认值');
            return;
        }

        const settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        let count = 0;
        for (const [key, value] of Object.entries(settings)) {
            if (key === 'version' || key === 'lastUpdated') continue;

            try {
                const type = typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string';

                await db.query(
                    `INSERT INTO system_settings (\`key\`, \`value\`, \`type\`, description)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE \`value\` = ?, \`type\` = ?`,
                    [key, value.toString(), type, `系统设置: ${key}`, value.toString(), type]
                );
                count++;
            } catch (err) {
                console.error(`插入设置失败: ${key}`, err.message);
            }
        }

        console.log(`✅ 成功迁移 ${count} 个系统设置`);
    } catch (error) {
        console.error('❌ 迁移系统设置失败:', error.message);
    }
}

async function runMigration() {
    console.log('========================================');
    console.log('   数据迁移: JSON → MySQL');
    console.log('========================================\n');

    try {
        // 测试数据库连接
        const connected = await db.testConnection();
        if (!connected) {
            console.error('❌ 数据库连接失败，请检查配置');
            process.exit(1);
        }

        console.log('开始迁移...\n');

        // 按顺序迁移
        await migrateSystemSettings();
        await migrateAdmins();
        await migrateKeywords();
        await migrateNews();
        await migrateWeeklyNews();
        await migrateToolCategories();
        await migrateTools();

        console.log('\n========================================');
        console.log('✅ 数据迁移完成！');
        console.log('========================================\n');

        console.log('下一步：');
        console.log('1. 启动服务器: npm start');
        console.log('2. 访问: http://localhost:3000');
        console.log('3. 测试功能是否正常\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ 迁移失败:', error);
        process.exit(1);
    }
}

// 运行迁移
runMigration();
