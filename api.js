/**
 * API服务�?- 统一管理所有API调用
 * 替换localStorage，使用真正的服务器端存储
 */

class ApiService {
    constructor() {
        // 自动检测环境：云服务器使用相对路径，本地开发使用localhost
        const isCloudServer = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.baseURL = isCloudServer ? '/api' : 'http://localhost:3000/api';
        this.token = localStorage.getItem('admin_token');
    }

    // 设置认证令牌
    setToken(token) {
        this.token = token;
        localStorage.setItem('admin_token', token);
    }

    // 清除认证令牌
    clearToken() {
        this.token = null;
        localStorage.removeItem('admin_token');
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // 添加认证�?
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // 认证相关
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.success) {
            this.setToken(data.token);
        }
        
        return data;
    }

    // 关键词管�?
    async getKeywords() {
        return await this.request('/keywords');
    }

    async addKeyword(keyword) {
        return await this.request('/keywords', {
            method: 'POST',
            body: JSON.stringify(keyword)
        });
    }

    async updateKeyword(id, keyword) {
        return await this.request(`/keywords/${id}`, {
            method: 'PUT',
            body: JSON.stringify(keyword)
        });
    }

    async deleteKeyword(id) {
        return await this.request(`/keywords/${id}`, {
            method: 'DELETE'
        });
    }

    async batchImportKeywords(keywords) {
        return await this.request('/keywords/batch', {
            method: 'POST',
            body: JSON.stringify({ keywords })
        });
    }

    // 新闻管理
    async getNews(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/news?${queryString}` : '/news';
        return await this.request(endpoint);
    }

    async addNews(news) {
        return await this.request('/news', {
            method: 'POST',
            body: JSON.stringify(news)
        });
    }

    async updateNews(id, news) {
        return await this.request(`/news/${id}`, {
            method: 'PUT',
            body: JSON.stringify(news)
        });
    }

    async deleteNews(id) {
        return await this.request(`/news/${id}`, {
            method: 'DELETE'
        });
    }

    async batchImportNews(articles) {
        return await this.request('/news/batch', {
            method: 'POST',
            body: JSON.stringify({ articles })
        });
    }

    // 统计数据
    async getStats() {
        return await this.request('/stats');
    }

    // 设置管理
    async getSettings() {
        return await this.request('/settings');
    }

    async updateSettings(settings) {
        return await this.request('/settings', {
            method: 'POST',
            body: JSON.stringify(settings)
        });
    }

    // 历史数据管理
    async getArchiveDates(type = 'daily') {
        return await this.request(`/archive/dates?type=${type}`);
    }

    async getArchiveNews(date, type = 'daily') {
        return await this.request(`/archive/${date}?type=${type}`);
    }

    async deleteArchiveNews(date, type = 'daily') {
        return await this.request(`/archive/${date}?type=${type}`, {
            method: 'DELETE'
        });
    }

    // 每周资讯管理
    async getWeeklyNews(category = 'all', country = 'all', limit = null) {
        let url = '/weekly-news';
        const params = [];
        if (category !== 'all') params.push(`category=${category}`);
        if (country !== 'all') params.push(`country=${country}`);
        if (limit) params.push(`limit=${limit}`);
        if (params.length > 0) url += '?' + params.join('&');
        return await this.request(url);
    }

    async createWeeklyNews(article) {
        return await this.request('/weekly-news', {
            method: 'POST',
            body: JSON.stringify(article)
        });
    }

    async updateWeeklyNews(id, article) {
        return await this.request(`/weekly-news/${id}`, {
            method: 'PUT',
            body: JSON.stringify(article)
        });
    }

    async deleteWeeklyNews(id) {
        return await this.request(`/weekly-news/${id}`, {
            method: 'DELETE'
        });
    }

    async importWeeklyNews(articles) {
        return await this.request('/weekly-news/batch', {
            method: 'POST',
            body: JSON.stringify({ articles })
        });
    }

    // 导出模板
    async downloadDailyNewsTemplate() {
        await this.downloadTemplate('/news/template', 'daily-news-template.json');
    }

    async downloadWeeklyNewsTemplate() {
        await this.downloadTemplate('/weekly-news/template', 'weekly-news-template.json');
    }

    async downloadTemplate(endpoint, filename) {
        const headers = this.token ? { Authorization: `Bearer ${this.token}` } : {};
        const response = await fetch(`${this.baseURL}${endpoint}`, { headers });

        if (!response.ok) {
            throw new Error('Failed to download template');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // 数据备份
    async backupData() {
        return await this.request('/backup');
    }

    // 数据恢复
    async restoreData(data) {
        return await this.request('/restore', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// 创建全局API服务实例
window.apiService = new ApiService();

// 兼容性函�?- 保持与现有代码的兼容�?
window.loadKeywordsFromAPI = async function() {
    try {
        const keywords = await window.apiService.getKeywords();
        return keywords;
    } catch (error) {
        console.error('加载关键词失�?', error);
        return [];
    }
};

window.loadNewsFromAPI = async function(params = {}) {
    try {
        const news = await window.apiService.getNews(params);
        return news;
    } catch (error) {
        console.error('加载新闻失败:', error);
        return [];
    }
};

window.loadWeeklyNewsFromAPI = async function(params = {}) {
    try {
        const weeklyNews = await window.apiService.getWeeklyNews(params.category || 'all', params.country || 'all', params.limit);
        return weeklyNews;
    } catch (error) {
        console.error('加载每周资讯失败:', error);
        return [];
    }
};

window.saveKeywordsToAPI = async function(keywords) {
    try {
        await window.apiService.batchImportKeywords(keywords);
        return true;
    } catch (error) {
        console.error('保存关键词失�?', error);
        return false;
    }
};

window.saveNewsToAPI = async function(articles) {
    try {
        await window.apiService.batchImportNews(articles);
        return true;
    } catch (error) {
        console.error('保存新闻失败:', error);
        return false;
    }
};

// 导出API服务
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}



