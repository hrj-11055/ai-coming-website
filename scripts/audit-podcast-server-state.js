#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
    buildPodcastAlignmentPolicy,
    classifyComparableFileState,
    resolveEffectivePodcastState,
    SERVER_CANONICAL_RELATIVE_PATHS
} = require('../server/services/podcast-alignment');

function escapeForSingleQuotes(value) {
    return String(value).replace(/'/g, `'\\''`);
}

function hashFile(filePath) {
    return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');
}

function readLocalFileState(filePath) {
    if (!fs.existsSync(filePath)) {
        return {
            exists: false,
            hash: null
        };
    }

    return {
        exists: true,
        hash: hashFile(filePath)
    };
}

function runSsh(serverHost, command) {
    return execFileSync(
        'ssh',
        ['-o', 'StrictHostKeyChecking=accept-new', `root@${serverHost}`, command],
        { encoding: 'utf8' }
    ).trim();
}

function readServerFileState(serverHost, filePath) {
    const escapedPath = escapeForSingleQuotes(filePath);
    const result = runSsh(
        serverHost,
        `if [ -f '${escapedPath}' ]; then printf 'present '; sha1sum '${escapedPath}' | awk '{print $1}'; else printf 'missing'; fi`
    );

    if (result === 'missing') {
        return {
            exists: false,
            hash: null
        };
    }

    const [, hash] = result.split(/\s+/, 2);
    return {
        exists: true,
        hash: hash || null
    };
}

function readHiddenServerEnv(serverHost, serverRoot) {
    const escapedRoot = escapeForSingleQuotes(serverRoot);
    const raw = runSsh(
        serverHost,
        `cd '${escapedRoot}' && if [ -f .env ]; then grep -E '^(PODCAST_SCRIPT_|MINIMAX_|YUNTTS_)' .env | sed 's/=.*$/=[hidden]/'; fi`
    );

    return raw ? raw.split('\n').filter(Boolean) : [];
}

function readServerEnvState(serverHost, serverRoot) {
    const escapedRoot = escapeForSingleQuotes(serverRoot);
    const raw = runSsh(
        serverHost,
        `cd '${escapedRoot}' && node - <<'NODE'
const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env', 'utf8'));
process.stdout.write(JSON.stringify({
  script_model: env.PODCAST_SCRIPT_MODEL || null,
  tts_model: env.MINIMAX_TTS_MODEL || null,
  script_prompt_file: env.PODCAST_SCRIPT_SYSTEM_PROMPT_FILE || null
}));
NODE`
    );

    return raw ? JSON.parse(raw) : {};
}

function readServerPodcastFileDefaults(serverHost, serverRoot) {
    const escapedRoot = escapeForSingleQuotes(serverRoot);
    const remoteFile = path.posix.join(serverRoot, 'server/services/news-podcast.js');
    const escapedFile = escapeForSingleQuotes(remoteFile);
    const ttsModel = runSsh(
        serverHost,
        `cd '${escapedRoot}' && node - <<'NODE'
const fs = require('fs');
const source = fs.readFileSync('${escapedFile}', 'utf8');
const match = source.match(/const DEFAULT_MINIMAX_TTS_MODEL = '([^']+)'/);
process.stdout.write(match ? match[1] : '');
NODE`
    );

    return {
        tts_model: ttsModel || null
    };
}

function readLatestPodcastState(serverHost, serverRoot) {
    const escapedRoot = escapeForSingleQuotes(serverRoot);
    const raw = runSsh(
        serverHost,
        `cd '${escapedRoot}' && latest_date=$(node -e "const fs=require('fs');const raw=JSON.parse(fs.readFileSync('data/news.json','utf8'));const items=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.articles)?raw.articles:[]);const dates=items.map(x=>String((x.created_at||'')).split('T')[0]).filter(Boolean).sort();process.stdout.write(dates[dates.length-1]||new Date().toISOString().split('T')[0]);"); curl -s "http://127.0.0.1:3000/api/podcast/news/$latest_date"`
    );

    return raw ? JSON.parse(raw) : null;
}

function buildComparableEntries(policy) {
    return SERVER_CANONICAL_RELATIVE_PATHS.map((relativePath) => {
        const localPath = path.join(policy.localRoot, relativePath);
        const serverPath = path.posix.join(policy.serverRoot, relativePath.replace(/\\/g, '/'));

        return {
            relativePath,
            localPath,
            serverPath
        };
    });
}

function main() {
    const policy = buildPodcastAlignmentPolicy({
        localRoot: process.cwd(),
        serverHost: process.env.PODCAST_SERVER_HOST,
        serverRoot: process.env.PODCAST_SERVER_ROOT
    });

    const comparableFiles = buildComparableEntries(policy).map((entry) => {
        const localState = readLocalFileState(entry.localPath);
        const serverState = readServerFileState(policy.serverHost, entry.serverPath);

        return {
            ...entry,
            local_exists: localState.exists,
            server_exists: serverState.exists,
            local_hash: localState.hash,
            server_hash: serverState.hash,
            status: classifyComparableFileState({
                localExists: localState.exists,
                serverExists: serverState.exists,
                localHash: localState.hash,
                serverHash: serverState.hash
            })
        };
    });

    const liveApiState = readLatestPodcastState(policy.serverHost, policy.serverRoot);
    const serverFileState = readServerPodcastFileDefaults(policy.serverHost, policy.serverRoot);
    const serverEnvState = readServerEnvState(policy.serverHost, policy.serverRoot);

    const report = {
        generated_at: new Date().toISOString(),
        policy,
        comparable_files: comparableFiles,
        server_env_keys: readHiddenServerEnv(policy.serverHost, policy.serverRoot),
        server_env_state: serverEnvState,
        live_api_state: liveApiState,
        effective_state: {
            script_model: resolveEffectivePodcastState({
                key: 'script_model',
                serverFileState,
                serverEnvState,
                liveApiState
            }),
            tts_model: resolveEffectivePodcastState({
                key: 'tts_model',
                serverFileState,
                serverEnvState,
                liveApiState
            }),
            script_mode: resolveEffectivePodcastState({
                key: 'script_mode',
                serverFileState: { script_mode: 'llm_rewritten' },
                serverEnvState,
                liveApiState
            })
        }
    };

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
