// AI News Management System - MySQL版本
// 企业级MySQL数据库支持
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Import database configuration
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required.');
}

// =====================================================
// Middleware 配置
// =====================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
const staticRoot = process.env.STATIC_ROOT;
if (staticRoot) {
    const resolvedStaticRoot = path.resolve(__dirname, staticRoot);
    if (fs.existsSync(resolvedStaticRoot)) {
        app.use(express.static(resolvedStaticRoot));
        console.log('✅ Serving static files from ' + resolvedStaticRoot);
    } else {
        console.warn('⚠️  STATIC_ROOT ' + resolvedStaticRoot + ' not found; static hosting disabled.');
    }
}

// =====================================================
// Authentication Middleware JWT认证中间件
// =====================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '访问令牌缺失' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '访问令牌无效' });
        }
        req.user = user;
        next();
    });
}

// =====================================================
// Helper Functions 辅助函数
// =====================================================
function generateId(type = 'daily') {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const typeCode = type === 'weekly' ? 'W' : '';
    const sequence = Math.floor(Math.random() * 9999) + 1;
    const sequenceStr = sequence.toString().padStart(4, '0');

    return year + month + day + typeCode + sequenceStr;
}

// =====================================================
// API Routes - Authentication 认证相关
// =====================================================

// 管理员登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [admins] = await db.query(
            'SELECT * FROM admins WHERE username = ? AND status = ?',
            [username, 'active']
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const admin = admins[0];

        if (!bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 更新最后登录时间
        await db.query(
            'UPDATE admins SET last_login_at = NOW() WHERE id = ?',
            [admin.id]
        );

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            user: {
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

// =====================================================
// API Routes - Keywords 关键词管理
// =====================================================

// 获取关键词列表
app.get('/api/keywords', async (req, res) => {
    try {
        const keywords = await db.query(
            'SELECT * FROM keywords WHERE is_active = TRUE ORDER BY weight DESC, created_at DESC'
        );
        res.json(keywords);
    } catch (error) {
        console.error('获取关键词失败:', error);
        res.status(500).json({ error: '获取关键词失败' });
    }
});

// 添加关键词
app.post('/api/keywords', authenticateToken, async (req, res) => {
    try {
        const { text, weight, size, fontSize } = req.body;

        const insertId = await db.insert(
            'INSERT INTO keywords (text, weight, size, font_size) VALUES (?, ?, ?, ?)',
            [text, weight || 1, size || 'small', fontSize || null]
        );

        res.json({ id: insertId, message: '关键词添加成功' });
    } catch (error) {
        console.error('添加关键词失败:', error);
        res.status(500).json({ error: '添加关键词失败' });
    }
});

// 更新关键词
app.put('/api/keywords/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { text, weight, size, fontSize } = req.body;

        const affectedRows = await db.update(
            'UPDATE keywords SET text = ?, weight = ?, size = ?, font_size = ? WHERE id = ?',
            [text, weight, size, fontSize, id]
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: '关键词不存在' });
        }

        res.json({ message: '关键词更新成功' });
    } catch (error) {
        console.error('更新关键词失败:', error);
        res.status(500).json({ error: '更新关键词失败' });
    }
});

// 删除关键词
app.delete('/api/keywords/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const affectedRows = await db.update(
            'UPDATE keywords SET is_active = FALSE WHERE id = ?',
            [id]
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: '关键词不存在' });
        }

        res.json({ message: '关键词删除成功' });
    } catch (error) {
        console.error('删除关键词失败:', error);
        res.status(500).json({ error: '删除关键词失败' });
    }
});

// 批量导入关键词
app.post('/api/keywords/batch', authenticateToken, async (req, res) => {
    try {
        const { keywords } = req.body;

        if (!Array.isArray(keywords)) {
            return res.status(400).json({ error: '关键词数据格式错误' });
        }

        // 使用事务批量插入
        await db.transaction(async (connection) => {
            for (const keyword of keywords) {
                await connection.execute(
                    'INSERT INTO keywords (text, weight, size) VALUES (?, ?, ?)',
                    [keyword.text, keyword.weight || 1, keyword.size || 'small']
                );
            }
        });

        res.json({ message: `成功导入 ${keywords.length} 个关键词` });
    } catch (error) {
        console.error('批量导入关键词失败:', error);
        res.status(500).json({ error: '批量导入关键词失败' });
    }
});

