const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./app');
const { createAuthMiddleware } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const { generateId } = require('./utils/ids');
const { normalizeEnumParam } = require('./utils/validation');
const { createJsonFileStore, startCacheScheduler } = require('./services/file-store');
const { loadSystemPrompt, createAiConfigFromEnv, createWeeklyKeywordsAiConfigFromEnv } = require('./services/ai-proxy');
const { createAiUsageConfigFromEnv, createAiUsageService } = require('./services/ai-usage');
const { createWeeklyKeywordsJob } = require('./services/weekly-keywords');
const { createNewsPodcastService, createPodcastConfigFromEnv } = require('./services/news-podcast');
const { createPodcastEmailService } = require('./services/podcast-email');
const { createAuthRouter } = require('./routes/auth');
const { createSettingsRouter } = require('./routes/settings');
const { createKeywordsRouter } = require('./routes/keywords');
const { createNewsRouter } = require('./routes/news');
const { createVisitRouter } = require('./routes/visit');
const { createSecurityRuntime, createSecurityRouter } = require('./routes/security');
const { createToolsRouter } = require('./routes/tools');
const { createStatsRouter } = require('./routes/stats');
const { createMaintenanceRouter } = require('./routes/maintenance');
const { createArchiveRouter } = require('./routes/archive');
const { createTemplateRouter } = require('./routes/template');
const { createAiRouter } = require('./routes/ai');
const { createAiUsageRouter } = require('./routes/ai-usage');
const { createReportsRouter } = require('./routes/reports');
const { createPodcastRouter } = require('./routes/podcast');
const { startServer } = require('./start');

