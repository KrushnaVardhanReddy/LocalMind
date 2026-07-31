import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { get } from 'svelte/store';
import { workerCrashes, addCrashEvent } from '../workerHealth.store.js';

describe('workerHealth.store', () => {
    let originalSetTimeout: typeof setTimeout;
    let timeoutCallbacks: Array<() => void> = [];

    beforeEach(() => {
        workerCrashes.set([]);
        originalSetTimeout = global.setTimeout;
        timeoutCallbacks = [];
        global.setTimeout = ((cb: () => void, ms?: number) => {
            timeoutCallbacks.push(cb);
            return 1 as any;
        }) as any;
    });

    afterEach(() => {
        global.setTimeout = originalSetTimeout;
    });

    it('adds a crash event to the store', () => {
        addCrashEvent({ workerName: 'duckdb', error: 'Test error', type: 'crash' });

        const state = get(workerCrashes);
        expect(state.length).toBe(1);
        expect(state[0].workerName).toBe('duckdb');
        expect(state[0].error).toBe('Test error');
        expect(state[0].type).toBe('crash');
        expect(state[0].id).toBeDefined();
        expect(state[0].timestamp).toBeDefined();
    });

    it('caps the number of crash events at 10', () => {
        for (let i = 0; i < 15; i++) {
            addCrashEvent({ workerName: 'test', error: `error ${i}`, type: 'crash' });
        }

        const state = get(workerCrashes);
        expect(state.length).toBe(10);
        expect(state[9].error).toBe('error 14');
        expect(state[0].error).toBe('error 5');
    });

    it('auto-dismisses events after 10 seconds', () => {
        addCrashEvent({ workerName: 'duckdb', error: 'OOM', type: 'oom' });

        expect(get(workerCrashes).length).toBe(1);
        expect(timeoutCallbacks.length).toBe(1);

        // Execute the timeout callback
        timeoutCallbacks[0]();

        expect(get(workerCrashes).length).toBe(0);
    });
});
