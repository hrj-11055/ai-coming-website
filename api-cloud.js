// 云服务器版本API配置
class ApiService {
    constructor() {
        // 【关键修改】云服务器使用相对路径或动态获取服务器地址
        // 方案1: 使用相对路径（推荐，适用于前后端同域）
        this.baseURL = '/api';

        // 方案2: 动态获取服务器地址（适用于跨域）
        // this.baseURL = `${window.location.protocol}//${window.location.hostname}:3000/api`;

        // 方案3: 使用环境变量
        // this.baseURL = process.env.REACT_APP_API_URL || '/api';
    }

    // ... 其余方法保持不变
}

// 保持原有的完整实现
if (typeof window !== 'undefined') {
    window.apiService = new ApiService();
    window.ApiService = ApiService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}
