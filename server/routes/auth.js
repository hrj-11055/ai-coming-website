const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

function createAuthRouter({ readData, adminsFile, jwtSecret }) {
    const router = express.Router();

    // 管理员登录
    router.post('/auth/login', (req, res) => {
        const { username, password } = req.body;
        const admins = readData(adminsFile);
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
