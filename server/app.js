const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

/**
 * Create and configure express app with shared middleware/static hosting.
 * This keeps runtime behavior aligned with previous server-json.js setup.
 */
function normalizeTrustProxy(value) {
    const normalized = String(value ?? '').trim();
    if (!normalized) return 'loopback';
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    if (/^\d+$/.test(normalized)) return Number(normalized);
    return normalized;
}

function createCorsOptions(allowedOriginsValue) {
    const allowedOrigins = new Set(
        String(allowedOriginsValue || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    );

    return {
        origin(origin, callback) {
            if (!origin || allowedOrigins.has(origin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        }
    };
}

function createApp({ rootDir, staticRoot, trustProxy, corsAllowedOrigins, jsonBodyLimit = '64kb' }) {
    const app = express();
    const longCacheExtensions = new Set([
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.webp',
        '.avif',
        '.ico'
    ]);

    function setStaticCacheHeaders(res, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.html' || ext === '.js' || ext === '.css') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            return;
        }

        if (longCacheExtensions.has(ext)) {
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        }
    }

    app.set('trust proxy', normalizeTrustProxy(trustProxy));
    app.use(cors(createCorsOptions(corsAllowedOrigins)));
    app.use(express.json({ limit: jsonBodyLimit }));

    if (staticRoot) {
        const resolvedStaticRoot = path.resolve(rootDir, staticRoot);
        if (fs.existsSync(resolvedStaticRoot)) {
            app.use(express.static(resolvedStaticRoot, {
                cacheControl: false,
                setHeaders: setStaticCacheHeaders
            }));
            console.log('Serving static files from ' + resolvedStaticRoot);
        } else {
            console.warn('STATIC_ROOT ' + resolvedStaticRoot + ' not found; static hosting disabled.');
        }
    }

    return app;
}

module.exports = {
    createCorsOptions,
    normalizeTrustProxy,
    createApp
};