// =====================================================
// API Routes - News 新闻管理
// =====================================================

// 获取新闻列表
app.get('/api/news', async (req, res) => {
    try {
        const { category, country, limit, offset = 0 } = req.query;

        let displayLimit = limit;
        if (!displayLimit) {
            const [settings] = await db.query(
                "SELECT value FROM system_settings WHERE `key` = 'todayNewsDisplayCount'"
            );
            displayLimit = settings.length > 0 ? parseInt(settings[0].value) : 20;
        }

        let sql = 'SELECT * FROM news WHERE is_today = TRUE';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (country) {
            sql += ' AND country = ?';
            params.push(country);
        }

        sql += ' ORDER BY importance_score DESC, published_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(displayLimit), parseInt(offset));

        const news = await db.query(sql, params);
        res.json(news);
    } catch (error) {
        console.error('获取新闻失败:', error);
        res.status(500).json({ error: '获取新闻失败' });
    }
});

// 添加新闻
app.post('/api/news', authenticateToken, async (req, res) => {
    try {
        const {
            title, key_point, summary, source_url, source_name,
            category, sub_category, country, importance_score, published_at
        } = req.body;

        const importTime = new Date().toISOString();
        const newNews = {
            legacy_id: generateId('daily'),
            title,
            key_point: key_point || '',
            summary,
            source_url: source_url || '#',
            source_name: source_name || '其他',
            category,
            sub_category: sub_category || '',
            country: country || 'global',
            importance_score: importance_score || 1,
            published_at: published_at || new Date().toISOString(),
            is_today: true,
            created_at: importTime
        };

        const insertId = await db.insert(
            `INSERT INTO news (legacy_id, title, key_point, summary, source_url, source_name,
             category, sub_category, country, importance_score, published_at, is_today, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newNews.legacy_id, newNews.title, newNews.key_point, newNews.summary,
                newNews.source_url, newNews.source_name, newNews.category, newNews.sub_category,
                newNews.country, newNews.importance_score, newNews.published_at,
                newNews.is_today, newNews.created_at
            ]
        );

        res.json({ id: insertId, message: '新闻添加成功' });
    } catch (error) {
        console.error('添加新闻失败:', error);
        res.status(500).json({ error: '添加新闻失败' });
    }
});

// 删除新闻
app.delete('/api/news/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const affectedRows = await db.remove(
            'DELETE FROM news WHERE id = ?',
            [id]
        );

        if (affectedRows === 0) {
            return res.status(404).json({ error: '新闻不存在' });
        }

        res.json({ message: '新闻删除成功' });
    } catch (error) {
        console.error('删除新闻失败:', error);
        res.status(500).json({ error: '删除新闻失败' });
    }
});

// 批量导入新闻
app.post('/api/news/batch', authenticateToken, async (req, res) => {
    try {
        const { articles } = req.body;

        if (!Array.isArray(articles)) {
            return res.status(400).json({ error: '新闻数据格式错误' });
        }

        // 归档旧新闻
        await db.update(
            'UPDATE news SET is_today = FALSE WHERE is_today = TRUE'
        );

        // 批量插入新新闻
        await db.transaction(async (connection) => {
            const importTime = new Date().toISOString();

            for (const article of articles) {
                await connection.execute(
                    `INSERT INTO news (legacy_id, title, key_point, summary, source_url, source_name,
                     category, sub_category, country, importance_score, published_at, is_today, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        generateId('daily'),
                        article.title || '无标题',
                        article.key_point || '',
                        article.summary || '无摘要',
                        article.source_url || article.url || '#',
                        article.source_name || '其他',
                        article.category || '未分类',
                        article.sub_category || '',
                        article.country || 'global',
                        article.importance_score || 1,
                        article.published_at || new Date().toISOString(),
                        true,
                        importTime
                    ]
                );
            }
        });

        res.json({ message: `成功导入 ${articles.length} 篇新闻` });
    } catch (error) {
        console.error('批量导入新闻失败:', error);
        res.status(500).json({ error: '批量导入新闻失败' });
    }
});

