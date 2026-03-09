const fs = require('fs');

// 内存缓存配置
const CACHE_CONFIG = {
    visitLogs: { maxSize: 10000, flushInterval: 60000 },    // 访问日志：最多缓存10000条，每分钟刷盘
    apiCalls: { maxSize: 5000, flushInterval: 30000 },      // API调用：最多缓存5000条，每30秒刷盘
    bannedIps: { maxSize: 1000, flushInterval: 60000 }       // 封禁IP：最多缓存1000条，每分钟刷盘
};

// 内存缓存存储
const memoryCache = new Map();

// 缓存脏标记
const dirtyCache = new Map();

function createJsonFileStore() {
    // 从文件读取并初始化缓存
    function loadToCache(filePath, cacheKey) {
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
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                return true;
            } catch (error) {
                console.error(`写入文件 ${filePath} 失败:`, error);
                return false;
            }
        }

        // 使用缓存
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
                const filePath = getFilePathForCache(key);
                if (filePath) flushToFile(filePath, key);
            }
        } else {
            const filePath = getFilePathForCache(cacheKey);
            if (filePath) flushToFile(filePath, cacheKey);
        }
    }

    // 获取缓存键对应的文件路径
    function getFilePathForCache(cacheKey) {
        const pathMap = {
            'visit-logs': 'data/visit-logs.json',
            'api-calls': 'data/api-calls.json',
            'banned-ips': 'data/banned-ips.json'
        };
        return pathMap[cacheKey];
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

function startCacheScheduler() {
    if (flushInterval) return;

    flushInterval = setInterval(() => {
        const fileStore = createJsonFileStore();
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
    startCacheScheduler,
    stopCacheScheduler
};
