const DEFAULT_IGNORED_PREFIXES = [
    '.git/',
    'node_modules/',
    'logs/',
    'backups/',
    '.worktrees/',
    'data/podcasts/'
];

const DEFAULT_IGNORED_EXACT = new Set([
    '.DS_Store',
    '.podcast-autogen.lock'
]);

function normalizeRelativePath(input) {
    if (!input) {
        return '';
    }

    return String(input)
        .replace(/\\/g, '/')
        .replace(/^\.\/+/, '')
        .replace(/^\/+/, '');
}

function shouldIgnoreRelativePath(relPath, options = {}) {
    const normalized = normalizeRelativePath(relPath);
    const ignoredPrefixes = options.ignoredPrefixes || DEFAULT_IGNORED_PREFIXES;
    const ignoredExact = options.ignoredExact || DEFAULT_IGNORED_EXACT;

    if (!normalized) {
        return true;
    }

    if (ignoredExact.has(normalized)) {
        return true;
    }

    return ignoredPrefixes.some((prefix) => {
        const trimmedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
        return normalized === trimmedPrefix || normalized.startsWith(prefix);
    });
}

function parsePorcelainStatus(output) {
    return String(output || '')
        .split('\n')
        .map((line) => line.trimEnd())
        .filter(Boolean)
        .map((line) => {
            const status = line.slice(0, 2);
            const rawPath = line.slice(3);
            const path = rawPath.includes(' -> ')
                ? rawPath.split(' -> ').pop()
                : rawPath;

            return {
                status,
                path: normalizeRelativePath(path)
            };
        });
}

function formatTimestamp(date = new Date()) {
    return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
}

function buildCommitMessage(paths, date = new Date()) {
    const uniquePaths = Array.from(new Set((paths || []).map(normalizeRelativePath).filter(Boolean)));
    const preview = uniquePaths.slice(0, 3);
    const previewText = preview.length ? ` ${preview.join(', ')}` : '';
    const extraCount = Math.max(uniquePaths.length - preview.length, 0);
    const extraText = extraCount > 0 ? ` +${extraCount}` : '';

    return `chore(auto): sync ${formatTimestamp(date)}${previewText}${extraText}`.trim();
}

function isConflictStatus(status) {
    return ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'].includes(status);
}

module.exports = {
    DEFAULT_IGNORED_EXACT,
    DEFAULT_IGNORED_PREFIXES,
    buildCommitMessage,
    formatTimestamp,
    isConflictStatus,
    normalizeRelativePath,
    parsePorcelainStatus,
    shouldIgnoreRelativePath
};
