#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { createJsonFileStore } = require('../server/services/file-store');
const { loadSystemPrompt, createWeeklyKeywordsAiConfigFromEnv } = require('../server/services/ai-proxy');
const { createWeeklyKeywordsJob } = require('../server/services/weekly-keywords');

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const KEYWORDS_FILE = path.join(DATA_DIR, 'keywords.json');
const NEWS_FILE = path.join(DATA_DIR, 'news.json');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');
const DAILY_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'daily');
const STATE_FILE = path.join(DATA_DIR, 'keywords-weekly-job.json');

for (const dir of [DATA_DIR, ARCHIVE_DIR, DAILY_ARCHIVE_DIR]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

if (!fs.existsSync(KEYWORDS_FILE)) {
    fs.writeFileSync(KEYWORDS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2));
}

const fileStore = createJsonFileStore();
const readData = (filename) => fileStore.readJson(filename, []);
const writeData = (filename, data) => fileStore.writeJson(filename, data);

const systemPrompt = loadSystemPrompt(ROOT_DIR);
const aiConfig = createWeeklyKeywordsAiConfigFromEnv(process.env);

const job = createWeeklyKeywordsJob({
    readData,
    writeData,
    newsFile: NEWS_FILE,
    keywordsFile: KEYWORDS_FILE,
    dailyArchiveDir: DAILY_ARCHIVE_DIR,
    dataDir: DATA_DIR,
    aiConfig,
    systemPrompt,
    stateFile: STATE_FILE,
    keywordCount: Number(process.env.WEEKLY_KEYWORDS_COUNT || 30),
    runHour: Number(process.env.WEEKLY_KEYWORDS_RUN_HOUR || 8),
    runMinute: Number(process.env.WEEKLY_KEYWORDS_RUN_MINUTE || 0),
    modelTimeoutMs: Number(process.env.WEEKLY_KEYWORDS_MODEL_TIMEOUT_MS || 25000)
});

job.runOnce({ force: true })
    .then((result) => {
        console.log('[weekly-keywords:once] result:', JSON.stringify(result));
        process.exit(0);
    })
    .catch((error) => {
        console.error('[weekly-keywords:once] failed:', error.message);
        process.exit(1);
    });
