#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
    createPodcastEmailService
} = require('../server/services/podcast-email');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_METADATA_DIR = process.env.PODCAST_METADATA_DIR || path.join(ROOT_DIR, 'data', 'podcasts', 'news');
const DEFAULT_STATE_FILE = process.env.PODCAST_EMAIL_STATE_FILE || path.join(ROOT_DIR, 'data', 'podcast-email-state.json');
const DEFAULT_TIMEZONE = process.env.PODCAST_EMAIL_TIMEZONE || 'Asia/Shanghai';

function readJsonFileSafe(filePath, fallbackValue = null) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallbackValue;
    }
}

function getArg(flag) {
    const index = process.argv.indexOf(flag);
    return index === -1 ? null : (process.argv[index + 1] || null);
}

function getCurrentDateInfo(timeZone, now = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = Object.fromEntries(
        formatter.formatToParts(now).map((part) => [part.type, part.value])
    );

    return {
        date: `${parts.year}-${parts.month}-${parts.day}`
    };
}

async function runPodcastEmailOnce(options = {}) {
    const metadataDir = options.metadataDir || getArg('--metadata-dir') || DEFAULT_METADATA_DIR;
    const stateFile = options.stateFile || getArg('--state-file') || DEFAULT_STATE_FILE;
    const timeZone = options.timeZone || getArg('--timezone') || DEFAULT_TIMEZONE;
    const now = options.now || new Date();
    const dateInfo = getCurrentDateInfo(timeZone, now);
    const metadataPath = path.join(metadataDir, `${dateInfo.date}.json`);

    if (!fs.existsSync(metadataPath)) {
        return {
            ok: true,
            action: 'skip',
            reason: 'podcast_missing_today',
            date: dateInfo.date
        };
    }

    const metadata = readJsonFileSafe(metadataPath, null);
    if (!metadata || metadata.status !== 'ready') {
        return {
            ok: true,
            action: 'skip',
            reason: 'podcast_not_ready',
            date: dateInfo.date
        };
    }

    const podcastEmailService = options.podcastEmailService || createPodcastEmailService({
        metadataDir,
        stateFile
    });

    const result = await podcastEmailService.sendReadyPodcastEmail({
        date: dateInfo.date,
        metadata
    });

    return {
        ok: true,
        date: dateInfo.date,
        ...result
    };
}

if (require.main === module) {
    runPodcastEmailOnce()
        .then((result) => {
            console.log(`[podcast-email] ${JSON.stringify(result)}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error(`[podcast-email] failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = {
    getCurrentDateInfo,
    runPodcastEmailOnce
};
