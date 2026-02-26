// Load environment variables from .env file
require('dotenv').config();

const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./server/app');
const { createAuthMiddleware } = require('./server/middleware/auth');
const { notFoundHandler, errorHandler } = require('./server/middleware/error');
const { generateId } = require('./server/utils/ids');
const { createJsonFileStore } = require('./server/services/file-store');
const { loadSystemPrompt, createAiConfigFromEnv, createWeeklyKeywordsAiConfigFromEnv } = require('./server/services/ai-proxy');
const { createWeeklyKeywordsJob } = require('./server/services/weekly-keywords');
const { createAuthRouter } = require('./server/routes/auth');
const { createSettingsRouter } = require('./server/routes/settings');
const { createKeywordsRouter } = require('./server/routes/keywords');
const { createNewsRouter } = require('./server/routes/news');
const { createVisitRouter } = require('./server/routes/visit');
const { createSecurityRuntime, createSecurityRouter } = require('./server/routes/security');
const { createToolsRouter } = require('./server/routes/tools');
const { createStatsRouter } = require('./server/routes/stats');
const { createMaintenanceRouter } = require('./server/routes/maintenance');
const { createArchiveRouter } = require('./server/routes/archive');
const { createTemplateRouter } = require('./server/routes/template');
const { createAiRouter } = require('./server/routes/ai');
const { createReportsRouter } = require('./server/routes/reports');
const { normalizeEnumParam } = require('./server/utils/validation');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required.');
}

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const KEYWORDS_FILE = path.join(DATA_DIR, 'keywords.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const TOOLS_FILE = path.join(DATA_DIR, 'tools.json');
const TOOL_CATEGORIES_FILE = path.join(DATA_DIR, 'tool-categories.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const VISIT_LOGS_FILE = path.join(DATA_DIR, 'visit-logs.json');
const API_CALLS_FILE = path.join(DATA_DIR, 'api-calls.json');
const BANNED_IPS_FILE = path.join(DATA_DIR, 'banned-ips.json');
const KEYWORDS_WEEKLY_JOB_STATE_FILE = path.join(DATA_DIR, 'keywords-weekly-job.json');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');
const DAILY_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'daily');
const LOGO_DIR = path.join(ROOT_DIR, 'logos');

const staticRoot = process.env.STATIC_ROOT;
const app = createApp({ rootDir: ROOT_DIR, staticRoot });
const fileStore = createJsonFileStore();

for (const dir of [DATA_DIR, ARCHIVE_DIR, DAILY_ARCHIVE_DIR, LOGO_DIR]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function initDataFiles() {
    if (!fs.existsSync(KEYWORDS_FILE)) {
        fs.writeFileSync(KEYWORDS_FILE, JSON.stringify([]));
    }
    if (!fs.existsSync(NEWS_FILE)) {
        fs.writeFileSync(NEWS_FILE, JSON.stringify([]));
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
    if (!fs.existsSync(KEYWORDS_WEEKLY_JOB_STATE_FILE)) {
        fs.writeFileSync(KEYWORDS_WEEKLY_JOB_STATE_FILE, JSON.stringify({}, null, 2));
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

function readData(filename) {
    return fileStore.readJson(filename, []);
}

function writeData(filename, data) {
    return fileStore.writeJson(filename, data);
}

function archiveOldNews() {
    try {
        const news = readData(NEWS_FILE);
        const today = new Date().toISOString().split('T')[0];

        const newsByDate = {};
        const todayNews = [];

        news.forEach((article) => {
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

        Object.keys(newsByDate).forEach((date) => {
            const archiveFile = path.join(DAILY_ARCHIVE_DIR, `news-${date}.json`);
            const existingArchive = fs.existsSync(archiveFile) ? readData(archiveFile) : [];
            const mergedNews = [...existingArchive, ...newsByDate[date]];
            writeData(archiveFile, mergedNews);
            console.log(`已归档 ${newsByDate[date].length} 篇每日资讯到 daily/news-${date}.json`);
        });

        writeData(NEWS_FILE, todayNews);
        console.log(`已清理news.json，保留 ${todayNews.length} 篇今日新闻`);

        return { archived: Object.keys(newsByDate).length, todayCount: todayNews.length };
    } catch (error) {
        console.error('归档新闻失败:', error);
        return { archived: 0, todayCount: 0 };
    }
}

function getArchiveDirByType(type) {
    if (type === 'daily') return DAILY_ARCHIVE_DIR;
    return null;
}

function resolveSafeArchiveFile(archiveDir, archiveKey) {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(archiveKey)) {
        return null;
    }

    const archiveFile = path.resolve(archiveDir, `${archiveKey}.json`);
    const relative = path.relative(archiveDir, archiveFile);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
    }

    return archiveFile;
}

const authenticateToken = createAuthMiddleware(JWT_SECRET);

const securityRuntime = createSecurityRuntime({
    readData,
    writeData,
    bannedIpsFile: BANNED_IPS_FILE,
    apiCallsFile: API_CALLS_FILE
});

const systemPrompt = loadSystemPrompt(ROOT_DIR);
const aiConfig = createAiConfigFromEnv(process.env);
const weeklyKeywordsAiConfig = createWeeklyKeywordsAiConfigFromEnv(process.env);
const weeklyKeywordsJob = createWeeklyKeywordsJob({
    readData,
    writeData,
    newsFile: NEWS_FILE,
    keywordsFile: KEYWORDS_FILE,
    dailyArchiveDir: DAILY_ARCHIVE_DIR,
    dataDir: DATA_DIR,
    aiConfig: weeklyKeywordsAiConfig,
    systemPrompt,
    stateFile: KEYWORDS_WEEKLY_JOB_STATE_FILE,
    keywordCount: Number(process.env.WEEKLY_KEYWORDS_COUNT || 30),
    runHour: Number(process.env.WEEKLY_KEYWORDS_RUN_HOUR || 8),
    runMinute: Number(process.env.WEEKLY_KEYWORDS_RUN_MINUTE || 0),
    modelTimeoutMs: Number(process.env.WEEKLY_KEYWORDS_MODEL_TIMEOUT_MS || 25000)
});

app.use(securityRuntime.checkIPBan);
app.use(securityRuntime.monitorAPIRateLimit);

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
    generateId,
    refreshWeeklyKeywords: () => weeklyKeywordsJob.runOnce({ force: true })
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
app.use('/api', createVisitRouter({
    readData,
    writeData,
    visitLogsFile: VISIT_LOGS_FILE,
    authenticateToken
}));
app.use('/api', createToolsRouter({
    readData,
    writeData,
    toolsFile: TOOLS_FILE,
    toolCategoriesFile: TOOL_CATEGORIES_FILE,
    authenticateToken
}));
app.use('/api', createSecurityRouter({
    readData,
    writeData,
    bannedIpsFile: BANNED_IPS_FILE,
    apiCallsFile: API_CALLS_FILE,
    authenticateToken
}));
app.use('/api', createStatsRouter({
    readData,
    keywordsFile: KEYWORDS_FILE,
    newsFile: NEWS_FILE
}));
app.use('/api', createMaintenanceRouter({
    readData,
    writeData,
    keywordsFile: KEYWORDS_FILE,
    newsFile: NEWS_FILE,
    authenticateToken
}));
app.use('/api', createArchiveRouter({
    readData,
    authenticateToken,
    normalizeEnumParam,
    getArchiveDirByType,
    resolveSafeArchiveFile
}));
app.use('/api', createTemplateRouter());
app.use('/api', createAiRouter({
    systemPrompt,
    aiConfig
}));
app.use('/api', createReportsRouter({ rootDir: ROOT_DIR }));

setInterval(() => {
    securityRuntime.cleanupExpiredData();
}, 3600000);
weeklyKeywordsJob.startScheduler();

app.use(notFoundHandler);
app.use(errorHandler);

initDataFiles();

if (process.env.WEEKLY_KEYWORDS_RUN_ON_STARTUP === 'true') {
    weeklyKeywordsJob.runOnce({ force: true }).catch((error) => {
        console.error('[weekly-keywords] 启动时执行失败:', error.message);
    });
}

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}`);
    if (HOST === '0.0.0.0') {
        console.log('🌐 如果是云服务器，请使用公网IP或域名访问');
        console.log(`📡 例如: http://YOUR_SERVER_IP:${PORT}`);
    }
    console.log('API文档:');
    console.log('  POST /api/auth/login - 管理员登录');
    console.log('  GET  /api/keywords - 获取关键词列表');
    console.log('  POST /api/keywords/refresh-weekly - 手动刷新上周词云关键词（管理员）');
    console.log('  POST /api/keywords/batch - 批量导入关键词');
    console.log('  DELETE /api/keywords/:id - 删除关键词');
    console.log('  GET  /api/news - 获取新闻列表（支持配置数量）');
    console.log('  POST /api/news/batch - 批量导入新闻（自动归档）');
    console.log('  DELETE /api/news/:id - 删除新闻');
    console.log('  GET  /api/news/template - 下载今日资讯模板');
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