// =====================================================
// API Routes - Statistics 统计数据
// =====================================================

app.get('/api/stats', async (req, res) => {
    try {
        const [keywordsCount] = await db.query('SELECT COUNT(*) as count FROM keywords WHERE is_active = TRUE');
        const [newsCount] = await db.query('SELECT COUNT(*) as count FROM news WHERE is_today = TRUE');
        const [weeklyNewsCount] = await db.query('SELECT COUNT(*) as count FROM weekly_news');
        const [highImportanceCount] = await db.query(
            'SELECT COUNT(*) as count FROM news WHERE importance_score >= 8 AND is_today = TRUE'
        );

        const stats = {
            keywords: keywordsCount[0].count,
            news: newsCount[0].count + weeklyNewsCount[0].count,
            dailyNews: newsCount[0].count,
            weeklyNews: weeklyNewsCount[0].count,
            highImportanceNews: highImportanceCount[0].count
        };

        res.json(stats);
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ error: '获取统计数据失败' });
    }
});

// =====================================================
// API Routes - Settings 系统设置
// =====================================================

app.get('/api/settings', async (req, res) => {
    try {
        const settings = await db.query('SELECT * FROM system_settings');

        // 转换为键值对格式
        const settingsObj = {};
        settings.forEach(setting => {
            let value = setting.value;
            if (setting.type === 'number') {
                value = Number(value);
            } else if (setting.type === 'boolean') {
                value = value === 'true';
            } else if (setting.type === 'json') {
                value = JSON.parse(value);
            }
            settingsObj[setting.key] = value;
        });

        res.json(settingsObj);
    } catch (error) {
        console.error('读取设置失败:', error);
        res.status(500).json({ error: '读取设置失败' });
    }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
    try {
        const { todayNewsDisplayCount } = req.body;

        if (todayNewsDisplayCount && (todayNewsDisplayCount < 1 || todayNewsDisplayCount > 50)) {
            return res.status(400).json({ error: '显示数量必须在1-50之间' });
        }

        // 更新设置
        await db.update(
            'UPDATE system_settings SET value = ? WHERE `key` = ?',
            [todayNewsDisplayCount, 'todayNewsDisplayCount']
        );

        const settings = await db.query('SELECT * FROM system_settings');
        res.json({ message: '设置更新成功', settings });
    } catch (error) {
        console.error('更新设置失败:', error);
        res.status(500).json({ error: '更新设置失败' });
    }
});

// =====================================================
// Health Check 健康检查
// =====================================================
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await db.testConnection();
        res.json({
            status: 'ok',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// =====================================================
// Server Startup 服务器启动
// =====================================================

async function startServer() {
    try {
        // 测试数据库连接
        console.log('正在连接MySQL数据库...');
        const dbConnected = await db.testConnection();

        if (!dbConnected) {
            console.error('❌ 数据库连接失败，请检查配置');
            console.log('请确保：');
            console.log('1. MySQL服务已启动');
            console.log('2. 数据库已创建（运行: npm run db:init）');
            console.log('3. .env文件中的数据库配置正确');
            process.exit(1);
        }

        // 启动服务器
        app.listen(PORT, () => {
            console.log('');
            console.log('========================================');
            console.log('   AI News Management System');
            console.log('   MySQL Enterprise Edition');
            console.log('========================================');
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 Admin Panel: http://localhost:${PORT}/data-manager.html`);
            console.log(`📚 API Health: http://localhost:${PORT}/api/health`);
            console.log('========================================');
            console.log('');
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...');
    await db.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n正在关闭服务器...');
    await db.closePool();
    process.exit(0);
});
