const express = require('express');

function isIsoDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createPodcastRouter({ podcastService }) {
    const router = express.Router();

    router.get('/podcast/minimax/tasks/:taskId', async (req, res) => {
        const { taskId } = req.params;
        const normalizedTaskId = String(taskId || '').trim();

        if (!normalizedTaskId) {
            return res.status(400).json({ error: 'invalid_task_id', message: 'task_id 不能为空' });
        }

        try {
            const status = await podcastService.queryMinimaxTaskStatus(normalizedTaskId);
            return res.json(status);
        } catch (error) {
            console.error('查询 MiniMax 语音任务失败:', error);
            const message = error.message || '查询 MiniMax 语音任务失败';
            const statusCode = /尚未配置完成|缺少 task_id/.test(message) ? 400 : 500;
            return res.status(statusCode).json({
                error: 'podcast_minimax_task_query_failed',
                message
            });
        }
    });

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

    router.get('/podcast/news/:date/audio', async (req, res) => {
        const { date } = req.params;

        if (!isIsoDate(date)) {
            return res.status(400).json({ error: 'invalid_date', message: 'date 必须是 YYYY-MM-DD 格式' });
        }

        try {
            const audioRecord = podcastService.getAudioFileForDate(date);
            if (!audioRecord) {
                return res.status(404).json({
                    error: 'podcast_audio_not_found',
                    message: '未找到可播放的本地播客音频'
                });
            }

            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.type(audioRecord.mimeType || 'audio/mpeg');
            return res.sendFile(audioRecord.filePath);
        } catch (error) {
            console.error('获取播客音频失败:', error);
            return res.status(500).json({
                error: 'podcast_audio_failed',
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
