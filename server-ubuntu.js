// Ubuntu云服务器版本配置
// 在server-json.js基础上做的云服务器适配

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 【关键修改1】从环境变量或使用0.0.0.0监听所有接口
const HOST = process.env.HOST || '0.0.0.0';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required.');
}

// ... (其余代码与server-json.js相同，只是把最后的listen改为)

// 启动服务器 - 【关键修改2】监听所有网络接口
app.listen(PORT, HOST, () => {
    console.log(`✅ 服务器成功启动！`);
    console.log(`🌐 访问地址: http://${HOST}:${PORT}`);
    console.log(`📡 如果是云服务器，使用公网IP访问: http://YOUR_PUBLIC_IP:${PORT}`);
    console.log('');
    console.log('API端点:');
    console.log('  POST /api/auth/login - 管理员登录');
    console.log('  GET  /api/news - 获取新闻列表');
    console.log('  POST /api/news/batch - 批量导入新闻');
    console.log('  ... (其他API端点)');
});
