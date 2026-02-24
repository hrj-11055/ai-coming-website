const jwt = require('jsonwebtoken');

/**
 * Build JWT auth middleware with injected secret.
 */
function createAuthMiddleware(jwtSecret) {
    return function authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: '访问令牌缺失' });
        }

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ error: '访问令牌无效' });
            }
            req.user = user;
            next();
        });
    };
}

module.exports = {
    createAuthMiddleware
};
