const express = require('express');
const { parseIntParam } = require('../utils/validation');

const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_:-]{1,60}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeText(value, maxLength = 120) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function getClientIp(req) {
    return String(
        req.headers['x-forwarded-for']?.split(',')[0]
        || req.headers['x-real-ip']
        || req.ip
        || req.connection?.remoteAddress
        || 'unknown'
    ).trim();
}

function toDateKey(now, timeZone) {
    const date = typeof now === 'function' ? now() : new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
}

function isValidDateKey(value) {
    return DATE_PATTERN.test(String(value || ''));
}

function normalizeDateRange(query, today) {
    const from = isValidDateKey(query.from) ? query.from : today;
    const to = isValidDateKey(query.to) ? query.to : from;
    return { from, to };
}

function summarizeEvents(events, { from, to }) {
    const grouped = new Map();

    events
        .filter((event) => event.date >= from && event.date <= to)
        .forEach((event) => {
            const key = `${event.date}\u0000${event.eventType}\u0000${event.eventLabel || ''}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    date: event.date,
                    eventType: event.eventType,
                    eventLabel: event.eventLabel || '',
                    target: event.target || '',
                    clicks: 0,
                    uniqueVisitors: 0,
                    lastOccurredAt: event.createdAt,
                    visitorSet: new Set()
                });
            }

            const item = grouped.get(key);
            item.clicks += 1;
            item.visitorSet.add(event.ip || 'unknown');
            if (new Date(event.createdAt) > new Date(item.lastOccurredAt)) {
                item.lastOccurredAt = event.createdAt;
            }
        });

    return Array.from(grouped.values())
        .map((item) => ({
            date: item.date,
            eventType: item.eventType,
            eventLabel: item.eventLabel,
            target: item.target,
            clicks: item.clicks,
            uniqueVisitors: item.visitorSet.size,
            lastOccurredAt: item.lastOccurredAt
        }))
        .sort((left, right) => {
            if (left.date !== right.date) return right.date.localeCompare(left.date);
            if (left.clicks !== right.clicks) return right.clicks - left.clicks;
            return left.eventType.localeCompare(right.eventType);
        });
}

function createInteractionRouter({
    readData,
    writeData,
    interactionEventsFile,
    authenticateToken,
    now = () => new Date(),
    timeZone = 'Asia/Shanghai'
}) {
    const router = express.Router();

    router.post('/interaction/track', (req, res) => {
        try {
            const eventType = sanitizeText(req.body?.eventType, 64);
            if (!EVENT_TYPE_PATTERN.test(eventType)) {
                return res.status(400).json({ error: 'invalid_event_type' });
            }

            const createdAtDate = typeof now === 'function' ? now() : new Date();
            const createdAt = createdAtDate.toISOString();
            const logs = readData(interactionEventsFile, []);
            const event = {
                id: Date.now(),
                date: toDateKey(createdAtDate, timeZone),
                createdAt,
                eventType,
                eventLabel: sanitizeText(req.body?.eventLabel, 120),
                target: sanitizeText(req.body?.target, 180),
                pagePath: sanitizeText(req.body?.pagePath, 180),
                referrer: sanitizeText(req.body?.referrer, 240),
                ip: getClientIp(req),
                userAgent: sanitizeText(req.headers['user-agent'], 240)
            };

            logs.push(event);
            writeData(interactionEventsFile, logs);
            return res.json({ success: true });
        } catch (error) {
            console.error('记录交互事件失败:', error);
            return res.status(500).json({ error: 'interaction_track_failed' });
        }
    });

    router.get('/interaction/summary', authenticateToken, (req, res) => {
        try {
            const today = toDateKey(typeof now === 'function' ? now() : new Date(), timeZone);
            const range = normalizeDateRange(req.query || {}, today);
            const events = readData(interactionEventsFile, []);
            res.json({
                ...range,
                summary: summarizeEvents(events, range)
            });
        } catch (error) {
            console.error('获取交互统计失败:', error);
            res.status(500).json({ error: 'interaction_summary_failed' });
        }
    });

    router.get('/interaction/recent', authenticateToken, (req, res) => {
        try {
            const limit = parseIntParam(req.query.limit, { defaultValue: 100, min: 1, max: 500 });
            const events = readData(interactionEventsFile, []);
            res.json({
                events: [...events]
                    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
                    .slice(0, limit)
            });
        } catch (error) {
            console.error('获取最近交互事件失败:', error);
            res.status(500).json({ error: 'interaction_recent_failed' });
        }
    });

    return router;
}

module.exports = {
    createInteractionRouter,
    summarizeEvents
};
