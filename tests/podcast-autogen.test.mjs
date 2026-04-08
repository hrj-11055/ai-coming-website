import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import autogenModule from '../scripts/run-podcast-autogen-once.js';

const {
    getCurrentDateInfo,
    isWithinScanWindow,
    runPodcastAutogenOnce,
    shouldTriggerPodcast
} = autogenModule;

test('runPodcastAutogenOnce is disabled by default and records skip state', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'podcast-autogen-disabled-'));
    const stateFile = path.join(root, 'state.json');

    const result = await runPodcastAutogenOnce({
        now: new Date('2026-04-08T02:00:00.000Z'),
        reportDir: path.join(root, 'report'),
        metadataDir: path.join(root, 'metadata'),
        stateFile
    });

    assert.equal(result.action, 'skip');
    assert.equal(result.reason, 'disabled');

    const savedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    assert.equal(savedState.last_skip_reason, 'disabled');
    assert.equal(savedState.last_scan_date, '2026-04-08');
});

test('getCurrentDateInfo resolves Asia/Shanghai date and time parts', () => {
    const info = getCurrentDateInfo('Asia/Shanghai', new Date('2026-03-19T01:06:00.000Z'));
    assert.equal(info.date, '2026-03-19');
    assert.equal(info.hour, 9);
    assert.equal(info.minute, 6);
});

test('isWithinScanWindow starts at 09:05 inclusive', () => {
    assert.equal(isWithinScanWindow({ hour: 9, minute: 4 }, 9, 5), false);
    assert.equal(isWithinScanWindow({ hour: 9, minute: 5 }, 9, 5), true);
    assert.equal(isWithinScanWindow({ hour: 10, minute: 0 }, 9, 5), true);
});

test('shouldTriggerPodcast skips missing or in-flight/ready reports', () => {
    assert.deepEqual(
        shouldTriggerPodcast({
            reportExists: false,
            metadata: null,
            lastTriggeredFingerprint: null,
            currentFingerprint: 'fp-1'
        }),
        { shouldTrigger: false, reason: 'report_missing' }
    );

    assert.deepEqual(
        shouldTriggerPodcast({
            reportExists: true,
            metadata: { status: 'pending' },
            lastTriggeredFingerprint: null,
            currentFingerprint: 'fp-1'
        }),
        { shouldTrigger: false, reason: 'already_pending' }
    );

    assert.deepEqual(
        shouldTriggerPodcast({
            reportExists: true,
            metadata: { status: 'ready' },
            lastTriggeredFingerprint: null,
            currentFingerprint: 'fp-1'
        }),
        { shouldTrigger: false, reason: 'already_ready' }
    );
});

test('shouldTriggerPodcast triggers first time and blocks duplicate same-file retry', () => {
    assert.deepEqual(
        shouldTriggerPodcast({
            reportExists: true,
            metadata: { status: 'error' },
            lastTriggeredFingerprint: null,
            currentFingerprint: 'fp-1'
        }),
        { shouldTrigger: true, reason: 'retry_from_error' }
    );

    assert.deepEqual(
        shouldTriggerPodcast({
            reportExists: true,
            metadata: { status: 'error' },
            lastTriggeredFingerprint: 'fp-1',
            currentFingerprint: 'fp-1'
        }),
        { shouldTrigger: false, reason: 'already_triggered_for_same_report' }
    );
});
