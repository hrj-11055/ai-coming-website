// Load environment variables from .env file
require('dotenv').config();

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./server/app');
const { createAuthMiddleware } = require('./server/middleware/auth');
const { generateId } = require('./server/utils/ids');
const { createAuthRouter } = require('./server/routes/auth');
const { createSettingsRouter } = require('./server/routes/settings');
const { createKeywordsRouter } = require('./server/routes/keywords');
const { createNewsRouter } = require('./server/routes/news');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required.');
}

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const KEYWORDS_FILE = path.join(DATA_DIR, 'keywords.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const WEEKLY_NEWS_FILE = path.join(DATA_DIR, 'weekly-news.json');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
const TOOL_CATEGORIES_FILE = path.join(DATA_DIR, 'tool-categories.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const VISIT_LOGS_FILE = path.join(DATA_DIR, 'visit-logs.json');
const API_CALLS_FILE = path.join(DATA_DIR, 'api-calls.json');
const BANNED_IPS_FILE = path.join(DATA_DIR, 'banned-ips.json');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');
const DAILY_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'daily');
const WEEKLY_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'weekly');
const LOGO_DIR = path.join(ROOT_DIR, 'logos');

const staticRoot = process.env.STATIC_ROOT;
const app = createApp({ rootDir: ROOT_DIR, staticRoot });

