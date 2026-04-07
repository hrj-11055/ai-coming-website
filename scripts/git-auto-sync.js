#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const {
    buildCommitMessage,
    isConflictStatus,
    normalizeRelativePath,
    parsePorcelainStatus,
    shouldIgnoreRelativePath
} = require('./git-auto-sync-utils');

const repoRoot = path.resolve(__dirname, '..');
const debounceMs = Number.parseInt(process.env.AUTO_SYNC_DEBOUNCE_MS || '4000', 10);
const scanIntervalMs = Number.parseInt(process.env.AUTO_SYNC_SCAN_MS || '2500', 10);
const remoteName = process.env.AUTO_SYNC_REMOTE || 'origin';
const pushEnabled = process.env.AUTO_SYNC_PUSH !== '0';
const includeBaselineChanges = process.env.AUTO_SYNC_INCLUDE_BASELINE === '1';

const pendingPaths = new Set();
let baselineDirtyPaths = new Set();
let currentBranch = '';
let flushTimer = null;
let scanTimer = null;
let lastSnapshot = new Map();
let scanInFlight = false;
let syncInFlight = false;
let rerunRequested = false;

function log(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
    process.stdout.write(`[git-auto-sync] ${timestamp} ${message}\n`);
}

function runCommand(command, args, options = {}) {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd: repoRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
            ...options
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        child.on('error', (error) => {
            resolve({
                code: 1,
                stdout,
                stderr: error.message
            });
        });
    });
}

async function getCurrentBranch() {
    const result = await runCommand('git', ['branch', '--show-current']);

    if (result.code !== 0) {
        throw new Error(result.stderr || 'Unable to detect current branch.');
    }

    const branch = result.stdout.trim();

    if (!branch) {
        throw new Error('Detached HEAD is not supported by git-auto-sync.');
    }

    return branch;
}

async function getStatusEntries() {
    const result = await runCommand('git', ['status', '--porcelain=v1', '--untracked-files=all']);

    if (result.code !== 0) {
        throw new Error(result.stderr || 'Unable to read git status.');
    }

    return parsePorcelainStatus(result.stdout).filter((entry) => !shouldIgnoreRelativePath(entry.path));
}

function collectCandidateEntries(statusEntries) {
    if (includeBaselineChanges) {
        return statusEntries;
    }

    return statusEntries.filter((entry) => {
        if (pendingPaths.has(entry.path)) {
            return true;
        }

        return Array.from(pendingPaths).some((pendingPath) => entry.path.startsWith(`${pendingPath}/`));
    });
}

function markPending(rawPath) {
    const relPath = normalizeRelativePath(rawPath);

    if (!relPath || shouldIgnoreRelativePath(relPath)) {
        return;
    }

    pendingPaths.add(relPath);
}

async function scanDirectory(dirPath, relPrefix = '', snapshot = new Map()) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const relPath = normalizeRelativePath(path.posix.join(relPrefix, entry.name));

        if (shouldIgnoreRelativePath(relPath)) {
            continue;
        }

        const absolutePath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            await scanDirectory(absolutePath, relPath, snapshot);
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const stats = await fs.stat(absolutePath);
        snapshot.set(relPath, `${stats.mtimeMs}:${stats.size}`);
    }

    return snapshot;
}

async function buildSnapshot() {
    return scanDirectory(repoRoot);
}

function diffSnapshots(previousSnapshot, nextSnapshot) {
    const changedPaths = new Set();

    for (const [filePath, fingerprint] of nextSnapshot.entries()) {
        if (previousSnapshot.get(filePath) !== fingerprint) {
            changedPaths.add(filePath);
        }
    }

    for (const filePath of previousSnapshot.keys()) {
        if (!nextSnapshot.has(filePath)) {
            changedPaths.add(filePath);
        }
    }

    return Array.from(changedPaths);
}

async function pollForChanges() {
    if (scanInFlight) {
        return;
    }

    scanInFlight = true;

    try {
        const nextSnapshot = await buildSnapshot();
        const changedPaths = diffSnapshots(lastSnapshot, nextSnapshot);

        if (changedPaths.length) {
            changedPaths.forEach((filePath) => markPending(filePath));
            scheduleSync();
        }

        lastSnapshot = nextSnapshot;
    } catch (error) {
        log(`Scan failed: ${error.message}`);
    } finally {
        scanInFlight = false;
    }
}

