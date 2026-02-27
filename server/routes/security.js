const express = require('express');

const DEFAULT_API_RATE_LIMIT = {
    MAX_CALLS: 10,           // 最大调用次数
    TIME_WINDOW: 3600000,    // 时间窗口：1小时（毫秒）
    BAN_DURATION: 86400000   // 封禁时长：24小时（毫秒）
};

function isLocalIP(ip) {
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
}

function createSecurityHelpers({ readData, writeData, bannedIpsFile, apiCallsFile, apiRateLimit = DEFAULT_API_RATE_LIMIT }) {
    function getClientIP(req) {
        return req.ip ||
            req.connection?.remoteAddress ||
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.headers['x-real-ip'] ||
            'unknown';
    }

    function isIPBanned(ip) {
        const bannedIPs = readData(bannedIpsFile);
        const now = Date.now();

        const banRecord = bannedIPs.find(record => {
            return record.ip === ip && record.bannedUntil > now;
        });

        if (banRecord) {
            return {
                banned: true,
                reason: banRecord.reason,
                bannedUntil: new Date(banRecord.bannedUntil).toLocaleString('zh-CN')
            };
        }

        return { banned: false };
    }

    function cleanupExpiredBans() {
        const bannedIPs = readData(bannedIpsFile);
        const now = Date.now();

        const activeBans = bannedIPs.filter(record => record.bannedUntil > now);

        if (activeBans.length !== bannedIPs.length) {
            writeData(bannedIpsFile, activeBans);
            console.log(`清理了 ${bannedIPs.length - activeBans.length} 条过期封禁记录`);
        }
    }

    function cleanupExpiredApiCalls() {
        const apiCalls = readData(apiCallsFile);
        const now = Date.now();
        const validCalls = apiCalls.filter(call => now - call.timestamp < apiRateLimit.TIME_WINDOW);

        if (validCalls.length !== apiCalls.length) {
            writeData(apiCallsFile, validCalls);
            console.log(`清理了 ${apiCalls.length - validCalls.length} 条过期API调用记录`);
        }
    }

    function recordAPICall(ip) {
        const apiCalls = readData(apiCallsFile);
        const now = Date.now();

        const validCalls = apiCalls.filter(call => now - call.timestamp < apiRateLimit.TIME_WINDOW);

        validCalls.push({
            ip: ip,
            timestamp: now,
            id: Date.now()
        });

        writeData(apiCallsFile, validCalls);

        const callsFromIP = validCalls.filter(call => call.ip === ip);

        return {
            totalCalls: callsFromIP.length,
            recentCalls: callsFromIP
        };
    }

    function banIP(ip, reason = 'API调用频率超限') {
        const bannedIPs = readData(bannedIpsFile);
        const now = Date.now();

        const existingBan = bannedIPs.find(record =>
            record.ip === ip && record.bannedUntil > now
        );

        if (existingBan) {
            console.log(`IP ${ip} 已被封禁，跳过重复封禁`);
            return false;
        }

        bannedIPs.push({
            id: Date.now(),
            ip: ip,
            reason: reason,
            bannedAt: now,
            bannedUntil: now + apiRateLimit.BAN_DURATION,
            callCount: apiRateLimit.MAX_CALLS + 1
        });

        writeData(bannedIpsFile, bannedIPs);
        console.log(`IP ${ip} 已被封禁，原因: ${reason}，解封时间: ${new Date(now + apiRateLimit.BAN_DURATION).toLocaleString('zh-CN')}`);

        return true;
    }

    return {
        apiRateLimit,
        getClientIP,
        isIPBanned,
        cleanupExpiredBans,
        cleanupExpiredApiCalls,
        recordAPICall,
        banIP
    };
}

