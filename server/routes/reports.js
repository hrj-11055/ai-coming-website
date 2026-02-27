const express = require('express');
const fs = require('fs');
const path = require('path');

function createReportsRouter({ rootDir }) {
    const router = express.Router();

    router.get('/reports', (req, res) => {
        try {
            const reportsDir = path.join(rootDir, 'reports-archive');
            const reports = [];

            if (fs.existsSync(reportsDir)) {
                const files = fs.readdirSync(reportsDir)
                    .filter((file) => file.endsWith('.html'))
                    .sort((a, b) => b.localeCompare(a));

                files.forEach((file) => {
                    const filePath = path.join(reportsDir, file);
                    const stats = fs.statSync(filePath);
                    const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
                    const date = dateMatch ? dateMatch[1] : '未知日期';

                    reports.push({
                        filename: file,
                        title: `AI日报 - ${date}`,
                        date,
                        size: stats.size,
                        created_at: stats.mtime.toISOString()
                    });
                });
            }

            return res.json(reports);
        } catch (error) {
            console.error('获取日报列表失败:', error);
            return res.status(500).json({ error: '获取日报列表失败' });
        }
    });

    router.get('/reports/:filename', (req, res) => {
        try {
            const filename = req.params.filename;
            const filePath = path.join(rootDir, 'reports-archive', filename);

            if (!filename.endsWith('.html') || filename.includes('..')) {
                return res.status(400).json({ error: '无效的文件名' });
            }

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: '日报文件不存在' });
            }

            const html = fs.readFileSync(filePath, 'utf-8');
            return res.send(html);
        } catch (error) {
            console.error('读取日报失败:', error);
            return res.status(500).json({ error: '读取日报失败' });
        }
    });

    return router;
}

module.exports = {
    createReportsRouter
};
