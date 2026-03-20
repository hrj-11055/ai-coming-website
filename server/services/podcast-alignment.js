const path = require('path');

const DEFAULT_SERVER_HOST = '8.135.37.159';
const DEFAULT_SERVER_ROOT = '/var/www/ai-coming-website';

const SERVER_CANONICAL_RELATIVE_PATHS = [
    '.env',
    'server/services/news-podcast.js',
    'server/services/podcast-script.js',
    'config/podcast-script-system-prompt.md',
    'scripts/smoke-json.js'
];

const LOCAL_DERIVED_RELATIVE_PATHS = [
    '.env.example',
    'tests/news-podcast.test.mjs',
    'tests/podcast-script.test.mjs',
    '.env'
];

const VERIFICATION_PRIORITY = [
    'server_probe',
    'live_api',
    'generate_api',
    'local_tests'
];

const REPORTING_LAYERS = [
    'server_file_state',
    'server_env_state',
    'live_api_state'
];

const WORKFLOW_STEPS = [
    'read_server_files_and_env',
    'read_live_api_state',
    'apply_changes_on_server_first',
    'sync_back_to_local_if_needed'
];

function absolutizeAll(root, relativePaths) {
    return relativePaths.map((relativePath) => path.join(root, relativePath));
}

function buildPodcastAlignmentPolicy(options = {}) {
    const localRoot = options.localRoot || process.cwd();
    const serverRoot = options.serverRoot || DEFAULT_SERVER_ROOT;

    return {
        serverHost: options.serverHost || DEFAULT_SERVER_HOST,
        localRoot,
        serverRoot,
        verificationPriority: [...VERIFICATION_PRIORITY],
        reportingLayers: [...REPORTING_LAYERS],
        workflowSteps: [...WORKFLOW_STEPS],
        serverCanonicalFiles: absolutizeAll(serverRoot, SERVER_CANONICAL_RELATIVE_PATHS),
        localDerivedFiles: absolutizeAll(localRoot, LOCAL_DERIVED_RELATIVE_PATHS)
    };
}

function classifyComparableFileState({
    localExists,
    serverExists,
    localHash,
    serverHash
}) {
    if (serverExists && !localExists) {
        return 'missing_local_copy';
    }

    if (!serverExists && localExists) {
        return 'missing_server_source';
    }

    if (!serverExists && !localExists) {
        return 'missing_both';
    }

    if (localHash === serverHash) {
        return 'in_sync';
    }

    return 'drift_from_server';
}

function resolveEffectivePodcastState({
    key,
    serverFileState,
    serverEnvState,
    liveApiState
}) {
    const layers = [
        ['live_api_state', liveApiState],
        ['server_env_state', serverEnvState],
        ['server_file_state', serverFileState]
    ];

    for (const [source, payload] of layers) {
        if (payload && payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
            return {
                key,
                source,
                value: payload[key]
            };
        }
    }

    return {
        key,
        source: 'unresolved',
        value: null
    };
}

module.exports = {
    DEFAULT_SERVER_HOST,
    DEFAULT_SERVER_ROOT,
    SERVER_CANONICAL_RELATIVE_PATHS,
    LOCAL_DERIVED_RELATIVE_PATHS,
    VERIFICATION_PRIORITY,
    REPORTING_LAYERS,
    WORKFLOW_STEPS,
    buildPodcastAlignmentPolicy,
    classifyComparableFileState,
    resolveEffectivePodcastState
};
