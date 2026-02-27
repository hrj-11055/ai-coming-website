const express = require('express');

function createMaintenanceRouter({ readData, writeData, keywordsFile, newsFile, authenticateToken }) {
    const router = express.Router();

    router.get('/backup', authenticateToken, (req, res) => {
        const keywords = readData(keywordsFile);
        const news = readData(newsFile);

        res.json({
            keywords,
            news,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });

    router.post('/restore', authenticateToken, (req, res) => {
        const { keywords, news } = req.body;

        if (keywords && Array.isArray(keywords)) {
            writeData(keywordsFile, keywords);
        }

        if (news && Array.isArray(news)) {
            writeData(newsFile, news);
        }

        res.json({ message: '数据恢复成功' });
    });

    return router;
}

module.exports = {
    createMaintenanceRouter
};
