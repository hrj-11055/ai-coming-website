#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const DEFAULT_REPORT_DIR = process.env.PODCAST_SCRIPT_INPUT_DIR || '/var/www/json/report';
const DEFAULT_METADATA_DIR = process.env.PODCAST_METADATA_DIR || path.join(ROOT_DIR, 'data', 'podcasts', 'news');
const DEFAULT_STATE_FILE = process.env.PODCAST_AUTOGEN_STATE_FILE || path.join(ROOT_DIR, 'data', 'podcast-autogen-state.json');
const DEFAULT_API_BASE_URL = process.env.PODCAST_AUTOGEN_API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
const DEFAULT_TIMEZONE = process.env.PODCAST_AUTOGEN_TIMEZONE || 'Asia/Shanghai';
const DEFAULT_START_HOUR = Number(process.env.PODCAST_AUTOGEN_START_HOUR || 9);
const DEFAULT_START_MINUTE = Number(process.env.PODCAST_AUTOGEN_START_MINUTE || 5);
const DEFAULT_TRIGGER_TIMEOUT_MS = Number(process.env.PODCAST_AUTOGEN_TRIGGER_TIMEOUT_MS || 15000);
const DEFAULT_ENABLED = isFeatureEnabled(process.env.PODCAST_AUTOGEN_ENABLED, false);

function ensureParentDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonFileSafe(filePath, fallbackValue = null) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return fallbackValue;
    }
}

function writeJsonFile(filePath, value) {
    ensureParentDir(filePath);
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function getArg(flag) {
    const index = process.argv.indexOf(flag);
    return index === -1 ? null : (process.argv[index + 1] || null);
}

function hasFlag(flag) {
    return process.argv.includes(flag);
}

function isFeatureEnabled(value, defaultValue = false) {
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    return !['0', 'false', 'no', 'off'].includes(String(value).trim().toLowerCase());
}

function getCurrentDateInfo(timeZone, now = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = Object.fromEntries(
        formatter.formatToParts(now).map((part) => [part.type, part.value])
    );

    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour),
        minute: Number(parts.minute)
    };
}

function isWithinScanWindow({ hour, minute }, startHour, startMinute) {
    return hour > startHour || (hour === startHour && minute >= startMinute);
}

function createReportFingerprint(reportPath, stats) {
    return [
        reportPath,
        stats.size,
        stats.mtimeMs
    ].join(':');
}

function summarizeMetadata(metadata) {
    if (!metadata) {
        return null;
    }

    return {
        status: metadata.status || null,
        generation_signature: metadata.generation_signature || null,
        updated_at: metadata.updated_at || null,
        tts_task_id: metadata.tts_task_id || null
    };
}

function shouldTriggerPodcast({ reportExists, metadata, lastTriggeredFingerprint, currentFingerprint }) {
    if (!reportExists) {
        return { shouldTrigger: false, reason: 'report_missing' };
    }

    const status = metadata?.status || null;
    if (status === 'ready') {
        return { shouldTrigger: false, reason: 'already_ready' };
    }

    if (status === 'pending') {
        return { shouldTrigger: false, reason: 'already_pending' };
    }

    if (lastTriggeredFingerprint && lastTriggeredFingerprint === currentFingerprint) {
        return { shouldTrigger: false, reason: 'already_triggered_for_same_report' };
    }

    return { shouldTrigger: true, reason: status ? `retry_from_${status}` : 'first_trigger' };
}

