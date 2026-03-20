import test from 'node:test';
import assert from 'node:assert/strict';

import autogenModule from '../scripts/run-podcast-autogen-once.js';

const {
    getCurrentDateInfo,
    isWithinScanWindow,
    shouldTriggerPodcast
} = autogenModule;

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
