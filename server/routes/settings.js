const express = require('express');

function createSettingsRouter({ readData, writeData, settingsFile, authenticateToken }) {
    const router = express.Router();

    // 设置管理API
    router.get('/settings', (req, res) => {
        try {
            const settings = readData(settingsFile);
            res.json(settings);
        } catch (error) {
            console.error('读取设置失败:', error);
            res.status(500).json({ error: '读取设置失败' });
        }
    });

    router.post('/settings', authenticateToken, (req, res) => {
        try {
            const { todayNewsDisplayCount } = req.body;

            if (todayNewsDisplayCount && (todayNewsDisplayCount < 1 || todayNewsDisplayCount > 50)) {
                return res.status(400).json({ error: '显示数量必须在1-50之间' });
            }

            const settings = readData(settingsFile);
            const updatedSettings = {
                ...settings,
                ...req.body,
                lastUpdated: new Date().toISOString()
            };

            if (writeData(settingsFile, updatedSettings)) {
                res.json({ message: '设置更新成功', settings: updatedSettings });
            } else {
                res.status(500).json({ error: '设置更新失败' });
            }
        } catch (error) {
            console.error('更新设置失败:', error);
            res.status(500).json({ error: '更新设置失败' });
        }
    });

    return router;
}

module.exports = {
    createSettingsRouter
};