for (const dir of [DATA_DIR, ARCHIVE_DIR, DAILY_ARCHIVE_DIR, WEEKLY_ARCHIVE_DIR, LOGO_DIR]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Initialize data files
function initDataFiles() {
    if (!fs.existsSync(KEYWORDS_FILE)) {
        fs.writeFileSync(KEYWORDS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(NEWS_FILE)) {
        fs.writeFileSync(NEWS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(WEEKLY_NEWS_FILE)) {
        fs.writeFileSync(WEEKLY_NEWS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(TOOLS_FILE)) {
        fs.writeFileSync(TOOLS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(TOOL_CATEGORIES_FILE)) {
        fs.writeFileSync(TOOL_CATEGORIES_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(VISIT_LOGS_FILE)) {
        fs.writeFileSync(VISIT_LOGS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(API_CALLS_FILE)) {
        fs.writeFileSync(API_CALLS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(BANNED_IPS_FILE)) {
        fs.writeFileSync(BANNED_IPS_FILE, JSON.stringify([]));
    }

    if (!fs.existsSync(ADMINS_FILE)) {
        const username = process.env.DEFAULT_ADMIN_USERNAME;
        const password = process.env.DEFAULT_ADMIN_PASSWORD;

        if (username && password) {
            const role = process.env.DEFAULT_ADMIN_ROLE || 'super_admin';
            const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
            const passwordHash = bcrypt.hashSync(password, saltRounds);
            const defaultAdmin = [{
                id: 1,
                username,
                password_hash: passwordHash,
                role,
                created_at: new Date().toISOString()
            }];
            fs.writeFileSync(ADMINS_FILE, JSON.stringify(defaultAdmin, null, 2));
            console.log('Default admin ' + username + ' initialized in admins.json');
        } else {
            fs.writeFileSync(ADMINS_FILE, JSON.stringify([]));
            console.warn('Admins file created without bootstrap user because DEFAULT_ADMIN_USERNAME/DEFAULT_ADMIN_PASSWORD is unset.');
        }
    }

    if (!fs.existsSync(SETTINGS_FILE)) {
        const defaultSettings = {
            todayNewsDisplayCount: 20,
            maxDisplayCount: 50,
            minDisplayCount: 1,
            autoArchiveEnabled: true,
            version: '1.0.0',
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    }
}

// 读取数据
function readData(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`读取文件 ${filename} 失败:`, error);
        return [];
    }
}

// 写入数据
function writeData(filename, data) {
    try {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`写入文件 ${filename} 失败:`, error);
        return false;
    }
}

// 归档旧新闻到历史文件
function archiveOldNews() {
    try {
        const news = readData(NEWS_FILE);
        const today = new Date().toISOString().split('T')[0]; // 获取今天的日期 YYYY-MM-DD
        
        // 按日期分组新闻
        const newsByDate = {};
        const todayNews = [];
        
        news.forEach(article => {
            const articleDate = article.created_at.split('T')[0];
            if (articleDate === today) {
                todayNews.push(article);
            } else {
                if (!newsByDate[articleDate]) {
                    newsByDate[articleDate] = [];
                }
                newsByDate[articleDate].push(article);
            }
        });
        
        // 将非今日新闻归档到对应的日期文件
        Object.keys(newsByDate).forEach(date => {
            const archiveFile = path.join(DAILY_ARCHIVE_DIR, `news-${date}.json`);
            const existingArchive = fs.existsSync(archiveFile) ? readData(archiveFile) : [];
            const mergedNews = [...existingArchive, ...newsByDate[date]];
            writeData(archiveFile, mergedNews);
            console.log(`已归档 ${newsByDate[date].length} 篇每日资讯到 daily/news-${date}.json`);
        });
        
        // 更新news.json，只保留今日新闻
        writeData(NEWS_FILE, todayNews);
        console.log(`已清理news.json，保留 ${todayNews.length} 篇今日新闻`);
        
        return { archived: Object.keys(newsByDate).length, todayCount: todayNews.length };
    } catch (error) {
        console.error('归档新闻失败:', error);
        return { archived: 0, todayCount: 0 };
    }
}

// 归档旧每周资讯到历史文件
function archiveOldWeeklyNews() {
    try {
        const weeklyNews = readData(WEEKLY_NEWS_FILE);
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const currentYear = now.getFullYear();
        
        // 按周次分组每周资讯
        const newsByWeek = {};
        
        weeklyNews.forEach(article => {
            const articleDate = new Date(article.created_at);
            const articleWeek = getWeekNumber(articleDate);
            const articleYear = articleDate.getFullYear();
            const weekKey = `${articleYear}-W${articleWeek.toString().padStart(2, '0')}`;
            const weekStartDate = getWeekStartDate(articleDate);
            const weekStartStr = `${weekStartDate.getMonth() + 1}-${weekStartDate.getDate().toString().padStart(2, '0')}`;
            
            if (!newsByWeek[weekKey]) {
                newsByWeek[weekKey] = {
                    weekNumber: weekKey,
                    weekStartDate: weekStartStr,
                    articles: []
                };
            }
            newsByWeek[weekKey].articles.push(article);
        });
        
        // 将非当前周的每周资讯归档到对应的周次文件
        Object.keys(newsByWeek).forEach(weekKey => {
            const weekData = newsByWeek[weekKey];
            const archiveFile = path.join(WEEKLY_ARCHIVE_DIR, `${weekKey}-${weekData.weekStartDate}.json`);
            const existingArchive = fs.existsSync(archiveFile) ? readData(archiveFile) : [];
            const mergedNews = [...existingArchive, ...weekData.articles];
            writeData(archiveFile, mergedNews);
            console.log(`已归档 ${weekData.articles.length} 篇每周资讯到 weekly/${weekKey}-${weekData.weekStartDate}.json`);
        });
        
        // 更新weekly-news.json，只保留当前周的每周资讯
        const currentWeekKey = `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`;
        const currentWeekNews = weeklyNews.filter(article => {
            const articleDate = new Date(article.created_at);
            const articleWeek = getWeekNumber(articleDate);
            const articleYear = articleDate.getFullYear();
            return `${articleYear}-W${articleWeek.toString().padStart(2, '0')}` === currentWeekKey;
        });
        
        writeData(WEEKLY_NEWS_FILE, currentWeekNews);
        console.log(`已清理weekly-news.json，保留 ${currentWeekNews.length} 篇当前周资讯`);
        
        return { archived: Object.keys(newsByWeek).length, currentWeekCount: currentWeekNews.length };
    } catch (error) {
        console.error('归档旧每周资讯失败:', error);
        return { archived: 0, currentWeekCount: 0 };
    }
}

// 获取周数
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 获取周一的日期
function getWeekStartDate(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// JWT验证中间件
const authenticateToken = createAuthMiddleware(JWT_SECRET);

// ==================== IP监控和封禁功能 ====================

// 配置参数
const API_RATE_LIMIT = {
    MAX_CALLS: 10,           // 最大调用次数
    TIME_WINDOW: 3600000,    // 时间窗口：1小时（毫秒）
    BAN_DURATION: 86400000   // 封禁时长：24小时（毫秒）
};

// 获取客户端真实IP
function getClientIP(req) {
    return req.ip ||
           req.connection?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
}

// 检查IP是否被封禁
function isIPBanned(ip) {
    const bannedIPs = readData(BANNED_IPS_FILE);
    const now = Date.now();

    // 查找该IP的封禁记录
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

// 清理过期的封禁记录
function cleanupExpiredBans() {
    const bannedIPs = readData(BANNED_IPS_FILE);
    const now = Date.now();

    const activeBans = bannedIPs.filter(record => record.bannedUntil > now);

    if (activeBans.length !== bannedIPs.length) {
        writeData(BANNED_IPS_FILE, activeBans);
        console.log(`清理了 ${bannedIPs.length - activeBans.length} 条过期封禁记录`);
    }
}

// 记录API调用
function recordAPICall(ip) {
    const apiCalls = readData(API_CALLS_FILE);
    const now = Date.now();

    // 清理超过时间窗口的旧记录
    const validCalls = apiCalls.filter(call => now - call.timestamp < API_RATE_LIMIT.TIME_WINDOW);

    // 添加新的调用记录
    validCalls.push({
        ip: ip,
        timestamp: now,
        id: Date.now()
    });

    writeData(API_CALLS_FILE, validCalls);

    // 统计该IP在时间窗口内的调用次数
    const callsFromIP = validCalls.filter(call => call.ip === ip);

    return {
        totalCalls: callsFromIP.length,
        recentCalls: callsFromIP
    };
}

// 封禁IP
function banIP(ip, reason = 'API调用频率超限') {
    const bannedIPs = readData(BANNED_IPS_FILE);
    const now = Date.now();

    // 检查是否已经存在未过期的封禁
    const existingBan = bannedIPs.find(record =>
        record.ip === ip && record.bannedUntil > now
    );

    if (existingBan) {
        console.log(`IP ${ip} 已被封禁，跳过重复封禁`);
        return false;
    }

    // 添加新的封禁记录
    bannedIPs.push({
        id: Date.now(),
        ip: ip,
        reason: reason,
        bannedAt: now,
        bannedUntil: now + API_RATE_LIMIT.BAN_DURATION,
        callCount: API_RATE_LIMIT.MAX_CALLS + 1
    });

    writeData(BANNED_IPS_FILE, bannedIPs);
    console.log(`IP ${ip} 已被封禁，原因: ${reason}，解封时间: ${new Date(now + API_RATE_LIMIT.BAN_DURATION).toLocaleString('zh-CN')}`);

    return true;
}

// IP封禁检查中间件
function checkIPBan(req, res, next) {
    const ip = getClientIP(req);
    const banStatus = isIPBanned(ip);

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

// API调用频率监控中间件（仅监控AI聊天接口）
function monitorAPIRateLimit(req, res, next) {
    // 只对AI聊天接口进行监控
    if (!req.path.includes('/api/ai/chat')) {
        return next();
    }

    const ip = getClientIP(req);

    // 跳过本地IP
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return next();
    }

    // 记录API调用
    const callStats = recordAPICall(ip);

    // 检查是否超过限制
    if (callStats.totalCalls > API_RATE_LIMIT.MAX_CALLS) {
        console.log(`IP ${ip} 超过API调用限制: ${callStats.totalCalls}次`);

        // 自动封禁IP
        banIP(ip, `在1小时内调用大模型API ${callStats.totalCalls}次，超过限制(${API_RATE_LIMIT.MAX_CALLS}次)`);

        // 返回封禁错误
        return res.status(403).json({
            error: 'API调用频率超限',
            message: '您在短时间内的API调用次数超过限制，IP已被暂时封禁24小时',
            callCount: callStats.totalCalls,
            limit: API_RATE_LIMIT.MAX_CALLS
        });
    }

    // 添加警告头（接近限制时）
    if (callStats.totalCalls >= API_RATE_LIMIT.MAX_CALLS * 0.8) {
        res.setHeader('X-RateLimit-Remaining', API_RATE_LIMIT.MAX_CALLS - callStats.totalCalls);
        res.setHeader('X-RateLimit-Limit', API_RATE_LIMIT.MAX_CALLS);
        res.setHeader('X-RateLimit-Warning', 'API调用次数接近限制，请合理使用');
    }

    next();
}

// 应用中间件
app.use(checkIPBan);
app.use(monitorAPIRateLimit);
app.use('/api', createAuthRouter({
    readData,
    adminsFile: ADMINS_FILE,
    jwtSecret: JWT_SECRET
}));
app.use('/api', createSettingsRouter({
    readData,
    writeData,
    settingsFile: SETTINGS_FILE,
    authenticateToken
}));
app.use('/api', createKeywordsRouter({
    readData,
    writeData,
    keywordsFile: KEYWORDS_FILE,
    authenticateToken,
    generateId
}));
app.use('/api', createNewsRouter({
    readData,
    writeData,
    generateId,
    archiveOldNews,
    authenticateToken,
    newsFile: NEWS_FILE,
    settingsFile: SETTINGS_FILE,
    dataDir: DATA_DIR,
    dailyArchiveDir: DAILY_ARCHIVE_DIR
}));

// 定期清理过期数据（每小时执行一次）
setInterval(() => {
    cleanupExpiredBans();

    // 清理超过时间窗口的API调用记录
    const apiCalls = readData(API_CALLS_FILE);
    const now = Date.now();
    const validCalls = apiCalls.filter(call => now - call.timestamp < API_RATE_LIMIT.TIME_WINDOW);

    if (validCalls.length !== apiCalls.length) {
        writeData(API_CALLS_FILE, validCalls);
        console.log(`清理了 ${apiCalls.length - validCalls.length} 条过期API调用记录`);
    }
}, 3600000); // 1小时

// ==================== 地理位置统计功能 ====================

// 省份映射表（用于规范化省份名称）
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

// IP地址解析为省份
async function getProvinceFromIP(ip) {
    try {
        // 跳过本地IP
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return '未知';
        }

        // 使用免费的IP定位API（淘宝IP接口）
        const response = await fetch(`http://ip.taobao.com/outGetIpInfo?ip=${ip}&accessKey=alibaba-inc`);
        const data = await response.json();

        if (data.code === 0 && data.data) {
            const region = data.data.region;
            const city = data.data.city;

            // 规范化省份名称
            if (region && PROVINCE_MAP[region]) {
                return PROVINCE_MAP[region];
            } else if (region) {
                return region;
            }
        }

        return '未知';
    } catch (error) {
        console.error('IP地址解析失败:', error);
        return '未知';
    }
}

// 记录访问日志
app.post('/api/visit/track', async (req, res) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress ||
                        req.headers['x-forwarded-for']?.split(',')[0] ||
                        req.headers['x-real-ip'] || '未知';

        // 获取省份信息
        const province = await getProvinceFromIP(clientIP);

        // 读取现有日志
        const logs = readData(VISIT_LOGS_FILE);

        // 检查今天是否已有该IP的记录（避免重复计数）
        const today = new Date().toISOString().split('T')[0];
        const existingLog = logs.find(log =>
            log.ip === clientIP &&
            log.date.startsWith(today)
        );

        if (!existingLog) {
            // 添加新的访问记录
            const newLog = {
                id: Date.now(),
                ip: clientIP,
                province: province,
                country: '中国',
                date: new Date().toISOString(),
                userAgent: req.headers['user-agent'] || '未知'
            };

            logs.push(newLog);
            writeData(VISIT_LOGS_FILE, logs);
        }

        res.json({ success: true, province });
    } catch (error) {
        console.error('记录访问日志失败:', error);
        res.status(500).json({ error: '记录访问日志失败' });
    }
});

// 获取省份统计（管理员认证）
app.get('/api/visit/province-stats', authenticateToken, (req, res) => {
    try {
        const logs = readData(VISIT_LOGS_FILE);

        // 按省份统计
        const provinceStats = {};
        logs.forEach(log => {
            const province = log.province || '未知';
            if (!provinceStats[province]) {
                provinceStats[province] = 0;
            }
            provinceStats[province]++;
        });

        // 转换为数组并排序
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

// 获取详细访问日志（管理员认证）
app.get('/api/visit/logs', authenticateToken, (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const province = req.query.province;

        let logs = readData(VISIT_LOGS_FILE);

        // 按省份筛选
        if (province && province !== 'all') {
            logs = logs.filter(log => log.province === province);
        }

        // 按日期倒序排序
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 分页
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

// 清理旧日志（管理员认证）
app.delete('/api/visit/logs/cleanup', authenticateToken, (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let logs = readData(VISIT_LOGS_FILE);
        const originalCount = logs.length;

        // 只保留指定天数内的日志
        logs = logs.filter(log => new Date(log.date) > cutoffDate);

        writeData(VISIT_LOGS_FILE, logs);

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

// ==================== IP封禁管理API ====================

// 获取所有被封禁的IP列表（管理员认证）
app.get('/api/banned-ips', authenticateToken, (req, res) => {
    try {
        const bannedIPs = readData(BANNED_IPS_FILE);
        const now = Date.now();

        // 过滤出仍然有效的封禁记录
        const activeBans = bannedIPs
            .filter(record => record.bannedUntil > now)
            .map(record => ({
                ...record,
                bannedAt: new Date(record.bannedAt).toLocaleString('zh-CN'),
                bannedUntil: new Date(record.bannedUntil).toLocaleString('zh-CN'),
                remainingTime: Math.max(0, Math.ceil((record.bannedUntil - now) / 1000 / 60)), // 剩余分钟数
                isExpired: false
            }))
            .sort((a, b) => b.bannedAt - a.bannedAt);

        // 统计信息
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

// 获取API调用统计（管理员认证）
app.get('/api/api-calls/stats', authenticateToken, (req, res) => {
    try {
        const apiCalls = readData(API_CALLS_FILE);
        const now = Date.now();

        // 清理过期记录
        const validCalls = apiCalls.filter(call => now - call.timestamp < API_RATE_LIMIT.TIME_WINDOW);

        // 按IP分组统计
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

        // 转换为数组并排序
        const statsArray = Object.values(ipStats)
            .map(stat => ({
                ...stat,
                firstCall: new Date(stat.firstCall).toLocaleString('zh-CN'),
                lastCall: new Date(stat.lastCall).toLocaleString('zh-CN'),
                isNearLimit: stat.callCount >= API_RATE_LIMIT.MAX_CALLS * 0.8
            }))
            .sort((a, b) => b.callCount - a.callCount)
            .slice(0, 50); // 只返回前50个

        res.json({
            totalCalls: validCalls.length,
            uniqueIPs: Object.keys(ipStats).length,
            ipStats: statsArray,
            timeWindow: API_RATE_LIMIT.TIME_WINDOW / 1000 / 60, // 分钟
            limit: API_RATE_LIMIT.MAX_CALLS
        });
    } catch (error) {
        console.error('获取API调用统计失败:', error);
        res.status(500).json({ error: '获取API调用统计失败' });
    }
});

// 手动封禁IP（管理员认证）
app.post('/api/banned-ips', authenticateToken, (req, res) => {
    try {
        const { ip, reason, duration } = req.body;

        if (!ip) {
            return res.status(400).json({ error: 'IP地址不能为空' });
        }

        const bannedIPs = readData(BANNED_IPS_FILE);
        const now = Date.now();

        // 检查是否已存在
        const existingBan = bannedIPs.find(record =>
            record.ip === ip && record.bannedUntil > now
        );

        if (existingBan) {
            return res.status(400).json({
                error: '该IP已被封禁',
                bannedUntil: new Date(existingBan.bannedUntil).toLocaleString('zh-CN')
            });
        }

        // 封禁时长（默认24小时）
        const banDuration = duration ? duration * 60 * 60 * 1000 : API_RATE_LIMIT.BAN_DURATION;

        // 添加封禁记录
        bannedIPs.push({
            id: Date.now(),
            ip: ip,
            reason: reason || '管理员手动封禁',
            bannedAt: now,
            bannedUntil: now + banDuration,
            callCount: 0,
            manualBan: true
        });

        writeData(BANNED_IPS_FILE, bannedIPs);

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

// 解封IP（管理员认证）
app.delete('/api/banned-ips/:ip', authenticateToken, (req, res) => {
    try {
        const targetIP = req.params.ip;
        const bannedIPs = readData(BANNED_IPS_FILE);
        const now = Date.now();

        // 查找并删除封禁记录
        const originalLength = bannedIPs.length;
        const filteredIPs = bannedIPs.filter(record => {
            // 只删除该IP的封禁记录（包括已过期的）
            return record.ip !== targetIP;
        });

        if (filteredIPs.length === originalLength) {
            return res.status(404).json({ error: '未找到该IP的封禁记录' });
        }

        writeData(BANNED_IPS_FILE, filteredIPs);

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

// 批量解封所有过期IP（管理员认证）
app.post('/api/banned-ips/cleanup', authenticateToken, (req, res) => {
    try {
        cleanupExpiredBans();

        const bannedIPs = readData(BANNED_IPS_FILE);
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

// 数据统计API
app.get('/api/stats', (req, res) => {
    const keywords = readData(KEYWORDS_FILE);
    const news = readData(NEWS_FILE);
    const weeklyNews = readData(WEEKLY_NEWS_FILE);
    
    const stats = {
        keywords: keywords.length,
        news: news.length + weeklyNews.length, // 每日资讯 + 每周资讯
        dailyNews: news.length, // 每日资讯数量
        weeklyNews: weeklyNews.length, // 每周资讯数量
        highImportanceNews: news.filter(n => (n.importance_score || 0) >= 8).length + 
                           weeklyNews.filter(n => (n.importance_score || 0) >= 8).length
    };
    
    res.json(stats);
});

// 数据备份API
app.get('/api/backup', authenticateToken, (req, res) => {
    const keywords = readData(KEYWORDS_FILE);
    const news = readData(NEWS_FILE);
    
    res.json({
        keywords,
        news,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 数据恢复API
app.post('/api/restore', authenticateToken, (req, res) => {
    const { keywords, news } = req.body;
    
    if (keywords && Array.isArray(keywords)) {
        writeData(KEYWORDS_FILE, keywords);
    }
    
    if (news && Array.isArray(news)) {
        writeData(NEWS_FILE, news);
    }
    
    res.json({ message: '数据恢复成功' });
});

// 历史数据管理API
app.get('/api/archive/dates', authenticateToken, (req, res) => {
    try {
        const { type = 'daily' } = req.query; // 默认为每日资讯
        const archiveDir = type === 'weekly' ? WEEKLY_ARCHIVE_DIR : DAILY_ARCHIVE_DIR;
        
        if (!fs.existsSync(archiveDir)) {
            return res.json({ dates: [] });
        }
        
        const files = fs.readdirSync(archiveDir);
        const dates = files
            .filter(file => file.endsWith('.json'))
            .map(file => file.replace('.json', ''))
            .sort()
            .reverse(); // 最新的日期在前
        
        res.json({ dates, type });
    } catch (error) {
        console.error('获取历史日期失败:', error);
        res.status(500).json({ error: '获取历史日期失败' });
    }
});

app.get('/api/archive/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;
        const { type = 'daily' } = req.query; // 默认为每日资讯
        const archiveDir = type === 'weekly' ? WEEKLY_ARCHIVE_DIR : DAILY_ARCHIVE_DIR;
        const archiveFile = path.join(archiveDir, `${date}.json`);
        
        if (!fs.existsSync(archiveFile)) {
            return res.status(404).json({ error: '该日期的数据不存在' });
        }
        
        const news = readData(archiveFile);
        res.json(news);
    } catch (error) {
        console.error('获取历史数据失败:', error);
        res.status(500).json({ error: '获取历史数据失败' });
    }
});

app.delete('/api/archive/:date', authenticateToken, (req, res) => {
    try {
        const { date } = req.params;
        const { type = 'daily' } = req.query; // 默认为每日资讯
        const archiveDir = type === 'weekly' ? WEEKLY_ARCHIVE_DIR : DAILY_ARCHIVE_DIR;
        const archiveFile = path.join(archiveDir, `${date}.json`);
        
        if (!fs.existsSync(archiveFile)) {
            return res.status(404).json({ error: '该日期的数据不存在' });
        }
        
        fs.unlinkSync(archiveFile);
        res.json({ message: `已删除 ${date} 的${type === 'weekly' ? '每周' : '每日'}历史数据` });
    } catch (error) {
        console.error('删除历史数据失败:', error);
        res.status(500).json({ error: '删除历史数据失败' });
    }
});

// 导出今日资讯模板
app.get('/api/news/template', (req, res) => {
    try {
        const template = {
            "_说明": "今日资讯JSON模板 - 用于批量导入每日新闻数据",
            "_字段说明": {
                "title": "新闻标题（必填）",
                "key_point": "关键要点，最多30个字符（必填）",
                "summary": "新闻摘要内容（必填）",
                "source_url": "原始文章链接（必填）",
                "source_name": "来源渠道：RSS、网页、公众号、Twitter、其他（必填）",
                "category": "主分类：技术、商业、政策、产品、人物等（必填）",
                "sub_category": "子分类，如：人工智能、投资、法规等（可选）",
                "country": "地区：china（中国）、global（全球）（必填）",
                "importance_score": "重要程度：1-10，数字越大越重要（必填）",
                "published_at": "发布时间，ISO 8601格式（必填）"
            },
            "_示例数据": {
                "title": "OpenAI发布GPT-5模型，性能提升显著",
                "key_point": "GPT-5性能提升50%，支持多模态",
                "summary": "OpenAI今日正式发布GPT-5大语言模型，相比GPT-4在推理能力、代码生成和创意写作方面有显著提升。新模型支持文本、图像、音频的多模态输入，预计将在未来几周内向ChatGPT Plus用户开放。",
                "source_url": "https://openai.com/blog/gpt-5-announcement",
                "source_name": "RSS",
                "category": "技术",
                "sub_category": "人工智能",
                "country": "global",
                "importance_score": 8,
                "published_at": "2025-01-15T09:00:00.000Z"
            }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="daily-news-template.json"');
        res.json(template);
    } catch (error) {
        console.error('导出今日资讯模板失败:', error);
        res.status(500).json({ error: '导出模板失败' });
    }
});

// 导出每周资讯模板
app.get('/api/weekly-news/template', (req, res) => {
    try {
        const template = {
            "_说明": "每周资讯JSON模板 - 用于批量导入每周新闻数据",
            "_字段说明": {
                "title": "新闻标题（必填）",
                "key_point": "关键要点，最多30个字符（必填）",
                "summary": "新闻摘要内容（必填）",
                "source_url": "原始文章链接（必填）",
                "source_name": "来源渠道：RSS、网页、公众号、Twitter、其他（必填）",
                "category": "主分类：技术、商业、政策、产品、人物等（必填）",
                "sub_category": "子分类，如：人工智能、投资、法规等（可选）",
                "country": "地区：china（中国）、global（全球）（必填）",
                "weekly_category": "每周分类：policy（政策）、tech（技术）、business（商业）、product（产品）、people（人物）（必填）",
                "importance_score": "重要程度：1-10，数字越大越重要（必填）",
                "published_at": "发布时间，ISO 8601格式（必填）",
                "week_number": "周数格式：YYYY-WXX，如2025-W03（必填）",
                "week_start_date": "周开始日期：YYYY-MM-DD，如2025-01-13（必填）",
                "is_weekly_featured": "是否每周精选：true/false（必填）"
            },
            "_示例数据": {
                "title": "2025年第3周AI政策动态：多国加强AI监管",
                "key_point": "多国加强AI监管，政策趋严",
                "summary": "本周全球AI政策领域出现重要变化：美国发布AI安全标准草案，要求高风险AI系统必须通过安全测试；中国工信部发布AI应用安全指南；欧盟AI法案正式生效。各国政策趋严，对AI企业合规要求提高。",
                "source_url": "https://example.com/ai-policy-week3",
                "source_name": "公众号",
                "category": "政策",
                "sub_category": "法规",
                "country": "global",
                "weekly_category": "policy",
                "importance_score": 9,
                "published_at": "2025-01-15T09:00:00.000Z",
                "week_number": "2025-W03",
                "week_start_date": "2025-01-13",
                "is_weekly_featured": true
            }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="weekly-news-template.json"');
        res.json(template);
    } catch (error) {
        console.error('导出每周资讯模板失败:', error);
        res.status(500).json({ error: '导出模板失败' });
    }
});

// 每周资讯管理API
// 获取每周资讯列表
app.get('/api/weekly-news', (req, res) => {
    try {
        const { category, country, limit } = req.query;
        let weeklyNews = readData(WEEKLY_NEWS_FILE);
        
        // 分类筛选
        if (category && category !== 'all') {
            weeklyNews = weeklyNews.filter(article => article.weekly_category === category);
        }
        
        // 地区筛选
        if (country && country !== 'all') {
            weeklyNews = weeklyNews.filter(article => {
                if (country === 'china') {
                    return article.country === 'china' || 
                           (article.source_name && (
                               article.source_name.includes('中国') || 
                               article.source_name.includes('政府网') || 
                               article.source_name.includes('工信部')
                           ));
                } else if (country === 'global') {
                    return article.country === 'global' || 
                           !(article.source_name && (
                               article.source_name.includes('中国') || 
                               article.source_name.includes('政府网') || 
                               article.source_name.includes('工信部')
                           ));
                }
                return true;
            });
        }
        
        // 限制数量
        if (limit) {
            weeklyNews = weeklyNews.slice(0, parseInt(limit));
        }
        
        res.json(weeklyNews);
    } catch (error) {
        console.error('获取每周资讯失败:', error);
        res.status(500).json({ error: '获取每周资讯失败' });
    }
});

// 创建每周资讯
app.post('/api/weekly-news', authenticateToken, (req, res) => {
    try {
        const weeklyNews = readData(WEEKLY_NEWS_FILE);
        const importTime = new Date().toISOString();
        const newArticle = {
            id: generateId('weekly'), // 每周资讯使用周格式
            ...req.body,
            created_at: importTime  // 统一使用导入时间，忽略JSON中的created_at
        };
        
        weeklyNews.push(newArticle);
        writeData(WEEKLY_NEWS_FILE, weeklyNews);
        
        res.status(201).json(newArticle);
    } catch (error) {
        console.error('创建每周资讯失败:', error);
        res.status(500).json({ error: '创建每周资讯失败' });
    }
});

// 更新每周资讯
app.put('/api/weekly-news/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const weeklyNews = readData(WEEKLY_NEWS_FILE);
        const index = weeklyNews.findIndex(article => article.id == id);
        
        if (index === -1) {
            return res.status(404).json({ error: '每周资讯不存在' });
        }
        
        weeklyNews[index] = {
            ...weeklyNews[index],
            ...req.body,
            id: weeklyNews[index].id, // 保持原ID
            updated_at: new Date().toISOString()
        };
        
        writeData(WEEKLY_NEWS_FILE, weeklyNews);
        res.json(weeklyNews[index]);
    } catch (error) {
        console.error('更新每周资讯失败:', error);
        res.status(500).json({ error: '更新每周资讯失败' });
    }
});

// 删除每周资讯
app.delete('/api/weekly-news/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const weeklyNews = readData(WEEKLY_NEWS_FILE);
        const filteredNews = weeklyNews.filter(article => article.id != id);
        
        if (filteredNews.length === weeklyNews.length) {
            return res.status(404).json({ error: '每周资讯不存在' });
        }
        
        writeData(WEEKLY_NEWS_FILE, filteredNews);
        res.json({ message: '每周资讯删除成功' });
    } catch (error) {
        console.error('删除每周资讯失败:', error);
        res.status(500).json({ error: '删除每周资讯失败' });
    }
});

// 批量导入每周资讯
app.post('/api/weekly-news/batch', authenticateToken, (req, res) => {
    try {
        const { articles } = req.body;
        
        if (!Array.isArray(articles)) {
            return res.status(400).json({ error: '数据格式错误' });
        }
        
        // 先归档旧每周资讯
        archiveOldWeeklyNews();
        
        const weeklyNews = readData(WEEKLY_NEWS_FILE);
        const importTime = new Date().toISOString();
        const newArticles = articles.map(article => ({
            id: generateId('weekly'), // 每周资讯使用周格式
            title: article.title || '无标题',
            key_point: article.key_point || '',
            summary: article.summary || '无摘要',
            source_url: article.source_url || article.url || '#',
            source_name: article.source_name || '其他',
            category: article.category || '未分类',
            sub_category: article.sub_category || '',
            country: article.country || 'global',
            weekly_category: article.weekly_category || 'tech',
            importance_score: article.importance_score || 1,
            published_at: article.published_at || new Date().toISOString(),
            week_number: article.week_number || '2025-W03',
            week_start_date: article.week_start_date || '2025-01-13',
            is_weekly_featured: article.is_weekly_featured || true,
            created_at: importTime  // 统一使用导入时间，忽略JSON中的created_at
        }));
        
        weeklyNews.push(...newArticles);
        writeData(WEEKLY_NEWS_FILE, weeklyNews);
        
        res.json({ 
            message: `成功导入 ${newArticles.length} 篇每周资讯`,
            count: newArticles.length
        });
    } catch (error) {
        console.error('批量导入每周资讯失败:', error);
        res.status(500).json({ error: '批量导入每周资讯失败' });
    }
});

// ==================== AI工具相关API ====================

// 获取工具列表
app.get('/api/tools', (req, res) => {
    try {
        const { 
            category, 
            subcategory, 
            region, 
            price, 
            search, 
            page = 1, 
            limit = 12,
            sort = 'rating'
        } = req.query;
        
        let tools = readData(TOOLS_FILE);
        
        // 分类筛选
        if (category && category !== 'all') {
            if (subcategory) {
                tools = tools.filter(tool => 
                    tool.categories.includes(category) && 
                    tool.subcategories.includes(subcategory)
                );
            } else {
                tools = tools.filter(tool => tool.categories.includes(category));
            }
        }
        
        // 地区筛选
        if (region && region !== 'all') {
            if (region === '双支持') {
                tools = tools.filter(tool => 
                    tool.region_support && tool.region_support.length > 1
                );
            } else {
                tools = tools.filter(tool => 
                    tool.region === region || 
                    (tool.region_support && tool.region_support.includes(region))
                );
            }
        }
        
        // 价格筛选
        if (price && price !== 'all') {
            tools = tools.filter(tool => tool.price.includes(price));
        }
        
        // 搜索筛选
        if (search) {
            const searchTerm = search.toLowerCase();
            tools = tools.filter(tool => 
                tool.name.toLowerCase().includes(searchTerm) ||
                tool.description.toLowerCase().includes(searchTerm) ||
                tool.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // 排序
        tools.sort((a, b) => {
            switch (sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'newest':
                    return new Date(b.updated_at) - new Date(a.updated_at);
                case 'rating':
                default:
                    return b.rating - a.rating;
            }
        });
        
        // 分页
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedTools = tools.slice(startIndex, endIndex);
        
        res.json({
            tools: paginatedTools,
            total: tools.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(tools.length / parseInt(limit))
        });
    } catch (error) {
        console.error('获取工具列表失败:', error);
        res.status(500).json({ error: '获取工具列表失败' });
    }
});

// 获取工具分类
app.get('/api/tools/categories', (req, res) => {
    try {
        const categories = readData(TOOL_CATEGORIES_FILE);
        res.json(categories);
    } catch (error) {
        console.error('获取工具分类失败:', error);
        res.status(500).json({ error: '获取工具分类失败' });
    }
});

// 获取单个工具详情
app.get('/api/tools/:id', (req, res) => {
    try {
        const { id } = req.params;
        const tools = readData(TOOLS_FILE);
        const tool = tools.find(t => t.id === id);
        
        if (!tool) {
            return res.status(404).json({ error: '工具不存在' });
        }
        
        res.json(tool);
    } catch (error) {
        console.error('获取工具详情失败:', error);
        res.status(500).json({ error: '获取工具详情失败' });
    }
});

// 添加工具（管理员）
app.post('/api/tools', authenticateToken, (req, res) => {
    try {
        const { name, description, categories, subcategories, region, region_support, language, price, website, tags } = req.body;
        
        if (!name || !description || !website) {
            return res.status(400).json({ error: '缺少必填字段' });
        }
        
        const tools = readData(TOOLS_FILE);
        const newTool = {
            id: `tool_${Date.now()}`,
            name,
            slug: generateSlug(name),
            description,
            categories: categories || [],
            subcategories: subcategories || [],
            region: region || '国际',
            region_support: region_support || [region || '国际'],
            language: language || ['英文'],
            price: price || '免费',
            rating: 0,
            website,
            logo: `${generateSlug(name)}.png`,
            tags: tags || [],
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        tools.push(newTool);
        
        if (writeData(TOOLS_FILE, tools)) {
            res.json({ message: '工具添加成功', tool: newTool });
        } else {
            res.status(500).json({ error: '添加工具失败' });
        }
    } catch (error) {
        console.error('添加工具失败:', error);
        res.status(500).json({ error: '添加工具失败' });
    }
});

// 更新工具（管理员）
app.put('/api/tools/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const tools = readData(TOOLS_FILE);
        
        const index = tools.findIndex(t => t.id === id);
        if (index === -1) {
            return res.status(404).json({ error: '工具不存在' });
        }
        
        tools[index] = {
            ...tools[index],
            ...updateData,
            updated_at: new Date().toISOString()
        };
        
        if (writeData(TOOLS_FILE, tools)) {
            res.json({ message: '工具更新成功', tool: tools[index] });
        } else {
            res.status(500).json({ error: '更新工具失败' });
        }
    } catch (error) {
        console.error('更新工具失败:', error);
        res.status(500).json({ error: '更新工具失败' });
    }
});

// 删除工具（管理员）
app.delete('/api/tools/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const tools = readData(TOOLS_FILE);
        
        const index = tools.findIndex(t => t.id === id);
        if (index === -1) {
            return res.status(404).json({ error: '工具不存在' });
        }
        
        tools.splice(index, 1);
        
        if (writeData(TOOLS_FILE, tools)) {
            res.json({ message: '工具删除成功' });
        } else {
            res.status(500).json({ error: '删除工具失败' });
        }
    } catch (error) {
        console.error('删除工具失败:', error);
        res.status(500).json({ error: '删除工具失败' });
    }
});

// 批量导入工具（管理员）
app.post('/api/tools/batch', authenticateToken, (req, res) => {
    try {
        const { tools: newTools } = req.body;
        
        if (!Array.isArray(newTools)) {
            return res.status(400).json({ error: '数据格式错误' });
        }
        
        const existingTools = readData(TOOLS_FILE);
        const processedTools = [];
        
        newTools.forEach(tool => {
            const processedTool = {
                id: tool.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: tool.name,
                slug: tool.slug || generateSlug(tool.name),
                description: tool.description,
                categories: tool.categories || [],
                subcategories: tool.subcategories || [],
                region: tool.region || '国际',
                region_support: tool.region_support || [tool.region || '国际'],
                language: tool.language || ['英文'],
                price: tool.price || '免费',
                rating: tool.rating || 0,
                website: tool.website,
                logo: tool.logo || `${generateSlug(tool.name)}.png`,
                tags: tool.tags || [],
                featured: tool.featured || false,
                created_at: tool.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            processedTools.push(processedTool);
        });
        
        const updatedTools = [...existingTools, ...processedTools];
        
        if (writeData(TOOLS_FILE, updatedTools)) {
            res.json({ 
                message: `成功导入 ${processedTools.length} 个工具`,
                count: processedTools.length
            });
        } else {
            res.status(500).json({ error: '批量导入失败' });
        }
    } catch (error) {
        console.error('批量导入工具失败:', error);
        res.status(500).json({ error: '批量导入工具失败' });
    }
});

// 上传工具Logo（管理员）
app.post('/api/tools/upload-logo', authenticateToken, (req, res) => {
    // 这里需要配置multer来处理文件上传
    // 暂时返回成功响应
    res.json({ message: 'Logo上传功能待实现' });
});

// =====================================================
// SiliconFlow API Proxy 硅基流动API代理
// =====================================================

// 从文件读取系统提示词
const SYSTEM_PROMPT_FILE = path.join(__dirname, 'config', 'system-prompt.txt');

let SYSTEM_PROMPT = '';

// 启动时读取提示词文件
try {
    if (fs.existsSync(SYSTEM_PROMPT_FILE)) {
        SYSTEM_PROMPT = fs.readFileSync(SYSTEM_PROMPT_FILE, 'utf8');
        console.log('✅ 系统提示词已加载: config/system-prompt.txt');
    } else {
        console.warn('⚠️  系统提示词文件不存在，使用默认提示词');
        SYSTEM_PROMPT = '你是一个专业的AI助手，擅长回答用户关于AI、人工智能、机器学习等相关问题。请用简洁、准确、专业的方式回答。';
    }
} catch (error) {
    console.error('❌ 读取系统提示词文件失败:', error.message);
    SYSTEM_PROMPT = '你是一个专业的AI助手，擅长回答用户关于AI、人工智能、机器学习等相关问题。请用简洁、准确、专业的方式回答。';
}

// AI搜索接口（代理到阿里云百炼 Qwen API - 支持流式输出）
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { query, temperature = 0.7, max_tokens = 4000, stream = true } = req.body;

        // 验证环境变量 - 使用阿里云百炼API
        const apiKey = process.env.QWEN_API_KEY;
        const apiUrl = process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        const model = process.env.QWEN_MODEL || 'qwen-plus';

        if (!apiKey || apiKey === 'sk-your-qwen-api-key-here') {
            return res.status(500).json({
                error: 'API_KEY未配置',
                message: '请在 .env 文件中配置 QWEN_API_KEY'
            });
        }

        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: '参数错误',
                message: 'query 参数必须是非空字符串'
            });
        }

        // 构建消息数组（系统提示词 + 用户问题）
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: query.trim()
            }
        ];

        // 流式输出：设置SSE响应头
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.flushHeaders();

            try {
                // 调用阿里云百炼 Qwen API（流式）
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature,
                        max_tokens,
                        stream: true,
                        stream_options: {
                            include_usage: true
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    res.write(`data: ${JSON.stringify({ error: errorData.message || 'API请求失败' })}\n\n`);
                    res.end();
                    return;
                }

                // 读取流式响应
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                // 转发给前端
                                res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }

                res.end();

            } catch (error) {
                console.error('流式API调用错误:', error);
                res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
                res.end();
            }
        } else {
            // 非流式模式（保持原有逻辑）
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return res.status(response.status).json({
                    error: 'API请求失败',
                    message: errorData.message || `HTTP ${response.status}`,
                    details: errorData
                });
            }

            const data = await response.json();
            res.json(data);
        }

    } catch (error) {
        console.error('AI搜索错误:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: '服务器错误',
                message: error.message
            });
        }
    }
});

// 生成slug的辅助函数
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// =====================================================
// 日报API Routes
// =====================================================

// 获取日报列表
app.get('/api/reports', (req, res) => {
    try {
        const reportsDir = path.join(__dirname, 'reports-archive');
        const reports = [];

        if (fs.existsSync(reportsDir)) {
            const files = fs.readdirSync(reportsDir)
                .filter(file => file.endsWith('.html'))
                .sort((a, b) => b.localeCompare(a)); // 按日期降序

            files.forEach(file => {
                const filePath = path.join(reportsDir, file);
                const stats = fs.statSync(filePath);

                // 提取日期
                const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
                const date = dateMatch ? dateMatch[1] : '未知日期';

                reports.push({
                    filename: file,
                    title: `AI日报 - ${date}`,
                    date: date,
                    size: stats.size,
                    created_at: stats.mtime.toISOString()
                });
            });
        }

        res.json(reports);
    } catch (error) {
        console.error('获取日报列表失败:', error);
        res.status(500).json({ error: '获取日报列表失败' });
    }
});

// 获取日报HTML内容
app.get('/api/reports/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'reports-archive', filename);

        // 安全检查：防止路径遍历攻击
        if (!filename.endsWith('.html') || filename.includes('..')) {
            return res.status(400).json({ error: '无效的文件名' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '日报文件不存在' });
        }

        const html = fs.readFileSync(filePath, 'utf-8');
        res.send(html);
    } catch (error) {
        console.error('读取日报失败:', error);
        res.status(500).json({ error: '读取日报失败' });
    }
});

// 初始化数据文件
initDataFiles();

// 启动服务器
// 云服务器版本：监听所有网络接口（0.0.0.0）以允许外部访问
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}`);
    if (HOST === '0.0.0.0') {
        console.log(`🌐 如果是云服务器，请使用公网IP或域名访问`);
        console.log(`📡 例如: http://YOUR_SERVER_IP:${PORT}`);
    }
    console.log('API文档:');
    console.log('  POST /api/auth/login - 管理员登录');
    console.log('  GET  /api/keywords - 获取关键词列表');
    console.log('  POST /api/keywords/batch - 批量导入关键词');
    console.log('  DELETE /api/keywords/:id - 删除关键词');
    console.log('  GET  /api/news - 获取新闻列表（支持配置数量）');
    console.log('  POST /api/news/batch - 批量导入新闻（自动归档）');
    console.log('  DELETE /api/news/:id - 删除新闻');
    console.log('  GET  /api/news/template - 下载今日资讯模板');
    console.log('  GET  /api/weekly-news - 获取每周资讯列表（支持分类筛选）');
    console.log('  GET  /api/weekly-news/template - 下载每周资讯模板');
    console.log('  POST /api/weekly-news - 创建每周资讯');
    console.log('  PUT  /api/weekly-news/:id - 更新每周资讯');
    console.log('  DELETE /api/weekly-news/:id - 删除每周资讯');
    console.log('  POST /api/weekly-news/batch - 批量导入每周资讯（自动归档）');
    console.log('  GET  /api/stats - 获取统计数据');
    console.log('  GET  /api/settings - 获取系统设置');
    console.log('  POST /api/settings - 更新系统设置');
    console.log('  GET  /api/archive/dates - 获取历史日期列表');
    console.log('  GET  /api/archive/:date - 获取指定日期历史数据');
    console.log('  DELETE /api/archive/:date - 删除指定日期历史数据');
    console.log('  GET  /api/tools - 获取AI工具列表（支持筛选和分页）');
    console.log('  GET  /api/tools/categories - 获取工具分类');
    console.log('  GET  /api/tools/:id - 获取单个工具详情');
    console.log('  POST /api/tools - 添加工具（管理员）');
    console.log('  PUT  /api/tools/:id - 更新工具（管理员）');
    console.log('  DELETE /api/tools/:id - 删除工具（管理员）');
    console.log('  POST /api/tools/batch - 批量导入工具（管理员）');
    console.log('  POST /api/tools/upload-logo - 上传工具Logo（管理员）');
    console.log('');
    console.log('默认管理员账户:');
    console.log('  用户名: admin');
    console.log('  密码: admin123456');
});

