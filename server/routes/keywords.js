const express = require('express');

function createKeywordsRouter({ readData, writeData, keywordsFile, authenticateToken, generateId }) {
    const router = express.Router();
    const KEYWORDS_CACHE_TTL_MS = 45000;
    let keywordsCache = { data: null, expiresAt: 0 };

    function readKeywordsWithCache() {
        const now = Date.now();
        if (keywordsCache.data && keywordsCache.expiresAt > now) {
            return keywordsCache.data;
        }

        const freshKeywords = readData(keywordsFile);
        keywordsCache = {
            data: freshKeywords,
            expiresAt: now + KEYWORDS_CACHE_TTL_MS
        };
        return freshKeywords;
    }

    function invalidateKeywordsCache() {
        keywordsCache = { data: null, expiresAt: 0 };
    }

    // 关键词管理API
    router.get('/keywords', (req, res) => {
        const keywords = readKeywordsWithCache();
        res.json(keywords);
    });

    router.post('/keywords', authenticateToken, (req, res) => {
        const { text, weight, size } = req.body;
        const keywords = readData(keywordsFile);

        const newKeyword = {
            id: Date.now(),
            text,
            weight: weight || 1,
            size: size || 'small',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        keywords.push(newKeyword);

        if (writeData(keywordsFile, keywords)) {
            invalidateKeywordsCache();
            res.json({ id: newKeyword.id, message: '关键词添加成功' });
        } else {
            res.status(500).json({ error: '添加关键词失败' });
        }
    });

    router.put('/keywords/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const { text, weight, size, fontSize } = req.body;
        const keywords = readData(keywordsFile);

        const index = keywords.findIndex(k => k.id == id);
        if (index === -1) {
            return res.status(404).json({ error: '关键词不存在' });
        }

        keywords[index] = {
            ...keywords[index],
            text,
            weight,
            size,
            fontSize,
            updated_at: new Date().toISOString()
        };

        if (writeData(keywordsFile, keywords)) {
            invalidateKeywordsCache();
            res.json({ message: '关键词更新成功' });
        } else {
            res.status(500).json({ error: '更新关键词失败' });
        }
    });

    router.delete('/keywords/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const keywords = readData(keywordsFile);

        const filteredKeywords = keywords.filter(k => k.id != id);

        if (writeData(keywordsFile, filteredKeywords)) {
            invalidateKeywordsCache();
            res.json({ message: '关键词删除成功' });
        } else {
            res.status(500).json({ error: '删除关键词失败' });
        }
    });

    // 批量导入关键词
    router.post('/keywords/batch', authenticateToken, (req, res) => {
        const { keywords } = req.body;

        if (!Array.isArray(keywords)) {
            return res.status(400).json({ error: '关键词数据格式错误' });
        }

        const existingKeywords = readData(keywordsFile);
        const newKeywords = keywords.map(keyword => ({
            id: generateId('daily'), // 关键词使用日格式
            text: keyword.text,
            weight: keyword.weight || 1,
            size: keyword.size || 'small',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        const allKeywords = [...existingKeywords, ...newKeywords];

        if (writeData(keywordsFile, allKeywords)) {
            invalidateKeywordsCache();
            res.json({ message: `成功导入 ${keywords.length} 个关键词` });
        } else {
            res.status(500).json({ error: '批量导入关键词失败' });
        }
    });

    return router;
}

module.exports = {
    createKeywordsRouter
};
