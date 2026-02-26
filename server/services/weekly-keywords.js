const fs = require('fs');
const path = require('path');
const { isApiKeyConfigured } = require('./ai-proxy');

const DEFAULT_COUNT = 30;
const DEFAULT_RUN_HOUR = 8;
const DEFAULT_RUN_MINUTE = 0;
const SCHEDULER_INTERVAL_MS = 5 * 60 * 1000;

function toDateOnly(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getRecent7DayRange(now = new Date()) {
    const today = startOfDay(now);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() - 1);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 7);
    return {
        rangeStart,
        rangeEnd
    };
}

function getIsoWeekId(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function listDailyFilesForRange(baseDir, weekStart, weekEnd) {
    if (!baseDir || !fs.existsSync(baseDir)) return [];
    const files = fs.readdirSync(baseDir)
        .filter((file) => /^news-\d{4}-\d{2}-\d{2}\.json$/.test(file));

    return files.filter((file) => {
        const datePart = file.slice(5, 15);
        const date = toDateOnly(`${datePart}T00:00:00`);
        if (!date) return false;
        return date >= weekStart && date <= weekEnd;
    }).map((file) => path.join(baseDir, file));
}

function collectLastWeekArticles({ readData, newsFile, dailyArchiveDir, dataDir }, now = new Date()) {
    const { rangeStart, rangeEnd } = getRecent7DayRange(now);

    const dailyFiles = [
        ...listDailyFilesForRange(dailyArchiveDir, rangeStart, rangeEnd),
        ...listDailyFilesForRange(dataDir, rangeStart, rangeEnd)
    ];
    const uniqueDailyFiles = Array.from(new Set(dailyFiles));
    const titles = [];
    const titleSet = new Set();

    for (const filePath of uniqueDailyFiles) {
        const items = readData(filePath);
        if (!Array.isArray(items)) continue;
        for (const item of items) {
            const title = String(item && item.title ? item.title : '').trim();
            if (!title) continue;
            const key = title.toLowerCase();
            if (titleSet.has(key)) continue;
            titleSet.add(key);
            titles.push(title);
        }
    }

    return { rangeStart, rangeEnd, titles, sourceFiles: uniqueDailyFiles };
}

function stripCodeFence(text) {
    const trimmed = String(text || '').trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced ? fenced[1].trim() : trimmed;
}

function normalizeSize(weight) {
    if (weight >= 8) return 'large';
    if (weight >= 5) return 'medium';
    return 'small';
}

function validateKeywords(payload, expectedCount) {
    const arr = Array.isArray(payload) ? payload : payload && payload.keywords;
    if (!Array.isArray(arr)) return null;

    const cleaned = arr
        .map((item) => ({
            text: String(item.text || '').trim(),
            weight: Number(item.weight) || 1,
            size: String(item.size || '').trim().toLowerCase()
        }))
        .filter((item) => item.text.length > 0)
        .map((item) => ({
            ...item,
            weight: Math.max(1, Math.min(10, Math.round(item.weight))),
            size: ['large', 'medium', 'small'].includes(item.size) ? item.size : normalizeSize(item.weight)
        }));

    const uniq = [];
    const seen = new Set();
    for (const item of cleaned) {
        const key = item.text;
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(item);
        if (uniq.length >= expectedCount) break;
    }

    if (uniq.length !== expectedCount) {
        return null;
    }

    return uniq;
}

function buildPrompt(titles, keywordCount, rangeStart, rangeEnd) {
    const inputTitles = titles.slice(0, 180);

    return [
        '你是资深 AI 科技编辑。请根据给定新闻标题生成词云关键词。',
        `时间范围: ${toIsoDate(rangeStart)} 到 ${toIsoDate(rangeEnd)}（最近7天，不含今天）`,
        `固定输出 ${keywordCount} 个关键词，按热度排序，不能重复。`,
        '仅输出 JSON，不要解释，不要 markdown。',
        '格式必须是: {"keywords":[{"text":"词","weight":1-10,"size":"large|medium|small"}]}',
        '约束:',
        '- 关键词必须与 AI 领域直接相关（模型、芯片、Agent、开源、推理、数据、应用、投融资等）。',
        '- 禁止输出与 AI 无关的泛词（如娱乐八卦、体育、纯政治口号）。',
        '- text: 2-16 个字符，中文优先，可包含英文产品名。',
        '- weight: 1-10 的整数。',
        '- size 与 weight 一致: weight>=8 => large, 5-7 => medium, <=4 => small。',
        '',
        '新闻标题列表(JSON):',
        JSON.stringify(inputTitles)
    ].join('\n');
}

async function requestKeywordsFromModel({ aiConfig, systemPrompt, prompt, timeoutMs }) {
    const { apiKey, apiUrl, model } = aiConfig;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                stream: false,
                temperature: 0.2,
                max_tokens: 4000,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt || '你是一个严格输出JSON的助手。' },
                    { role: 'user', content: prompt }
                ]
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`Model API error ${response.status}: ${errorBody.slice(0, 300)}`);
        }

        const data = await response.json();
        const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (!content) {
            throw new Error('Model response missing choices[0].message.content');
        }

        return content;
    } finally {
        clearTimeout(timer);
    }
}

