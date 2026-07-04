const express = require('express');

function createHealthRouter() {
    const router = express.Router();

    router.get('/health', (_req, res) => {
        res.json({
            ok: true,
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString()
        });
    });

    return router;
}

module.exports = {
    createHealthRouter
};
