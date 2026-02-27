const express = require('express');
const { parseIntParam } = require('../utils/validation');

const PROVINCE_MAP = {
    '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
    '河北': '河北省', '山西': '山西省', '辽宁': '辽宁省', '吉林': '吉林省',
    '黑龙江': '黑龙江省', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
    '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
    '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '海南': '海南省',
    '四川': '四川省', '贵州': '贵州省', '云南': '云南省', '陕西': '陕西省',
    '甘肃': '甘肃省', '青海': '青海省', '台湾': '台湾省',
    '内蒙古': '内蒙古自治区', '广西': '广西壮族自治区', '西藏': '西藏自治区',
    '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区',
    '香港': '香港特别行政区', '澳门': '澳门特别行政区'
};

function isLocalIP(ip) {
    return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
}

async function getProvinceFromIP(ip) {
    try {
        if (isLocalIP(ip)) {
            return '未知';
        }

        const response = await fetch(`http://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`);
        const data = await response.json();

        if (data.code === 0 && data.data) {
            const region = data.data.region;

            if (region && PROVINCE_MAP[region]) {
                return PROVINCE_MAP[region];
            }
            if (region) {
                return region;
            }
        }

        return '未知';
    } catch (error) {
        console.error('IP地址解析失败:', error);
        return '未知';
    }
}

function createVisitRouter({ readData, writeData, visitLogsFile, authenticateToken }) {
    const router = express.Router();

    router.post('/visit/track', async (req, res) => {
        try {
            const clientIP = req.ip || req.connection.remoteAddress ||
                req.headers['x-forwarded-for']?.split(',')[0] ||
                req.headers['x-real-ip'] || '未知';

            const province = await getProvinceFromIP(clientIP);
            const logs = readData(visitLogsFile);

            const today = new Date().toISOString().split('T')[0];
            const existingLog = logs.find(log =>
                log.ip === clientIP &&
                log.date.startsWith(today)
            );

            if (!existingLog) {
                const newLog = {
                    id: Date.now(),
                    ip: clientIP,
                    province: province,
                    country: '中国',
                    date: new Date().toISOString(),
                    userAgent: req.headers['user-agent'] || '未知'
                };

                logs.push(newLog);
                writeData(visitLogsFile, logs);
            }

            res.json({ success: true, province });
        } catch (error) {
            console.error('记录访问日志失败:', error);
            res.status(500).json({ error: '记录访问日志失败' });
        }
    });

    router.get('/visit/province-stats', authenticateToken, (req, res) => {
        try {
            const logs = readData(visitLogsFile);

            const provinceStats = {};
            logs.forEach(log => {
                const province = log.province || '未知';
                if (!provinceStats[province]) {
                    provinceStats[province] = 0;
                }
                provinceStats[province]++;
            });

            const statsArray = Object.entries(provinceStats)
                .map(([province, count]) => ({ province, count }))
                .sort((a, b) => b.count - a.count);

            res.json({
                total: logs.length,
                provinceStats: statsArray,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('获取省份统计失败:', error);
            res.status(500).json({ error: '获取省份统计失败' });
        }
    });

    router.get('/visit/logs', authenticateToken, (req, res) => {
        try {
            const page = parseIntParam(req.query.page, { defaultValue: 1, min: 1, max: 100000 });
            const limit = parseIntParam(req.query.limit, { defaultValue: 50, min: 1, max: 200 });
            const province = req.query.province;

            let logs = readData(visitLogsFile);

            if (province && province !== 'all') {
                logs = logs.filter(log => log.province === province);
            }

            logs.sort((a, b) => new Date(b.date) - new Date(a.date));

            const total = logs.length;
            const start = (page - 1) * limit;
            const paginatedLogs = logs.slice(start, start + limit);

            res.json({
                logs: paginatedLogs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('获取访问日志失败:', error);
            res.status(500).json({ error: '获取访问日志失败' });
        }
    });

    router.delete('/visit/logs/cleanup', authenticateToken, (req, res) => {
        try {
            const days = parseIntParam(req.query.days, { defaultValue: 30, min: 1, max: 3650 });
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            let logs = readData(visitLogsFile);
            const originalCount = logs.length;
            logs = logs.filter(log => new Date(log.date) > cutoffDate);

            writeData(visitLogsFile, logs);

            res.json({
                success: true,
                deleted: originalCount - logs.length,
                remaining: logs.length
            });
        } catch (error) {
            console.error('清理日志失败:', error);
            res.status(500).json({ error: '清理日志失败' });
        }
    });

    return router;
}

module.exports = {
    createVisitRouter
};
