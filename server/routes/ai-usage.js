const express = require('express');

function createAiUsageRouter({ aiUsageService, authenticateToken }) {
    const router = express.Router();

    router.get('/ai-usage/summary', authenticateToken, (req, res) => {
        try {
            const { from, to } = req.query || {};
            res.json(aiUsageService.getSummary({ from, to }));
        } catch (error) {
            console.error('获取AI用量摘要失败:', error);
            res.status(500).json({ error: '获取AI用量摘要失败' });
        }
    });

    router.get('/ai-usage/daily', authenticateToken, (req, res) => {
        try {
            const { from, to } = req.query || {};
            res.json({
                daily: aiUsageService.getDailyUsage({ from, to }),
                currency: aiUsageService.config.currency,
                model: aiUsageService.config.model
            });
        } catch (error) {
            console.error('获取AI每日用量失败:', error);
            res.status(500).json({ error: '获取AI每日用量失败' });
        }
    });

    router.get('/ai-usage/recent', authenticateToken, (req, res) => {
        try {
            res.json({
                records: aiUsageService.getRecentUsage(req.query?.limit),
                currency: aiUsageService.config.currency,
                model: aiUsageService.config.model
            });
        } catch (error) {
            console.error('获取AI最近用量失败:', error);
            res.status(500).json({ error: '获取AI最近用量失败' });
        }
    });

    return router;
}

module.exports = {
    createAiUsageRouter
};
