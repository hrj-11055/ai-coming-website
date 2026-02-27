const express = require('express');

function createStatsRouter({ readData, keywordsFile, newsFile }) {
    const router = express.Router();

    router.get('/stats', (req, res) => {
        const keywords = readData(keywordsFile);
        const news = readData(newsFile);

        const stats = {
            keywords: keywords.length,
            news: news.length,
            dailyNews: news.length,
            highImportanceNews: news.filter((n) => (n.importance_score || 0) >= 8).length
        };

        res.json(stats);
    });

    return router;
}

module.exports = {
    createStatsRouter
};
