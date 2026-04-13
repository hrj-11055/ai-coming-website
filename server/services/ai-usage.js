const crypto = require('crypto');

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_TIMEZONE = 'Asia/Shanghai';
const DEFAULT_SOURCE = 'homepage';

function toFiniteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function toNonNegativeInteger(value, fallback = 0) {
    const number = Math.floor(toFiniteNumber(value, fallback));
    return number >= 0 ? number : fallback;
}

function toNonNegativeMoney(value, fallback = 0) {
    const number = toFiniteNumber(value, fallback);
    return number >= 0 ? number : fallback;
}

function roundCost(value) {
    return Math.round(toNonNegativeMoney(value) * 100000000) / 100000000;
}

function createAiUsageConfigFromEnv(env = {}, aiConfig = {}) {
    return {
        model: aiConfig.model || env.QWEN_MODEL || env.DASHSCOPE_MODEL || 'qwen3.5-plus',
        currency: env.AI_USAGE_CURRENCY || DEFAULT_CURRENCY,
        timeZone: env.AI_USAGE_TIMEZONE || DEFAULT_TIMEZONE,
        source: env.AI_USAGE_SOURCE || DEFAULT_SOURCE,
        inputPricePerMillionTokens: toNonNegativeMoney(env.AI_INPUT_PRICE_PER_MILLION_TOKENS),
        outputPricePerMillionTokens: toNonNegativeMoney(env.AI_OUTPUT_PRICE_PER_MILLION_TOKENS)
    };
}

function formatDateInTimeZone(timestamp, timeZone = DEFAULT_TIMEZONE) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date(timestamp));

    const byType = parts.reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    return `${byType.year}-${byType.month}-${byType.day}`;
}

function normalizeUsage(usage = {}) {
    const promptTokens = toNonNegativeInteger(
        usage.prompt_tokens ?? usage.promptTokens ?? usage.input_tokens ?? usage.inputTokens
    );
    const completionTokens = toNonNegativeInteger(
        usage.completion_tokens ?? usage.completionTokens ?? usage.output_tokens ?? usage.outputTokens
    );
    const providedTotal = toNonNegativeInteger(usage.total_tokens ?? usage.totalTokens, NaN);
    const totalTokens = Number.isFinite(providedTotal) ? providedTotal : promptTokens + completionTokens;

    return {
        promptTokens,
        completionTokens,
        totalTokens
    };
}

function calculateUsageCost(usage, config = {}) {
    const normalized = normalizeUsage(usage);
    const inputCost = normalized.promptTokens / 1000000 * toNonNegativeMoney(config.inputPricePerMillionTokens);
    const outputCost = normalized.completionTokens / 1000000 * toNonNegativeMoney(config.outputPricePerMillionTokens);

    return {
        inputCost: roundCost(inputCost),
        outputCost: roundCost(outputCost),
        totalCost: roundCost(inputCost + outputCost)
    };
}

function isValidDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function createUsageId(timestamp) {
    return `usage_${timestamp}_${crypto.randomBytes(4).toString('hex')}`;
}

function hashIp(ip, salt) {
    if (!ip || ip === 'unknown') return null;
    const hash = crypto
        .createHash('sha256')
        .update(`${salt}:${ip}`)
        .digest('hex');
    return `sha256:${hash}`;
}

function getClientIP(req) {
    return req.ip ||
        req.connection?.remoteAddress ||
        req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers?.['x-real-ip'] ||
        'unknown';
}

function sanitizeError(error) {
    if (!error) return null;
    const message = typeof error === 'string' ? error : error.message;
    if (!message) return null;
    return message.substring(0, 300);
}

function sanitizeStatus(status) {
    return status === 'success' ? 'success' : 'error';
}

function filterLogsByDate(logs, { from, to } = {}) {
    return logs.filter((log) => {
        if (!log || !isValidDateKey(log.date)) return false;
        if (isValidDateKey(from) && log.date < from) return false;
        if (isValidDateKey(to) && log.date > to) return false;
        return true;
    });
}

function aggregateLogs(logs) {
    const totals = logs.reduce((acc, log) => {
        const status = sanitizeStatus(log.status);
        acc.requestCount += 1;
        if (status === 'success') {
            acc.successCount += 1;
        } else {
            acc.errorCount += 1;
        }

        acc.promptTokens += toNonNegativeInteger(log.promptTokens);
        acc.completionTokens += toNonNegativeInteger(log.completionTokens);
        acc.totalTokens += toNonNegativeInteger(log.totalTokens);
        acc.inputCost += toNonNegativeMoney(log.inputCost);
        acc.outputCost += toNonNegativeMoney(log.outputCost);
        acc.totalCost += toNonNegativeMoney(log.totalCost);

        const latencyMs = toFiniteNumber(log.latencyMs, NaN);
        if (Number.isFinite(latencyMs) && latencyMs >= 0) {
            acc.latencyTotal += latencyMs;
            acc.latencyCount += 1;
        }

        return acc;
    }, {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        latencyTotal: 0,
        latencyCount: 0
    });

    const averageLatencyMs = totals.latencyCount > 0
        ? Math.round(totals.latencyTotal / totals.latencyCount)
        : 0;

    return {
        requestCount: totals.requestCount,
        successCount: totals.successCount,
        errorCount: totals.errorCount,
        promptTokens: totals.promptTokens,
        completionTokens: totals.completionTokens,
        totalTokens: totals.totalTokens,
        inputCost: roundCost(totals.inputCost),
        outputCost: roundCost(totals.outputCost),
        totalCost: roundCost(totals.totalCost),
        averageLatencyMs
    };
}