function materializeKeywords(items, now = new Date()) {
    const ts = now.toISOString();
    const base = Date.now();

    return items.map((item, index) => ({
        id: base + index,
        text: item.text,
        weight: item.weight,
        size: item.size,
        created_at: ts,
        updated_at: ts
    }));
}

function createWeeklyKeywordsJob({
    readData,
    writeData,
    keywordsFile,
    dailyArchiveDir,
    dataDir,
    aiConfig,
    systemPrompt,
    stateFile,
    logger = console,
    keywordCount = DEFAULT_COUNT,
    runHour = DEFAULT_RUN_HOUR,
    runMinute = DEFAULT_RUN_MINUTE,
    modelTimeoutMs = 25000
}) {
    const normalizedKeywordCount = Math.max(5, Math.min(80, Number(keywordCount) || DEFAULT_COUNT));
    const normalizedRunHour = Math.max(0, Math.min(23, Number(runHour) || DEFAULT_RUN_HOUR));
    const normalizedRunMinute = Math.max(0, Math.min(59, Number(runMinute) || DEFAULT_RUN_MINUTE));

    function readState() {
        return readData(stateFile) || {};
    }

    function writeState(nextState) {
        return writeData(stateFile, nextState);
    }

    function shouldRunNow(now = new Date()) {
        const weekday = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (weekday !== 1) return false;
        if (hour < normalizedRunHour) return false;
        if (hour === normalizedRunHour && minute < normalizedRunMinute) return false;

        const currentWeek = getIsoWeekId(now);
        const state = readState();
        return state.last_success_week !== currentWeek;
    }

    async function runOnce({ force = false } = {}) {
        const now = new Date();
        const currentWeek = getIsoWeekId(now);
        if (!force && !shouldRunNow(now)) {
            return { skipped: true, reason: 'not_due' };
        }

        if (!isApiKeyConfigured(aiConfig.apiKey)) {
            logger.warn('[weekly-keywords] 跳过：关键词模型 API_KEY 未配置');
            return { skipped: true, reason: 'api_key_missing' };
        }

        const { rangeStart, rangeEnd, titles, sourceFiles } = collectLastWeekArticles({
            readData,
            dailyArchiveDir,
            dataDir
        }, now);

        if (!titles.length) {
            logger.warn('[weekly-keywords] 跳过：最近7天日报无可用标题，不更新关键词');
            writeState({
                last_attempt_at: now.toISOString(),
                last_attempt_week: currentWeek,
                last_error: 'no_titles',
                last_success_week: readState().last_success_week || null
            });
            return { skipped: true, reason: 'no_titles' };
        }

        const prompt = buildPrompt(titles, normalizedKeywordCount, rangeStart, rangeEnd);
        const rawContent = await requestKeywordsFromModel({
            aiConfig,
            systemPrompt,
            prompt,
            timeoutMs: modelTimeoutMs
        });

        let parsed;
        try {
            parsed = JSON.parse(stripCodeFence(rawContent));
        } catch (error) {
            throw new Error(`关键词 JSON 解析失败: ${error.message}`);
        }

        const normalized = validateKeywords(parsed, normalizedKeywordCount);
        if (!normalized) {
            throw new Error(`关键词格式非法或数量不等于 ${normalizedKeywordCount}`);
        }

        const materialized = materializeKeywords(normalized, now);
        const ok = writeData(keywordsFile, materialized);
        if (!ok) {
            throw new Error('写入关键词文件失败');
        }

        writeState({
            last_attempt_at: now.toISOString(),
            last_attempt_week: currentWeek,
            last_success_at: now.toISOString(),
            last_success_week: currentWeek,
            source_range_start: toIsoDate(rangeStart),
            source_range_end: toIsoDate(rangeEnd),
            source_file_count: sourceFiles.length,
            source_title_count: titles.length,
            keyword_count: materialized.length,
            model: aiConfig.model,
            last_error: null
        });

        logger.log(`[weekly-keywords] 更新成功：${materialized.length} 个关键词，来源标题 ${titles.length} 条，文件 ${sourceFiles.length} 个，区间 ${toIsoDate(rangeStart)}~${toIsoDate(rangeEnd)}`);
        return {
            updated: true,
            keywordCount: materialized.length,
            titleCount: titles.length,
            fileCount: sourceFiles.length,
            rangeStart: toIsoDate(rangeStart),
            rangeEnd: toIsoDate(rangeEnd)
        };
    }

    function startScheduler() {
        const timer = setInterval(() => {
            runOnce().catch((error) => {
                const now = new Date();
                const currentWeek = getIsoWeekId(now);
                logger.error('[weekly-keywords] 定时任务执行失败:', error.message);
                writeState({
                    ...readState(),
                    last_attempt_at: now.toISOString(),
                    last_attempt_week: currentWeek,
                    last_error: error.message
                });
            });
        }, SCHEDULER_INTERVAL_MS);

        return {
            stop() {
                clearInterval(timer);
            }
        };
    }

    return {
        runOnce,
        startScheduler,
        shouldRunNow
    };
}

module.exports = {
    createWeeklyKeywordsJob,
    getRecent7DayRange,
    getIsoWeekId
};
