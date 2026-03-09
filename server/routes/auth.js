const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function createAuthRouter({ readData, adminsFile, jwtSecret }) {
    const router = express.Router();

    // 管理员登录
    router.post('/auth/login', (req, res) => {
        // SECURITY FIX: 添加输入验证
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: '用户名和密码格式不正确' });
        }

        if (username.length > 50 || password.length > 100) {
            return res.status(400).json({ error: '用户名或密码长度超出限制' });
        }

        const admins = readData(adminsFile);
        // 防止空数组导致的问题
        if (!admins || !Array.isArray(admins)) {
            return res.status(500).json({ error: '服务器配置错误' });
        }

        const admin = admins.find(a => a.username === username);

        if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: admin.role },
            jwtSecret,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            user: {
                username: admin.username,
                role: admin.role
            }
        });
    });

    return router;
}

module.exports = {
    createAuthRouter
};
