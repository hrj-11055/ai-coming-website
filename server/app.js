const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

/**
 * Create and configure express app with shared middleware/static hosting.
 * This keeps runtime behavior aligned with previous server-json.js setup.
 */
function createApp({ rootDir, staticRoot }) {
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

    app.use(cors());
    app.use(express.json());

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
    createApp
};