function createSecurityRuntime({ readData, writeData, bannedIpsFile, apiCallsFile, apiRateLimit }) {
    const helpers = createSecurityHelpers({
        readData,
        writeData,
        bannedIpsFile,
        apiCallsFile,
        apiRateLimit
    });

    function checkIPBan(req, res, next) {
        const ip = helpers.getClientIP(req);
        const banStatus = helpers.isIPBanned(ip);

        if (banStatus.banned) {
            return res.status(403).json({
                error: 'IP地址已被封禁',
                reason: banStatus.reason,
                bannedUntil: banStatus.bannedUntil,
                message: '您的IP地址因违反使用规则已被暂时封禁，请联系管理员或稍后重试'
            });
        }

        next();
    }

    function monitorAPIRateLimit(req, res, next) {
        if (!req.path.includes('/api/ai/chat')) {
            return next();
        }

        const ip = helpers.getClientIP(req);
        if (isLocalIP(ip)) {
            return next();
        }

        const callStats = helpers.recordAPICall(ip);

        if (callStats.totalCalls > helpers.apiRateLimit.MAX_CALLS) {
            console.log(`IP ${ip} 超过API调用限制: ${callStats.totalCalls}次`);

            helpers.banIP(
                ip,
                `在1小时内调用大模型API ${callStats.totalCalls}次，超过限制(${helpers.apiRateLimit.MAX_CALLS}次)`
            );

            return res.status(403).json({
                error: 'API调用频率超限',
                message: '您在短时间内的API调用次数超过限制，IP已被暂时封禁24小时',
                callCount: callStats.totalCalls,
                limit: helpers.apiRateLimit.MAX_CALLS
            });
        }

        if (callStats.totalCalls >= helpers.apiRateLimit.MAX_CALLS * 0.8) {
            res.setHeader('X-RateLimit-Remaining', helpers.apiRateLimit.MAX_CALLS - callStats.totalCalls);
            res.setHeader('X-RateLimit-Limit', helpers.apiRateLimit.MAX_CALLS);
            res.setHeader('X-RateLimit-Warning', 'API调用次数接近限制，请合理使用');
        }

        next();
    }

    function cleanupExpiredData() {
        helpers.cleanupExpiredBans();
        helpers.cleanupExpiredApiCalls();
    }

    return {
        checkIPBan,
        monitorAPIRateLimit,
        cleanupExpiredData
    };
}

