const express = require('express');

function isIsoDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createPodcastRouter({ podcastService }) {
    const router = express.Router();

    router.get('/podcast/news/:date', async (req, res) => {
        const { date } = req.params;

        if (!isIsoDate(date)) {
            return res.status(400).json({ error: 'invalid_date', message: 'date 必须是 YYYY-MM-DD 格式' });
        }

        try {
            const metadata = podcastService.getCurrentMetadata(date);
            return res.json(metadata);
        } catch (error) {
            console.error('获取播客元数据失败:', error);
            return res.status(500).json({
                error: 'podcast_metadata_failed',
                message: error.message
            });
        }
    });

    router.post('/podcast/news/:date/generate', async (req, res) => {
        const { date } = req.params;

        if (!isIsoDate(date)) {
            return res.status(400).json({ error: 'invalid_date', message: 'date 必须是 YYYY-MM-DD 格式' });
        }

        try {
            const metadata = await podcastService.generateNewsPodcast(date);
            const statusCode = metadata.status === 'ready' ? 200 : 202;
            return res.status(statusCode).json(metadata);
        } catch (error) {
            console.error('生成播客失败:', error);
            return res.status(500).json({
                error: 'podcast_generate_failed',
                message: error.message
            });
        }
    });

    return router;
}

module.exports = {
    createPodcastRouter
};