function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function createJsonRuntime({ rootDir, env = process.env }) {
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required.');
    }

    const dataDir = path.join(rootDir, 'data');
    const keywordsFile = path.join(dataDir, 'keywords.json');
    const newsFile = path.join(dataDir, 'news.json');
    const toolsFile = path.join(dataDir, 'tools.json');
    const toolCategoriesFile = path.join(dataDir, 'tool-categories.json');
    const adminsFile = path.join(dataDir, 'admins.json');
    const settingsFile = path.join(dataDir, 'settings.json');
    const visitLogsFile = path.join(dataDir, 'visit-logs.json');
    const apiCallsFile = path.join(dataDir, 'api-calls.json');
    const aiUsageLogsFile = path.join(dataDir, 'ai-usage-logs.json');
    const bannedIpsFile = path.join(dataDir, 'banned-ips.json');
    const keywordsWeeklyJobStateFile = path.join(dataDir, 'keywords-weekly-job.json');
    const archiveDir = path.join(dataDir, 'archive');
    const dailyArchiveDir = path.join(archiveDir, 'daily');
    const podcastDir = path.join(dataDir, 'podcasts');
    const podcastNewsDir = path.join(podcastDir, 'news');
    const logoDir = path.join(rootDir, 'logos');

    const app = createApp({
        rootDir,
        staticRoot: env.STATIC_ROOT
    });
    const fileStore = createJsonFileStore();

    for (const dir of [dataDir, archiveDir, dailyArchiveDir, podcastDir, podcastNewsDir, logoDir]) {
        ensureDirectory(dir);
    }

    function readData(filename) {
        return fileStore.readJson(filename, []);
    }

    function writeData(filename, data) {
        return fileStore.writeJson(filename, data);
    }

    function initDataFiles() {
        if (!fs.existsSync(keywordsFile)) {
            fs.writeFileSync(keywordsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(newsFile)) {
            fs.writeFileSync(newsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(toolsFile)) {
            fs.writeFileSync(toolsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(toolCategoriesFile)) {
            fs.writeFileSync(toolCategoriesFile, JSON.stringify([]));
        }
        if (!fs.existsSync(visitLogsFile)) {
            fs.writeFileSync(visitLogsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(apiCallsFile)) {
            fs.writeFileSync(apiCallsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(aiUsageLogsFile)) {
            fs.writeFileSync(aiUsageLogsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(bannedIpsFile)) {
            fs.writeFileSync(bannedIpsFile, JSON.stringify([]));
        }
        if (!fs.existsSync(keywordsWeeklyJobStateFile)) {
            fs.writeFileSync(keywordsWeeklyJobStateFile, JSON.stringify({}, null, 2));
        }

        if (!fs.existsSync(adminsFile)) {
            const username = env.DEFAULT_ADMIN_USERNAME;
            const password = env.DEFAULT_ADMIN_PASSWORD;

            if (username && password) {
                const role = env.DEFAULT_ADMIN_ROLE || 'super_admin';
                const saltRounds = Number(env.BCRYPT_SALT_ROUNDS || 10);
                const passwordHash = bcrypt.hashSync(password, saltRounds);
                const defaultAdmin = [{
                    id: 1,
                    username,
                    password_hash: passwordHash,
                    role,
                    created_at: new Date().toISOString()
                }];
                fs.writeFileSync(adminsFile, JSON.stringify(defaultAdmin, null, 2));
                console.log('Default admin ' + username + ' initialized in admins.json');
            } else {
                fs.writeFileSync(adminsFile, JSON.stringify([]));
                console.warn('Admins file created without bootstrap user because DEFAULT_ADMIN_USERNAME/DEFAULT_ADMIN_PASSWORD is unset.');
            }
        }

        if (!fs.existsSync(settingsFile)) {
            const defaultSettings = {
                todayNewsDisplayCount: 20,
                maxDisplayCount: 50,
                minDisplayCount: 1,
                autoArchiveEnabled: true,
                version: '1.0.0',
                lastUpdated: new Date().toISOString()
            };
            fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
        }
    }

    function archiveOldNews() {
        try {
            const news = readData(newsFile);
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
                const archiveFile = path.join(dailyArchiveDir, `news-${date}.json`);
                const existingArchive = fs.existsSync(archiveFile) ? readData(archiveFile) : [];
                const mergedNews = [...existingArchive, ...newsByDate[date]];
                writeData(archiveFile, mergedNews);
                console.log(`已归档 ${newsByDate[date].length} 篇每日资讯到 daily/news-${date}.json`);
            });

            writeData(newsFile, todayNews);
            console.log(`已清理news.json，保留 ${todayNews.length} 篇今日新闻`);

            return { archived: Object.keys(newsByDate).length, todayCount: todayNews.length };
        } catch (error) {
            console.error('归档新闻失败:', error);
            return { archived: 0, todayCount: 0 };
        }
    }

    function getArchiveDirByType(type) {
        if (type === 'daily') return dailyArchiveDir;
        return null;
    }

    function resolveSafeArchiveFile(archiveDirPath, archiveKey) {
        if (!/^[A-Za-z0-9_-]{1,80}$/.test(archiveKey)) {
            return null;
        }

        const archiveFile = path.resolve(archiveDirPath, `${archiveKey}.json`);
        const relative = path.relative(archiveDirPath, archiveFile);

        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            return null;
        }

        return archiveFile;
    }

    const authenticateToken = createAuthMiddleware(jwtSecret);
    const securityRuntime = createSecurityRuntime({
        readData,
        writeData,
        bannedIpsFile: bannedIpsFile,
        apiCallsFile: apiCallsFile
    });

    const systemPrompt = loadSystemPrompt(rootDir);
    const aiConfig = createAiConfigFromEnv(env);
    const aiUsageService = createAiUsageService({
        readData,
        writeData,
        usageFile: aiUsageLogsFile,
        config: createAiUsageConfigFromEnv(env, aiConfig),
        ipHashSalt: env.AI_USAGE_IP_HASH_SALT || jwtSecret
    });
    const weeklyKeywordsAiConfig = createWeeklyKeywordsAiConfigFromEnv(env);
    const podcastConfig = createPodcastConfigFromEnv(env);
    const podcastEmailService = createPodcastEmailService({
        metadataDir: podcastNewsDir
    });
    const weeklyKeywordsJob = createWeeklyKeywordsJob({
        readData,
        writeData,
        newsFile,
        keywordsFile,
        dailyArchiveDir,
        dataDir,
        aiConfig: weeklyKeywordsAiConfig,
        systemPrompt,
        stateFile: keywordsWeeklyJobStateFile,
        keywordCount: Number(env.WEEKLY_KEYWORDS_COUNT || 30),
        runHour: Number(env.WEEKLY_KEYWORDS_RUN_HOUR || 8),
        runMinute: Number(env.WEEKLY_KEYWORDS_RUN_MINUTE || 0),
        modelTimeoutMs: Number(env.WEEKLY_KEYWORDS_MODEL_TIMEOUT_MS || 25000)
    });
    const podcastService = createNewsPodcastService({
        readData,
        newsFile,
        dataDir,
        dailyArchiveDir,
        metadataDir: podcastNewsDir,
        config: podcastConfig,
        podcastEmailService
    });

    app.use(securityRuntime.checkIPBan);
    app.use(securityRuntime.monitorAPIRateLimit);

    app.use('/api', createAuthRouter({
        readData,
        adminsFile,
        jwtSecret
    }));
    app.use('/api', createSettingsRouter({
        readData,
        writeData,
        settingsFile,
        authenticateToken
    }));
    app.use('/api', createKeywordsRouter({
        readData,
        writeData,
        keywordsFile,
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
        newsFile,
        settingsFile,
        dataDir,
        dailyArchiveDir,
        podcastService
    }));
    app.use('/api', createVisitRouter({
        readData,
        writeData,
        visitLogsFile,
        authenticateToken
    }));
    app.use('/api', createToolsRouter({
        readData,
        writeData,
        toolsFile,
        toolCategoriesFile,
        authenticateToken
    }));
    app.use('/api', createSecurityRouter({
        readData,
        writeData,
        bannedIpsFile,
        apiCallsFile,
        authenticateToken
    }));
    app.use('/api', createStatsRouter({
        readData,
        keywordsFile,
        newsFile
    }));
    app.use('/api', createMaintenanceRouter({
        readData,
        writeData,
        keywordsFile,
        newsFile,
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
        aiConfig,
        aiUsageService
    }));
    app.use('/api', createAiUsageRouter({
        aiUsageService,
        authenticateToken
    }));
    app.use('/api', createReportsRouter({ rootDir }));
    app.use('/api', createPodcastRouter({ podcastService }));

    app.use(notFoundHandler);
    app.use(errorHandler);

    function start() {
        initDataFiles();

        setInterval(() => {
            securityRuntime.cleanupExpiredData();
        }, 3600000);
        weeklyKeywordsJob.startScheduler();

        if (env.WEEKLY_KEYWORDS_RUN_ON_STARTUP === 'true') {
            weeklyKeywordsJob.runOnce({ force: true }).catch((error) => {
                console.error('[weekly-keywords] 启动时执行失败:', error.message);
            });
        }

        startCacheScheduler();

        return startServer(app, {
            host: env.HOST || '0.0.0.0',
            port: env.PORT || 3000
        });
    }

    return {
        app,
        start
    };
}

function startJsonRuntime(options = {}) {
    const runtime = createJsonRuntime({
        rootDir: options.rootDir || path.resolve(__dirname, '..'),
        env: options.env || process.env
    });

    return runtime.start();
}

module.exports = {
    createJsonRuntime,
    startJsonRuntime
};
