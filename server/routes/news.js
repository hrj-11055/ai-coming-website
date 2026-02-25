const express = require('express');
const fs = require('fs');
const path = require('path');

function normalizeNewsPayload(rawData) {
    return Array.isArray(rawData) ? rawData : (rawData.articles || []);
}

function readJsonFileSafe(filePath) {
    const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return normalizeNewsPayload(rawData);
}

function createNewsRouter({
    readData,
    writeData,
    generateId,
    archiveOldNews,
    authenticateToken,
    newsFile,
    settingsFile,
    dataDir,
    dailyArchiveDir
}) {
    const router = express.Router();

    // 新闻管理API
    router.get('/news', (req, res) => {
        const { category, country, limit, offset = 0 } = req.query;
        let news = readData(newsFile);

        // 兼容服务器每日落地文件：若 news.json 没有今日数据，回退读取当天日报文件
        const today = new Date().toISOString().split('T')[0];
        const hasTodayData = news.some(item => (item.created_at || '').startsWith(today));
        if (!hasTodayData) {
            const fileCandidates = [
                path.join(dataDir, `news-${today}.json`),
                path.join(dataDir, `${today}.json`)
            ];
            for (const filePath of fileCandidates) {
                if (fs.existsSync(filePath)) {
                    try {
                        news = readJsonFileSafe(filePath);
                        break;
                    } catch (error) {
                        console.error(`读取今日日报文件失败: ${filePath}`, error);
                    }
                }
            }
        }

        let displayLimit = limit;
        if (!displayLimit) {
            try {
                const settings = readData(settingsFile);
                displayLimit = settings.todayNewsDisplayCount || 20;
            } catch (error) {
                displayLimit = 20;
            }
        }

        if (category) {
            news = news.filter(n => n.category === category);
        }

        if (country) {
            const countryMap = {
                china: 'cn',
                global: 'global'
            };
            const mappedCountry = countryMap[country] || country;
            news = news.filter(n => n.country === mappedCountry);
        }

        news = news
            .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
            .slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(displayLimit, 10));

        res.json(news);
    });

    // 获取所有可用的历史日期
    router.get('/news/dates', (req, res) => {
        try {
            const datesMap = new Map();

            const currentNews = readData(newsFile);
            currentNews.forEach(article => {
                const date = article.created_at ? article.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
                if (!datesMap.has(date)) {
                    datesMap.set(date, { date, count: 0, source: 'current' });
                }
                datesMap.get(date).count++;
            });

            if (fs.existsSync(dailyArchiveDir)) {
                const archiveFiles = fs.readdirSync(dailyArchiveDir).filter(f => f.endsWith('.json') && f.startsWith('news-'));

                archiveFiles.forEach(file => {
                    const match = file.match(/news-(\d{4}-\d{2}-\d{2})\.json/);
                    if (!match) return;

                    const date = match[1];
                    try {
                        const filePath = path.join(dailyArchiveDir, file);
                        const archivedNews = readJsonFileSafe(filePath);
                        const count = archivedNews.length || 0;

                        if (!datesMap.has(date)) {
                            datesMap.set(date, { date, count, source: 'archive' });
                        } else {
                            datesMap.get(date).count += count;
                        }
                    } catch (error) {
                        console.error(`读取归档文件 ${file} 失败:`, error);
                    }
                });
            }

            if (fs.existsSync(dataDir)) {
                const dataFiles = fs.readdirSync(dataDir).filter(f => {
                    return (f.match(/^news-\d{4}-\d{2}-\d{2}\.json$/) || f.match(/^\d{4}-\d{2}-\d{2}\.json$/)) && f !== 'news.json';
                });

                dataFiles.forEach(file => {
                    const match = file.match(/(\d{4}-\d{2}-\d{2})\.json$/);
                    if (!match) return;

                    const date = match[1];
                    if (datesMap.has(date) && datesMap.get(date).source === 'archive') {
                        return;
                    }

                    try {
                        const filePath = path.join(dataDir, file);
                        const archivedNews = readJsonFileSafe(filePath);
                        const count = archivedNews.length || 0;

                        if (!datesMap.has(date)) {
                            datesMap.set(date, { date, count, source: 'data' });
                        } else {
                            datesMap.get(date).count += count;
                        }
                    } catch (error) {
                        console.error(`读取data目录文件 ${file} 失败:`, error);
                    }
                });
            }

            const datesArray = Array.from(datesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.json(datesArray);
        } catch (error) {
            console.error('获取历史日期失败:', error);
            res.status(500).json({ error: '获取历史日期失败' });
        }
    });

    // 根据日期获取历史新闻
    router.get('/news/date/:date', (req, res) => {
        const { date } = req.params;
        const { category, country } = req.query;

        try {
            let news = [];

            const archiveFile = path.join(dailyArchiveDir, `news-${date}.json`);
            if (fs.existsSync(archiveFile)) {
                news = readJsonFileSafe(archiveFile);
            } else {
                let dataFile = path.join(dataDir, `news-${date}.json`);
                if (!fs.existsSync(dataFile)) {
                    dataFile = path.join(dataDir, `${date}.json`);
                }

                if (fs.existsSync(dataFile)) {
                    news = readJsonFileSafe(dataFile);
                }
            }

            const currentNews = readData(newsFile);
            const currentDateArticles = currentNews.filter(article => {
                const articleDate = article.created_at ? article.created_at.split('T')[0] : '';
                return articleDate === date;
            });

            if (currentDateArticles.length > 0) {
                news = [...news, ...currentDateArticles];
            }

            if (category && category !== 'all') {
                news = news.filter(n => n.category === category);
            }

            if (country && country !== 'all') {
                news = news.filter(n => n.country === country);
            }

            news = news.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));

            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.json(news);
        } catch (error) {
            console.error('获取历史新闻失败:', error);
            res.status(500).json({ error: '获取历史新闻失败', details: error.message });
        }
    });

    router.post('/news', authenticateToken, (req, res) => {
        const {
            title, key_point, summary, source_url, source_name,
            category, sub_category, country, importance_score, published_at
        } = req.body;
        const news = readData(newsFile);

        const importTime = new Date().toISOString();
        const newNews = {
            id: generateId('daily'),
            title,
            key_point: key_point || '',
            summary,
            source_url: source_url || '#',
            source_name: source_name || '其他',
            category,
            sub_category: sub_category || '',
            country: country || 'global',
            importance_score: importance_score || 1,
            published_at,
            is_today: true,
            created_at: importTime
        };

        news.push(newNews);

        if (writeData(newsFile, news)) {
            res.json({ id: newNews.id, message: '新闻添加成功' });
        } else {
            res.status(500).json({ error: '添加新闻失败' });
        }
    });

    router.put('/news/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const { title, summary, source_name, category, country, importance_score, url, published_at } = req.body;
        const news = readData(newsFile);

        const index = news.findIndex(n => n.id == id);
        if (index === -1) {
            return res.status(404).json({ error: '新闻不存在' });
        }

        news[index] = {
            ...news[index],
            title,
            summary,
            source_name,
            category,
            country,
            importance_score,
            url,
            published_at,
            updated_at: new Date().toISOString()
        };

        if (writeData(newsFile, news)) {
            res.json({ message: '新闻更新成功' });
        } else {
            res.status(500).json({ error: '更新新闻失败' });
        }
    });

    router.delete('/news/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const news = readData(newsFile);

        const filteredNews = news.filter(n => n.id != id);

        if (writeData(newsFile, filteredNews)) {
            res.json({ message: '新闻删除成功' });
        } else {
            res.status(500).json({ error: '删除新闻失败' });
        }
    });

    router.post('/news/batch', authenticateToken, (req, res) => {
        const { articles } = req.body;

        if (!Array.isArray(articles)) {
            return res.status(400).json({ error: '新闻数据格式错误' });
        }

        try {
            const archiveResult = archiveOldNews();
            console.log('归档结果:', archiveResult);

            const importTime = new Date().toISOString();
            const newNews = articles.map(article => ({
                id: generateId('daily'),
                title: article.title || '无标题',
                key_point: article.key_point || '',
                summary: article.summary || '无摘要',
                source_url: article.source_url || article.url || '#',
                source_name: article.source_name || '其他',
                category: article.category || '未分类',
                sub_category: article.sub_category || '',
                country: article.country || 'global',
                importance_score: article.importance_score || 1,
                published_at: article.published_at || new Date().toISOString(),
                is_today: true,
                created_at: importTime
            }));

            if (writeData(newsFile, newNews)) {
                res.json({
                    message: `成功导入 ${articles.length} 篇新闻`,
                    archived: archiveResult.archived,
                    todayCount: newNews.length
                });
            } else {
                res.status(500).json({ error: '批量导入新闻失败' });
            }
        } catch (error) {
            console.error('批量导入新闻失败:', error);
            res.status(500).json({ error: '批量导入新闻失败' });
        }
    });

    return router;
}

module.exports = {
    createNewsRouter
};
