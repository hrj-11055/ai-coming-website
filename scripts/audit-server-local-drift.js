#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
    DEFAULT_SERVER_HOST,
    DEFAULT_SERVER_ROOT
} = require('../server/services/podcast-alignment');

const LOCAL_ROOT = process.cwd();
const SERVER_HOST = process.env.PROJECT_SERVER_HOST || DEFAULT_SERVER_HOST;
const SERVER_ROOT = process.env.PROJECT_SERVER_ROOT || DEFAULT_SERVER_ROOT;

const CODE_SCOPE_PATTERNS = [
    /^server\//,
    /^scripts\//,
    /^frontend\//,
    /^tests\//,
    /^docs\//,
    /^config\//,
    /^database\//,
    /^api\.js$/,
    /^package\.json$/,
    /^server-json\.js$/,
    /^server-mysql\.js$/,
    /^mutagen\.yml$/,
    /^run\.sh$/,
    /\.html$/
];

function isCodeScopeFile(filePath) {
    return CODE_SCOPE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function quoteForSingleQuotes(value) {
    return String(value).replace(/'/g, `'\\''`);
}

function splitLines(value) {
    return String(value || '')
        .split('\n')
        .map((line) => line.trimEnd())
        .filter(Boolean);
}

function runLocal(command, args, options = {}) {
    return execFileSync(command, args, {
        cwd: LOCAL_ROOT,
        encoding: 'utf8',
        ...options
    }).trim();
}

function runSsh(command, options = {}) {
    return execFileSync(
        'ssh',
        ['-o', 'StrictHostKeyChecking=accept-new', `root@${SERVER_HOST}`, command],
        {
            encoding: 'utf8',
            ...options
        }
    ).trim();
}

function runRemoteNode(script, input = '') {
    const envPrefix = input
        ? `CODEX_REMOTE_INPUT_B64='${quoteForSingleQuotes(Buffer.from(input, 'utf8').toString('base64'))}' `
        : '';
    const command = `cd '${quoteForSingleQuotes(SERVER_ROOT)}' && ${envPrefix}node - <<'NODE'
${script}
NODE`;

    return runSsh(command);
}

function sha1Buffer(buffer) {
    return crypto.createHash('sha1').update(buffer).digest('hex');
}

function parseGitStatus(rawStatus) {
    return splitLines(rawStatus).map((line) => {
        const status = line.slice(0, 2);
        const pathPart = line.slice(3);
        const normalizedPath = pathPart.includes(' -> ')
            ? pathPart.split(' -> ').pop()
            : pathPart;

        return {
            raw: line,
            status,
            path: normalizedPath
        };
    });
}

function readLocalGitState() {
    return {
        head: runLocal('git', ['rev-parse', 'HEAD']),
        head_subject: runLocal('git', ['show', '-s', '--format=%s', 'HEAD']),
        branch: runLocal('git', ['branch', '--show-current']),
        tracked_files: splitLines(runLocal('git', ['ls-files'])),
        dirty_entries: parseGitStatus(runLocal('git', ['status', '--short'])),
        untracked_files: splitLines(runLocal('git', ['ls-files', '--others', '--exclude-standard']))
    };
}

function readRemoteGitState() {
    const script = `
const { execFileSync } = require('child_process');

function sh(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function shLines(args) {
  return execFileSync('git', args, { encoding: 'utf8' })
    .split('\\n')
    .filter(Boolean);
}

const payload = {
  head: sh(['rev-parse', 'HEAD']),
  head_subject: sh(['show', '-s', '--format=%s', 'HEAD']),
  branch: sh(['branch', '--show-current']),
  tracked_files: sh(['ls-files']).split('\\n').filter(Boolean),
  dirty_entries: shLines(['status', '--short']),
  untracked_files: shLines(['ls-files', '--others', '--exclude-standard'])
};

process.stdout.write(JSON.stringify(payload));
`;

    const payload = JSON.parse(runRemoteNode(script));
    return {
        ...payload,
        dirty_entries: parseGitStatus(payload.dirty_entries.join('\n'))
    };
}

function readLocalHashes(files) {
    const result = {};

    for (const relativePath of files) {
        const absolutePath = path.join(LOCAL_ROOT, relativePath);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
            result[relativePath] = { exists: false, hash: null };
            continue;
        }

        result[relativePath] = {
            exists: true,
            hash: sha1Buffer(fs.readFileSync(absolutePath))
        };
    }

    return result;
}

function readRemoteHashes(files) {
    const script = `
const crypto = require('crypto');
const fs = require('fs');

const files = JSON.parse(Buffer.from(process.env.CODEX_REMOTE_INPUT_B64 || '', 'base64').toString('utf8') || '[]');
const result = {};

for (const relativePath of files) {
  if (!fs.existsSync(relativePath) || !fs.statSync(relativePath).isFile()) {
    result[relativePath] = { exists: false, hash: null };
    continue;
  }

  result[relativePath] = {
    exists: true,
    hash: crypto.createHash('sha1').update(fs.readFileSync(relativePath)).digest('hex')
  };
}

process.stdout.write(JSON.stringify(result));
`;

    return JSON.parse(runRemoteNode(script, JSON.stringify(files)));
}

function readLocalShellAudit(files) {
    return files
        .filter((filePath) => filePath.endsWith('.sh'))
        .sort()
        .map((relativePath) => {
            const absolutePath = path.join(LOCAL_ROOT, relativePath);
            const buffer = fs.readFileSync(absolutePath);
            const mode = fs.statSync(absolutePath).mode;

            return {
                file: relativePath,
                line_endings: buffer.includes(13) ? 'CRLF' : 'LF',
                executable: Boolean(mode & 0o111)
            };
        });
}

function readRemoteShellAudit(files) {
    const script = `
const fs = require('fs');

const files = JSON.parse(Buffer.from(process.env.CODEX_REMOTE_INPUT_B64 || '', 'base64').toString('utf8') || '[]');
const result = files
  .filter((filePath) => filePath.endsWith('.sh'))
  .sort()
  .map((relativePath) => {
    const buffer = fs.readFileSync(relativePath);
    const mode = fs.statSync(relativePath).mode;

    return {
      file: relativePath,
      line_endings: buffer.includes(13) ? 'CRLF' : 'LF',
      executable: Boolean(mode & 0o111)
    };
  });

process.stdout.write(JSON.stringify(result));
`;

    return JSON.parse(runRemoteNode(script, JSON.stringify(files)));
}

function buildDirtyAlignment({ localDirtyEntries, remoteDirtyEntries, localHashes, remoteHashes }) {
    const localDirty = new Set(localDirtyEntries.map((entry) => entry.path));
    const remoteDirty = new Set(remoteDirtyEntries.map((entry) => entry.path));
    const union = Array.from(new Set([...localDirty, ...remoteDirty])).sort();

    const shared_dirty_same_content = [];
    const local_only_dirty_but_same_content = [];
    const remote_only_dirty_but_same_content = [];
    const dirty_and_different = [];

    for (const filePath of union) {
        const localState = localHashes[filePath];
        const remoteState = remoteHashes[filePath];
        const sameContent = Boolean(
            localState?.exists
            && remoteState?.exists
            && localState.hash === remoteState.hash
        );

        if (localDirty.has(filePath) && remoteDirty.has(filePath) && sameContent) {
            shared_dirty_same_content.push(filePath);
            continue;
        }

        if (localDirty.has(filePath) && !remoteDirty.has(filePath) && sameContent) {
            local_only_dirty_but_same_content.push(filePath);
            continue;
        }

        if (!localDirty.has(filePath) && remoteDirty.has(filePath) && sameContent) {
            remote_only_dirty_but_same_content.push(filePath);
            continue;
        }

        dirty_and_different.push(filePath);
    }

    return {
        shared_dirty_same_content,
        local_only_dirty_but_same_content,
        remote_only_dirty_but_same_content,
        dirty_and_different
    };
}

function main() {
    const local = readLocalGitState();
    const remote = readRemoteGitState();

    const localTrackedSet = new Set(local.tracked_files);
    const remoteTrackedSet = new Set(remote.tracked_files);

    const trackedOnlyLocal = local.tracked_files.filter((filePath) => !remoteTrackedSet.has(filePath)).sort();
    const trackedOnlyRemote = remote.tracked_files.filter((filePath) => !localTrackedSet.has(filePath)).sort();
    const sharedTracked = local.tracked_files.filter((filePath) => remoteTrackedSet.has(filePath)).sort();
    const comparedCodeScope = sharedTracked.filter(isCodeScopeFile);

    const localHashes = readLocalHashes(comparedCodeScope);
    const remoteHashes = readRemoteHashes(comparedCodeScope);
    const codeScopeDrifts = comparedCodeScope
        .filter((filePath) => {
            const localState = localHashes[filePath];
            const remoteState = remoteHashes[filePath];
            return localState?.hash !== remoteState?.hash;
        })
        .map((filePath) => ({
            file: filePath,
            local_hash: localHashes[filePath]?.hash || null,
            remote_hash: remoteHashes[filePath]?.hash || null
        }));

    const report = {
        generated_at: new Date().toISOString(),
        local_root: LOCAL_ROOT,
        server_host: SERVER_HOST,
        server_root: SERVER_ROOT,
        local_git: {
            head: local.head,
            head_subject: local.head_subject,
            branch: local.branch,
            tracked_file_count: local.tracked_files.length,
            dirty_entries: local.dirty_entries,
            untracked_files: local.untracked_files
        },
        remote_git: {
            head: remote.head,
            head_subject: remote.head_subject,
            branch: remote.branch,
            tracked_file_count: remote.tracked_files.length,
            dirty_entries: remote.dirty_entries,
            untracked_files: remote.untracked_files
        },
        tracked_set_alignment: {
            shared_count: sharedTracked.length,
            only_local: trackedOnlyLocal,
            only_remote: trackedOnlyRemote
        },
        current_content_alignment: {
            compared_scope: 'server|scripts|frontend|tests|docs|config|database|html|package.json|server-json.js|server-mysql.js|mutagen.yml|run.sh',
            compared_file_count: comparedCodeScope.length,
            drift_count: codeScopeDrifts.length,
            drifts: codeScopeDrifts,
            dirty_alignment: buildDirtyAlignment({
                localDirtyEntries: local.dirty_entries,
                remoteDirtyEntries: remote.dirty_entries,
                localHashes,
                remoteHashes
            })
        },
        shell_script_audit: {
            local: readLocalShellAudit(local.tracked_files),
            remote: readRemoteShellAudit(remote.tracked_files)
        }
    };

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
