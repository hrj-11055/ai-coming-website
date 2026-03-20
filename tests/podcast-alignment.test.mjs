import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const {
    buildPodcastAlignmentPolicy,
    classifyComparableFileState,
    resolveEffectivePodcastState
} = require('../server/services/podcast-alignment.js');

test('buildPodcastAlignmentPolicy returns server-first podcast paths and verification order', () => {
    const localRoot = '/workspace/ai-coming-website';
    const serverRoot = '/var/www/ai-coming-website';

    const policy = buildPodcastAlignmentPolicy({
        localRoot,
        serverRoot,
        serverHost: '8.135.37.159'
    });

    assert.equal(policy.serverHost, '8.135.37.159');
    assert.equal(policy.serverRoot, serverRoot);
    assert.equal(policy.localRoot, localRoot);
    assert.deepEqual(policy.verificationPriority, [
        'server_probe',
        'live_api',
        'generate_api',
        'local_tests'
    ]);
    assert.deepEqual(policy.reportingLayers, [
        'server_file_state',
        'server_env_state',
        'live_api_state'
    ]);
    assert.deepEqual(policy.workflowSteps, [
        'read_server_files_and_env',
        'read_live_api_state',
        'apply_changes_on_server_first',
        'sync_back_to_local_if_needed'
    ]);

    assert.deepEqual(policy.serverCanonicalFiles, [
        path.join(serverRoot, '.env'),
        path.join(serverRoot, 'server/services/news-podcast.js'),
        path.join(serverRoot, 'server/services/podcast-script.js'),
        path.join(serverRoot, 'config/podcast-script-system-prompt.md'),
        path.join(serverRoot, 'scripts/smoke-json.js')
    ]);

    assert.deepEqual(policy.localDerivedFiles, [
        path.join(localRoot, '.env.example'),
        path.join(localRoot, 'tests/news-podcast.test.mjs'),
        path.join(localRoot, 'tests/podcast-script.test.mjs'),
        path.join(localRoot, '.env')
    ]);
});

test('classifyComparableFileState marks drift relative to server truth', () => {
    assert.equal(classifyComparableFileState({
        localExists: true,
        serverExists: true,
        localHash: 'abc',
        serverHash: 'abc'
    }), 'in_sync');

    assert.equal(classifyComparableFileState({
        localExists: true,
        serverExists: true,
        localHash: 'abc',
        serverHash: 'def'
    }), 'drift_from_server');

    assert.equal(classifyComparableFileState({
        localExists: false,
        serverExists: true,
        localHash: null,
        serverHash: 'def'
    }), 'missing_local_copy');

    assert.equal(classifyComparableFileState({
        localExists: true,
        serverExists: false,
        localHash: 'abc',
        serverHash: null
    }), 'missing_server_source');
});

test('resolveEffectivePodcastState prefers live api over server env over server file defaults', () => {
    const resolved = resolveEffectivePodcastState({
        key: 'tts_model',
        serverFileState: { tts_model: 'speech-2.8-hd' },
        serverEnvState: { tts_model: 'speech-2.8-turbo' },
        liveApiState: { tts_model: 'speech-2.8-turbo' }
    });

    assert.deepEqual(resolved, {
        key: 'tts_model',
        source: 'live_api_state',
        value: 'speech-2.8-turbo'
    });

    const fallbackToEnv = resolveEffectivePodcastState({
        key: 'script_model',
        serverFileState: { script_model: 'MiniMax-M2.5' },
        serverEnvState: { script_model: 'MiniMax-M2.7' },
        liveApiState: {}
    });

    assert.deepEqual(fallbackToEnv, {
        key: 'script_model',
        source: 'server_env_state',
        value: 'MiniMax-M2.7'
    });

    const fallbackToFile = resolveEffectivePodcastState({
        key: 'script_mode',
        serverFileState: { script_mode: 'llm_rewritten' },
        serverEnvState: {},
        liveApiState: null
    });

    assert.deepEqual(fallbackToFile, {
        key: 'script_mode',
        source: 'server_file_state',
        value: 'llm_rewritten'
    });
});