function scheduleSync() {
    if (flushTimer) {
        clearTimeout(flushTimer);
    }

    flushTimer = setTimeout(() => {
        flushTimer = null;
        void flushChanges();
    }, debounceMs);
}

async function stageCommitAndPush(candidateEntries) {
    const uniquePaths = Array.from(new Set(candidateEntries.map((entry) => entry.path)));

    if (!uniquePaths.length) {
        return;
    }

    const addResult = await runCommand('git', ['add', '--', ...uniquePaths]);
    if (addResult.code !== 0) {
        throw new Error(addResult.stderr || 'git add failed.');
    }

    const diffResult = await runCommand('git', ['diff', '--cached', '--quiet']);
    if (diffResult.code === 0) {
        uniquePaths.forEach((filePath) => pendingPaths.delete(filePath));
        return;
    }

    const commitMessage = buildCommitMessage(uniquePaths);
    const commitResult = await runCommand('git', ['commit', '-m', commitMessage]);

    if (commitResult.code !== 0) {
        const combinedOutput = `${commitResult.stdout}\n${commitResult.stderr}`.trim();

        if (/nothing to commit/i.test(combinedOutput)) {
            uniquePaths.forEach((filePath) => pendingPaths.delete(filePath));
            return;
        }

        throw new Error(combinedOutput || 'git commit failed.');
    }

    uniquePaths.forEach((filePath) => {
        pendingPaths.delete(filePath);
        baselineDirtyPaths.delete(filePath);
    });

    log(`Committed ${uniquePaths.length} file(s): ${commitMessage}`);

    if (!pushEnabled) {
        return;
    }

    const pushResult = await runCommand('git', ['push', remoteName, currentBranch]);
    if (pushResult.code !== 0) {
        throw new Error(pushResult.stderr || pushResult.stdout || 'git push failed.');
    }

    log(`Pushed to ${remoteName}/${currentBranch}`);
}

async function flushChanges() {
    if (syncInFlight) {
        rerunRequested = true;
        return;
    }

    syncInFlight = true;

    try {
        const statusEntries = await getStatusEntries();
        const candidateEntries = collectCandidateEntries(statusEntries);

        if (!candidateEntries.length) {
            if (statusEntries.length && !includeBaselineChanges) {
                log('Detected only baseline dirty files; waiting for fresh edits.');
            }
            return;
        }

        const conflicts = candidateEntries.filter((entry) => isConflictStatus(entry.status));
        if (conflicts.length) {
            log(`Skipped sync because of merge conflicts: ${conflicts.map((entry) => entry.path).join(', ')}`);
            return;
        }

        await stageCommitAndPush(candidateEntries);
    } catch (error) {
        log(`Sync failed: ${error.message}`);
    } finally {
        syncInFlight = false;

        if (rerunRequested) {
            rerunRequested = false;
            void flushChanges();
        }
    }
}

async function bootstrap() {
    currentBranch = await getCurrentBranch();
    baselineDirtyPaths = new Set((await getStatusEntries()).map((entry) => entry.path));
    lastSnapshot = await buildSnapshot();

    log(`Watching ${repoRoot}`);
    log(`Target branch: ${currentBranch}`);
    log(`Debounce window: ${debounceMs}ms`);
    log(`Scan interval: ${scanIntervalMs}ms`);
    log(`Auto-push: ${pushEnabled ? 'enabled' : 'disabled'}`);

    if (baselineDirtyPaths.size && !includeBaselineChanges) {
        log(`Baseline dirty files will be ignored until edited again: ${baselineDirtyPaths.size}`);
    }

    scanTimer = setInterval(() => {
        void pollForChanges();
    }, scanIntervalMs);

    const shutdown = () => {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }

        if (scanTimer) {
            clearInterval(scanTimer);
            scanTimer = null;
        }

        log('Stopped.');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
    log(`Startup failed: ${error.message}`);
    process.exit(1);
});
