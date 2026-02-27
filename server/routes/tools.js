const express = require('express');
const { parseIntParam, normalizeEnumParam } = require('../utils/validation');

const TOOL_SORT_OPTIONS = ['rating', 'name', 'newest'];

function generateSlug(name) {
    return String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function createToolId() {
    return `tool_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createToolsRouter({
    readData,
    writeData,
    toolsFile,
    toolCategoriesFile,
    authenticateToken
}) {
    const router = express.Router();

    router.get('/tools', (req, res) => {
        try {
            const {
                category,
                subcategory,
                region,
                price,
                search
            } = req.query;

            const page = parseIntParam(req.query.page, { defaultValue: 1, min: 1, max: 100000 });
            const limit = parseIntParam(req.query.limit, { defaultValue: 12, min: 1, max: 100 });
            const sort = normalizeEnumParam(req.query.sort, TOOL_SORT_OPTIONS, 'rating');

            let tools = readData(toolsFile);

            if (category && category !== 'all') {
                if (subcategory) {
                    tools = tools.filter((tool) =>
                        tool.categories.includes(category) &&
                        tool.subcategories.includes(subcategory)
                    );
                } else {
                    tools = tools.filter((tool) => tool.categories.includes(category));
                }
            }

            if (region && region !== 'all') {
                if (region === '双支持') {
                    tools = tools.filter((tool) => tool.region_support && tool.region_support.length > 1);
                } else {
                    tools = tools.filter((tool) =>
                        tool.region === region ||
                        (tool.region_support && tool.region_support.includes(region))
                    );
                }
            }

            if (price && price !== 'all') {
                tools = tools.filter((tool) => String(tool.price || '').includes(price));
            }

            if (typeof search === 'string' && search.trim()) {
                const searchTerm = search.trim().toLowerCase();
                tools = tools.filter((tool) =>
                    String(tool.name || '').toLowerCase().includes(searchTerm) ||
                    String(tool.description || '').toLowerCase().includes(searchTerm) ||
                    (Array.isArray(tool.tags) && tool.tags.some((tag) => String(tag).toLowerCase().includes(searchTerm)))
                );
            }

            tools.sort((a, b) => {
                switch (sort) {
                case 'name':
                    return String(a.name || '').localeCompare(String(b.name || ''));
                case 'newest':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case 'rating':
                default:
                    return (b.rating || 0) - (a.rating || 0);
                }
            });

            const startIndex = (page - 1) * limit;
            const paginatedTools = tools.slice(startIndex, startIndex + limit);

            res.json({
                tools: paginatedTools,
                total: tools.length,
                page,
                limit,
                totalPages: Math.ceil(tools.length / limit)
            });
        } catch (error) {
            console.error('获取工具列表失败:', error);
            res.status(500).json({ error: '获取工具列表失败' });
        }
    });

    router.get('/tools/categories', (_req, res) => {
        try {
            const categories = readData(toolCategoriesFile);
            res.json(categories);
        } catch (error) {
            console.error('获取工具分类失败:', error);
            res.status(500).json({ error: '获取工具分类失败' });
        }
    });

    router.get('/tools/:id', (req, res) => {
        try {
            const { id } = req.params;
            const tools = readData(toolsFile);
            const tool = tools.find((item) => item.id === id);

            if (!tool) {
                return res.status(404).json({ error: '工具不存在' });
            }

            return res.json(tool);
        } catch (error) {
            console.error('获取工具详情失败:', error);
            return res.status(500).json({ error: '获取工具详情失败' });
        }
    });

    router.post('/tools', authenticateToken, (req, res) => {
        try {
            const { name, description, categories, subcategories, region, region_support, language, price, website, tags } = req.body;

            if (!name || !description || !website) {
                return res.status(400).json({ error: '缺少必填字段' });
            }

            const tools = readData(toolsFile);
            const slug = generateSlug(name);
            const now = new Date().toISOString();
            const newTool = {
                id: createToolId(),
                name,
                slug,
                description,
                categories: categories || [],
                subcategories: subcategories || [],
                region: region || '国际',
                region_support: region_support || [region || '国际'],
                language: language || ['英文'],
                price: price || '免费',
                rating: 0,
                website,
                logo: `${slug}.png`,
                tags: tags || [],
                featured: false,
                created_at: now,
                updated_at: now
            };

            tools.push(newTool);

            if (writeData(toolsFile, tools)) {
                return res.json({ message: '工具添加成功', tool: newTool });
            }
            return res.status(500).json({ error: '添加工具失败' });
        } catch (error) {
            console.error('添加工具失败:', error);
            return res.status(500).json({ error: '添加工具失败' });
        }
    });

    router.put('/tools/:id', authenticateToken, (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const tools = readData(toolsFile);

            const index = tools.findIndex((tool) => tool.id === id);
            if (index === -1) {
                return res.status(404).json({ error: '工具不存在' });
            }

            tools[index] = {
                ...tools[index],
                ...updateData,
                updated_at: new Date().toISOString()
            };

            if (writeData(toolsFile, tools)) {
                return res.json({ message: '工具更新成功', tool: tools[index] });
            }
            return res.status(500).json({ error: '更新工具失败' });
        } catch (error) {
            console.error('更新工具失败:', error);
            return res.status(500).json({ error: '更新工具失败' });
        }
    });

    router.delete('/tools/:id', authenticateToken, (req, res) => {
        try {
            const { id } = req.params;
            const tools = readData(toolsFile);

            const index = tools.findIndex((tool) => tool.id === id);
            if (index === -1) {
                return res.status(404).json({ error: '工具不存在' });
            }

            tools.splice(index, 1);

            if (writeData(toolsFile, tools)) {
                return res.json({ message: '工具删除成功' });
            }
            return res.status(500).json({ error: '删除工具失败' });
        } catch (error) {
            console.error('删除工具失败:', error);
            return res.status(500).json({ error: '删除工具失败' });
        }
    });

    router.post('/tools/batch', authenticateToken, (req, res) => {
        try {
            const { tools: newTools } = req.body;

            if (!Array.isArray(newTools)) {
                return res.status(400).json({ error: '数据格式错误' });
            }

            const existingTools = readData(toolsFile);
            const now = new Date().toISOString();
            const processedTools = newTools.map((tool) => {
                const name = tool.name || '未命名工具';
                const slug = tool.slug || generateSlug(name);
                return {
                    id: tool.id || createToolId(),
                    name,
                    slug,
                    description: tool.description || '',
                    categories: tool.categories || [],
                    subcategories: tool.subcategories || [],
                    region: tool.region || '国际',
                    region_support: tool.region_support || [tool.region || '国际'],
                    language: tool.language || ['英文'],
                    price: tool.price || '免费',
                    rating: tool.rating || 0,
                    website: tool.website || '',
                    logo: tool.logo || `${slug}.png`,
                    tags: tool.tags || [],
                    featured: tool.featured || false,
                    created_at: tool.created_at || now,
                    updated_at: now
                };
            });

            const updatedTools = [...existingTools, ...processedTools];

            if (writeData(toolsFile, updatedTools)) {
                return res.json({
                    message: `成功导入 ${processedTools.length} 个工具`,
                    count: processedTools.length
                });
            }
            return res.status(500).json({ error: '批量导入失败' });
        } catch (error) {
            console.error('批量导入工具失败:', error);
            return res.status(500).json({ error: '批量导入工具失败' });
        }
    });

    router.post('/tools/upload-logo', authenticateToken, (_req, res) => {
        res.json({ message: 'Logo上传功能待实现' });
    });

    return router;
}

module.exports = {
    createToolsRouter
};