async function triggerPodcastGeneration({ apiBaseUrl, date, timeoutMs }) {
    const controller = AbortSignal.timeout(timeoutMs);
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/podcast/news/${date}/generate`, {
        method: 'POST',
        signal: controller,
        headers: {
            Accept: 'application/json'
        }
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : { raw: await response.text().catch(() => '') };

    if (!response.ok) {
        const message = body?.message || body?.error || `HTTP ${response.status}`;
        throw new Error(`触发播客生成失败: ${message}`);
    }

    return {
        httpStatus: response.status,
        body
    };
}

async function runPodcastAutogenOnce(options = {}) {
    const verbose = options.verbose ?? hasFlag('--verbose');
    const reportDir = options.reportDir || getArg('--report-dir') || DEFAULT_REPORT_DIR;
    const metadataDir = options.metadataDir || getArg('--metadata-dir') || DEFAULT_METADATA_DIR;
    const stateFile = options.stateFile || getArg('--state-file') || DEFAULT_STATE_FILE;
    const apiBaseUrl = options.apiBaseUrl || getArg('--api-base-url') || DEFAULT_API_BASE_URL;
    const timeZone = options.timeZone || getArg('--timezone') || DEFAULT_TIMEZONE;
    const startHour = Number(options.startHour ?? getArg('--start-hour') ?? DEFAULT_START_HOUR);
    const startMinute = Number(options.startMinute ?? getArg('--start-minute') ?? DEFAULT_START_MINUTE);
    const timeoutMs = Number(options.timeoutMs ?? getArg('--timeout-ms') ?? DEFAULT_TRIGGER_TIMEOUT_MS);
    const enabled = isFeatureEnabled(options.enabled ?? getArg('--enabled') ?? DEFAULT_ENABLED, DEFAULT_ENABLED);
    const now = options.now || new Date();

    const dateInfo = getCurrentDateInfo(timeZone, now);
    const state = readJsonFileSafe(stateFile, {}) || {};

    state.last_scan_at = now.toISOString();
    state.last_scan_date = dateInfo.date;

    if (!enabled) {
        state.last_skip_reason = 'disabled';
        writeJsonFile(stateFile, state);
        return { ok: true, action: 'skip', reason: 'disabled', date: dateInfo.date };
    }

    if (!isWithinScanWindow(dateInfo, startHour, startMinute)) {
        state.last_skip_reason = 'outside_scan_window';
        writeJsonFile(stateFile, state);
        return { ok: true, action: 'skip', reason: 'outside_scan_window', date: dateInfo.date };
    }

    const reportPath = path.join(reportDir, `${dateInfo.date}.json`);
    if (!fs.existsSync(reportPath)) {
        state.last_skip_reason = 'report_missing';
        writeJsonFile(stateFile, state);
        return { ok: true, action: 'skip', reason: 'report_missing', date: dateInfo.date, reportPath };
    }

    const reportStats = fs.statSync(reportPath);
    const reportFingerprint = createReportFingerprint(reportPath, reportStats);
    const metadataPath = path.join(metadataDir, `${dateInfo.date}.json`);
    const metadata = readJsonFileSafe(metadataPath, null);
    const triggerDecision = shouldTriggerPodcast({
        reportExists: true,
        metadata,
        lastTriggeredFingerprint: state.last_triggered_report_fingerprint || null,
        currentFingerprint: reportFingerprint
    });

    state.last_report_path = reportPath;
    state.last_report_fingerprint = reportFingerprint;
    state.last_metadata = summarizeMetadata(metadata);

    if (!triggerDecision.shouldTrigger) {
        state.last_skip_reason = triggerDecision.reason;
        writeJsonFile(stateFile, state);
        return {
            ok: true,
            action: 'skip',
            reason: triggerDecision.reason,
            date: dateInfo.date,
            reportPath,
            metadataStatus: metadata?.status || null
        };
    }

    const triggerResult = await triggerPodcastGeneration({
        apiBaseUrl,
        date: dateInfo.date,
        timeoutMs
    });

    state.last_triggered_at = now.toISOString();
    state.last_triggered_date = dateInfo.date;
    state.last_trigger_reason = triggerDecision.reason;
    state.last_triggered_report_fingerprint = reportFingerprint;
    state.last_trigger_response_status = triggerResult.httpStatus;
    state.last_trigger_response_body = summarizeMetadata(triggerResult.body);
    state.last_skip_reason = null;
    writeJsonFile(stateFile, state);

    const result = {
        ok: true,
        action: 'triggered',
        date: dateInfo.date,
        reportPath,
        reason: triggerDecision.reason,
        httpStatus: triggerResult.httpStatus,
        metadataStatus: triggerResult.body?.status || null
    };

    if (verbose) {
        result.response = triggerResult.body;
    }

    return result;
}

if (require.main === module) {
    runPodcastAutogenOnce()
        .then((result) => {
            if (result.action === 'triggered' || hasFlag('--verbose')) {
                console.log(`[podcast-autogen] ${JSON.stringify(result)}`);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error(`[podcast-autogen] failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = {
    getCurrentDateInfo,
    isFeatureEnabled,
    isWithinScanWindow,
    shouldTriggerPodcast,
    runPodcastAutogenOnce
};
