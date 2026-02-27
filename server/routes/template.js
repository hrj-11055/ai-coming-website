const express = require('express');

function createTemplateRouter() {
    const router = express.Router();

    router.get('/news/template', (req, res) => {
        try {
            const template = {
                _说明: '今日资讯JSON模板 - 用于批量导入每日新闻数据',
                _字段说明: {
                    title: '新闻标题（必填）',
                    key_point: '关键要点，最多30个字符（必填）',
                    summary: '新闻摘要内容（必填）',
                    source_url: '原始文章链接（必填）',
                    source_name: '来源渠道：RSS、网页、公众号、Twitter、其他（必填）',
                    category: '主分类：技术、商业、政策、产品、人物等（必填）',
                    sub_category: '子分类，如：人工智能、投资、法规等（可选）',
                    country: '地区：china（中国）、global（全球）（必填）',
                    importance_score: '重要程度：1-10，数字越大越重要（必填）',
                    published_at: '发布时间，ISO 8601格式（必填）'
                },
                _示例数据: {
                    title: 'OpenAI发布GPT-5模型，性能提升显著',
                    key_point: 'GPT-5性能提升50%，支持多模态',
                    summary: 'OpenAI今日正式发布GPT-5大语言模型，相比GPT-4在推理能力、代码生成和创意写作方面有显著提升。新模型支持文本、图像、音频的多模态输入，预计将在未来几周内向ChatGPT Plus用户开放。',
                    source_url: 'https://openai.com/blog/gpt-5-announcement',
                    source_name: 'RSS',
                    category: '技术',
                    sub_category: '人工智能',
                    country: 'global',
                    importance_score: 8,
                    published_at: '2025-01-15T09:00:00.000Z'
                }
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="daily-news-template.json"');
            return res.json(template);
        } catch (error) {
            console.error('导出今日资讯模板失败:', error);
            return res.status(500).json({ error: '导出模板失败' });
        }
    });

    return router;
}

module.exports = {
    createTemplateRouter
};
