const express = require('express');
const fs = require('fs');

function createArchiveRouter({
    readData,
    authenticateToken,
    normalizeEnumParam,
    getArchiveDirByType,
    resolveSafeArchiveFile
}) {
    const router = express.Router();

    router.get('/archive/dates', authenticateToken, (req, res) => {
        try {
            const requestedType = normalizeEnumParam(req.query.type, ['daily'], 'daily');
            if (req.query.type && req.query.type !== requestedType) {
                return res.status(400).json({ error: '无效的归档类型，必须是 daily' });
            }

            const archiveDir = getArchiveDirByType(requestedType);
            if (!fs.existsSync(archiveDir)) {
                return res.json({ dates: [] });
            }

            const files = fs.readdirSync(archiveDir);
            const dates = files
                .filter((file) => file.endsWith('.json'))
                .map((file) => file.replace('.json', ''))
                .sort()
                .reverse();

            return res.json({ dates, type: requestedType });
        } catch (error) {
            console.error('获取历史日期失败:', error);
            return res.status(500).json({ error: '获取历史日期失败' });
        }
    });

    router.get('/archive/:date', authenticateToken, (req, res) => {
        try {
            const { date } = req.params;
            const requestedType = normalizeEnumParam(req.query.type, ['daily'], 'daily');
            if (req.query.type && req.query.type !== requestedType) {
                return res.status(400).json({ error: '无效的归档类型，必须是 daily' });
            }

            const archiveDir = getArchiveDirByType(requestedType);
            const archiveFile = resolveSafeArchiveFile(archiveDir, date);
            if (!archiveFile) {
                return res.status(400).json({ error: '无效的归档日期参数' });
            }

            if (!fs.existsSync(archiveFile)) {
                return res.status(404).json({ error: '该日期的数据不存在' });
            }

            const news = readData(archiveFile);
            return res.json(news);
        } catch (error) {
            console.error('获取历史数据失败:', error);
            return res.status(500).json({ error: '获取历史数据失败' });
        }
    });

    router.delete('/archive/:date', authenticateToken, (req, res) => {
        try {
            const { date } = req.params;
            const requestedType = normalizeEnumParam(req.query.type, ['daily'], 'daily');
            if (req.query.type && req.query.type !== requestedType) {
                return res.status(400).json({ error: '无效的归档类型，必须是 daily' });
            }

            const archiveDir = getArchiveDirByType(requestedType);
            const archiveFile = resolveSafeArchiveFile(archiveDir, date);
            if (!archiveFile) {
                return res.status(400).json({ error: '无效的归档日期参数' });
            }

            if (!fs.existsSync(archiveFile)) {
                return res.status(404).json({ error: '该日期的数据不存在' });
            }

            fs.unlinkSync(archiveFile);
            return res.json({ message: `已删除 ${date} 的每日历史数据` });
        } catch (error) {
            console.error('删除历史数据失败:', error);
            return res.status(500).json({ error: '删除历史数据失败' });
        }
    });

    return router;
}

module.exports = {
    createArchiveRouter
};
