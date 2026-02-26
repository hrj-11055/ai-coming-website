import {
    trackVisit,
    initKeywords,
    generateWordCloud,
    switchContentTab
} from './core-news.js';

function withTimeout(promise, timeoutMs, errorMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
        })
    ]);
}

export function initNewsPage() {
    if (window.__newsPageInitialized) {
        return;
    }
    window.__newsPageInitialized = true;

    // 页面加载时自动执行追踪
    trackVisit();

    document.addEventListener('DOMContentLoaded', function () {
        // 今日快讯与词云并行加载，提升首屏感知速度
        switchContentTab('today');

        // 保留旧行为：读取 localStorage 以兼容历史实现
        localStorage.getItem('ai_keywords_sync_data');
        localStorage.getItem('news_database');

        void (async () => {
            await withTimeout(initKeywords(), 2500, '关键词加载超时，使用兜底词云');
            const container = document.getElementById('keywordWall');
            if (container) {
                generateWordCloud();
            }
        })().catch((error) => {
            console.warn('关键词初始化走兜底路径:', error.message);
            const container = document.getElementById('keywordWall');
            if (container) {
                generateWordCloud();
            }
        })();
    });
}
