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

    app.use(cors());
    app.use(express.json());

    if (staticRoot) {
        const resolvedStaticRoot = path.resolve(rootDir, staticRoot);
        if (fs.existsSync(resolvedStaticRoot)) {
            app.use(express.static(resolvedStaticRoot));
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