function shiftDateKey(baseTimestamp, days, timeZone = DEFAULT_TIMEZONE) {
    return formatDateInTimeZone(baseTimestamp + days * 86400000, timeZone);
}

function createAiUsageService({
    readData,
    writeData,
    usageFile,
    config = {},
    ipHashSalt = 'ai-coming',
    now = Date.now
}) {
    const usageConfig = {
        currency: DEFAULT_CURRENCY,
        timeZone: DEFAULT_TIMEZONE,
        source: DEFAULT_SOURCE,
        inputPricePerMillionTokens: 0,
        outputPricePerMillionTokens: 0,
        ...config
    };

    function readLogs() {
        const logs = readData(usageFile);
        return Array.isArray(logs) ? logs : [];
    }

    function writeLogs(logs) {
        return writeData(usageFile, logs);
    }

    function recordUsage(entry = {}) {
        const timestamp = toNonNegativeInteger(entry.timestamp, now());
        const normalizedUsage = normalizeUsage(entry.usage || entry);
        const cost = calculateUsageCost(normalizedUsage, usageConfig);
        const ip = entry.ip || (entry.req ? getClientIP(entry.req) : null);
        const status = sanitizeStatus(entry.status);
        const record = {
            id: entry.id || createUsageId(timestamp),
            timestamp,
            date: entry.date && isValidDateKey(entry.date)
                ? entry.date
                : formatDateInTimeZone(timestamp, usageConfig.timeZone),
            source: entry.source || usageConfig.source,
            model: entry.model || usageConfig.model,
            status,
            stream: Boolean(entry.stream),
            ipHash: hashIp(ip, ipHashSalt),
            requestChars: toNonNegativeInteger(entry.requestChars),
            promptTokens: normalizedUsage.promptTokens,
            completionTokens: normalizedUsage.completionTokens,
            totalTokens: normalizedUsage.totalTokens,
            inputCost: cost.inputCost,
            outputCost: cost.outputCost,
            totalCost: cost.totalCost,
            currency: usageConfig.currency,
            latencyMs: toNonNegativeInteger(entry.latencyMs),
            usageMissing: normalizedUsage.totalTokens === 0,
            error: sanitizeError(entry.error)
        };

        const logs = readLogs();
        logs.push(record);
        writeLogs(logs);

        return record;
    }

    function getSummary({ from, to } = {}) {
        const logs = readLogs();
        const timestamp = now();
        const today = formatDateInTimeZone(timestamp, usageConfig.timeZone);
        const last7Start = shiftDateKey(timestamp, -6, usageConfig.timeZone);
        const last30Start = shiftDateKey(timestamp, -29, usageConfig.timeZone);

        return {
            generatedAt: new Date(timestamp).toISOString(),
            model: usageConfig.model,
            currency: usageConfig.currency,
            pricing: {
                inputPricePerMillionTokens: usageConfig.inputPricePerMillionTokens,
                outputPricePerMillionTokens: usageConfig.outputPricePerMillionTokens
            },
            today: aggregateLogs(filterLogsByDate(logs, { from: today, to: today })),
            last7Days: aggregateLogs(filterLogsByDate(logs, { from: last7Start, to: today })),
            last30Days: aggregateLogs(filterLogsByDate(logs, { from: last30Start, to: today })),
            allTime: aggregateLogs(logs),
            range: aggregateLogs(filterLogsByDate(logs, { from, to }))
        };
    }

    function getDailyUsage({ from, to } = {}) {
        const groups = new Map();

        filterLogsByDate(readLogs(), { from, to }).forEach((log) => {
            if (!groups.has(log.date)) {
                groups.set(log.date, []);
            }
            groups.get(log.date).push(log);
        });

        return Array.from(groups.entries())
            .map(([date, dateLogs]) => ({
                date,
                ...aggregateLogs(dateLogs)
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    function getRecentUsage(limit = 100) {
        const safeLimit = Math.min(Math.max(toNonNegativeInteger(limit, 100), 1), 500);
        return readLogs()
            .slice()
            .sort((a, b) => toNonNegativeInteger(b.timestamp) - toNonNegativeInteger(a.timestamp))
            .slice(0, safeLimit);
    }

    return {
        config: usageConfig,
        recordUsage,
        getSummary,
        getDailyUsage,
        getRecentUsage
    };
}

module.exports = {
    createAiUsageConfigFromEnv,
    createAiUsageService,
    normalizeUsage,
    calculateUsageCost,
    aggregateLogs,
    formatDateInTimeZone
};
