const fs = require('fs');
const path = require('path');

// 内存缓存配置
const CACHE_CONFIG = {
    visitLogs: { maxSize: 10000, flushInterval: 60000 },    // 访问日志：最多缓存10000条，每分钟刷盘
    apiCalls: { maxSize: 5000, flushInterval: 30000 },      // API调用：最多缓存5000条，每30秒刷盘
    bannedIps: { maxSize: 1000, flushInterval: 60000 }       // 封禁IP：最多缓存1000条，每分钟刷盘
};

function writeJsonAtomic(filePath, data) {
    const directory = path.dirname(filePath);
    const temporaryFile = path.join(
        directory,
        `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
    );

    fs.mkdirSync(directory, { recursive: true });

    try {
        fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(temporaryFile, filePath);
    } catch (error) {
        try {
            if (fs.existsSync(temporaryFile)) {
                fs.unlinkSync(temporaryFile);
            }
        } catch {
            // Preserve the original write error.
        }
        throw error;
    }
}

function createJsonFileStore() {
    const memoryCache = new Map();
    const dirtyCache = new Map();
    const cacheFiles = new Map();

    // 从文件读取并初始化缓存
    function loadToCache(filePath, cacheKey) {
        cacheFiles.set(cacheKey, filePath);
        if (!memoryCache.has(cacheKey)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                memoryCache.set(cacheKey, JSON.parse(data));
                dirtyCache.set(cacheKey, false);
            } catch (error) {
                console.error(`加载缓存 ${filePath} 失败:`, error);
                memoryCache.set(cacheKey, []);
                dirtyCache.set(cacheKey, false);
            }
        }
        return memoryCache.get(cacheKey);
    }

    // 刷盘
    function flushToFile(filePath, cacheKey) {
        if (dirtyCache.get(cacheKey)) {
            const data = memoryCache.get(cacheKey) || [];
            try {
                writeJsonAtomic(filePath, data);
                dirtyCache.set(cacheKey, false);
                console.log(`[Cache] 已刷盘 ${cacheKey}: ${data.length} 条记录`);
            } catch (error) {
                console.error(`刷盘 ${filePath} 失败:`, error);
            }
        }
    }

    function readJson(filePath, fallbackValue = [], cacheKey = null) {
        // 如果没有指定缓存键，直接从文件读取（兼容旧代码）
        if (!cacheKey) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                console.error(`读取文件 ${filePath} 失败:`, error);
                return fallbackValue;
            }
        }

        // 使用缓存
        if (!memoryCache.has(cacheKey)) {
            loadToCache(filePath, cacheKey);
        }
        return memoryCache.get(cacheKey);
    }

    function writeJson(filePath, data, cacheKey = null) {
        // 如果没有指定缓存键，直接写入文件（兼容旧代码）
        if (!cacheKey) {
            try {
                writeJsonAtomic(filePath, data);
                return true;
            } catch (error) {
                console.error(`写入文件 ${filePath} 失败:`, error);
                return false;
            }
        }

        // 使用缓存
        cacheFiles.set(cacheKey, filePath);
        memoryCache.set(cacheKey, data);
        dirtyCache.set(cacheKey, true);

        // 检查是否需要触发刷盘（数据量过大时）
        if (data.length > (CACHE_CONFIG[cacheKey]?.maxSize || 10000)) {
            flushToFile(filePath, cacheKey);
        }

        return true;
    }

    // 强制刷盘
    function flushCache(cacheKey) {
        if (!cacheKey) {
            // 刷盘所有缓存
            for (const [key] of memoryCache) {
                const filePath = cacheFiles.get(key);
                if (filePath) flushToFile(filePath, key);
            }
        } else {
            const filePath = cacheFiles.get(cacheKey);
            if (filePath) flushToFile(filePath, cacheKey);
        }
    }

    return {
        readJson,
        writeJson,
        flushCache,
        // 便捷方法：读取为缓存模式
        readJsonCached: (filePath, cacheKey) => readJson(filePath, [], cacheKey)
    };
}

// 定时刷盘任务
let flushInterval = null;

function startCacheScheduler(fileStore) {
    if (flushInterval) return;
    if (!fileStore || typeof fileStore.flushCache !== 'function') {
        throw new Error('startCacheScheduler requires a file store instance.');
    }

    flushInterval = setInterval(() => {
        fileStore.flushCache('visit-logs');
        fileStore.flushCache('api-calls');
        fileStore.flushCache('banned-ips');
    }, 30000); // 每30秒检查刷盘

    console.log('[Cache] 缓存刷盘任务已启动');
}

function stopCacheScheduler() {
    if (flushInterval) {
        clearInterval(flushInterval);
        flushInterval = null;
    }
}

module.exports = {
    createJsonFileStore,
    writeJsonAtomic,
    startCacheScheduler,
    stopCacheScheduler
};