function createSecurityRouter({ readData, writeData, bannedIpsFile, apiCallsFile, authenticateToken, apiRateLimit }) {
    const router = express.Router();
    const helpers = createSecurityHelpers({
        readData,
        writeData,
        bannedIpsFile,
        apiCallsFile,
        apiRateLimit
    });

    router.get('/banned-ips', authenticateToken, (req, res) => {
        try {
            const bannedIPs = readData(bannedIpsFile);
            const now = Date.now();

            const activeBans = bannedIPs
                .filter(record => record.bannedUntil > now)
                .map(record => ({
                    ...record,
                    bannedAt: new Date(record.bannedAt).toLocaleString('zh-CN'),
                    bannedUntil: new Date(record.bannedUntil).toLocaleString('zh-CN'),
                    remainingTime: Math.max(0, Math.ceil((record.bannedUntil - now) / 1000 / 60)),
                    isExpired: false
                }))
                .sort((a, b) => b.bannedAt - a.bannedAt);

            const stats = {
                totalBanned: activeBans.length,
                bannedInLast24h: activeBans.filter(b => now - b.bannedAt < 86400000).length,
                banReasons: activeBans.reduce((acc, b) => {
                    acc[b.reason] = (acc[b.reason] || 0) + 1;
                    return acc;
                }, {})
            };

            res.json({
                bannedIPs: activeBans,
                stats: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('获取封禁IP列表失败:', error);
            res.status(500).json({ error: '获取封禁IP列表失败' });
        }
    });

    router.get('/api-calls/stats', authenticateToken, (req, res) => {
        try {
            const apiCalls = readData(apiCallsFile);
            const now = Date.now();
            const validCalls = apiCalls.filter(call => now - call.timestamp < helpers.apiRateLimit.TIME_WINDOW);

            const ipStats = {};
            validCalls.forEach(call => {
                if (!ipStats[call.ip]) {
                    ipStats[call.ip] = {
                        ip: call.ip,
                        callCount: 0,
                        firstCall: call.timestamp,
                        lastCall: call.timestamp
                    };
                }
                ipStats[call.ip].callCount++;
                ipStats[call.ip].lastCall = Math.max(ipStats[call.ip].lastCall, call.timestamp);
            });

            const statsArray = Object.values(ipStats)
                .map(stat => ({
                    ...stat,
                    firstCall: new Date(stat.firstCall).toLocaleString('zh-CN'),
                    lastCall: new Date(stat.lastCall).toLocaleString('zh-CN'),
                    isNearLimit: stat.callCount >= helpers.apiRateLimit.MAX_CALLS * 0.8
                }))
                .sort((a, b) => b.callCount - a.callCount)
                .slice(0, 50);

            res.json({
                totalCalls: validCalls.length,
                uniqueIPs: Object.keys(ipStats).length,
                ipStats: statsArray,
                timeWindow: helpers.apiRateLimit.TIME_WINDOW / 1000 / 60,
                limit: helpers.apiRateLimit.MAX_CALLS
            });
        } catch (error) {
            console.error('获取API调用统计失败:', error);
            res.status(500).json({ error: '获取API调用统计失败' });
        }
    });

    router.post('/banned-ips', authenticateToken, (req, res) => {
        try {
            const { ip, reason, duration } = req.body;

            if (!ip) {
                return res.status(400).json({ error: 'IP地址不能为空' });
            }

            const bannedIPs = readData(bannedIpsFile);
            const now = Date.now();

            const existingBan = bannedIPs.find(record =>
                record.ip === ip && record.bannedUntil > now
            );

            if (existingBan) {
                return res.status(400).json({
                    error: '该IP已被封禁',
                    bannedUntil: new Date(existingBan.bannedUntil).toLocaleString('zh-CN')
                });
            }

            const banDuration = duration ? duration * 60 * 60 * 1000 : helpers.apiRateLimit.BAN_DURATION;

            bannedIPs.push({
                id: Date.now(),
                ip: ip,
                reason: reason || '管理员手动封禁',
                bannedAt: now,
                bannedUntil: now + banDuration,
                callCount: 0,
                manualBan: true
            });

            writeData(bannedIpsFile, bannedIPs);

            res.json({
                success: true,
                message: 'IP已成功封禁',
                ip: ip,
                bannedUntil: new Date(now + banDuration).toLocaleString('zh-CN')
            });
        } catch (error) {
            console.error('封禁IP失败:', error);
            res.status(500).json({ error: '封禁IP失败' });
        }
    });

    router.delete('/banned-ips/:ip', authenticateToken, (req, res) => {
        try {
            const targetIP = req.params.ip;
            const bannedIPs = readData(bannedIpsFile);

            const originalLength = bannedIPs.length;
            const filteredIPs = bannedIPs.filter(record => {
                return record.ip !== targetIP;
            });

            if (filteredIPs.length === originalLength) {
                return res.status(404).json({ error: '未找到该IP的封禁记录' });
            }

            writeData(bannedIpsFile, filteredIPs);

            res.json({
                success: true,
                message: 'IP已成功解封',
                ip: targetIP,
                deleted: originalLength - filteredIPs.length
            });
        } catch (error) {
            console.error('解封IP失败:', error);
            res.status(500).json({ error: '解封IP失败' });
        }
    });

    router.post('/banned-ips/cleanup', authenticateToken, (req, res) => {
        try {
            helpers.cleanupExpiredBans();

            const bannedIPs = readData(bannedIpsFile);
            const now = Date.now();
            const activeBans = bannedIPs.filter(record => record.bannedUntil > now);

            res.json({
                success: true,
                message: '过期封禁记录已清理',
                activeBans: activeBans.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('清理封禁记录失败:', error);
            res.status(500).json({ error: '清理封禁记录失败' });
        }
    });

    return router;
}

module.exports = {
    createSecurityRuntime,
    createSecurityRouter
};
