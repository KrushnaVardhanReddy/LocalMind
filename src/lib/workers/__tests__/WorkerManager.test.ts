import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerManager } from '../WorkerManager';
import * as comlink from 'comlink';

// Mock the global Worker constructor
const mockWorker = vi.fn();
global.Worker = mockWorker as any;

// Mock comlink
vi.mock('comlink', () => ({
    wrap: vi.fn(() => ({
        init: vi.fn().mockResolvedValue(undefined)
    }))
}));

describe('WorkerManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset the singleton state (hacky, but necessary for static class testing)
        (WorkerManager as any).proxies.clear();
        (WorkerManager as any).instances.clear();
        (WorkerManager as any).initPromise = null;
    });

    it('should lazily initialize the DuckDB worker exactly once', async () => {
        expect(mockWorker).not.toHaveBeenCalled();

        const db1 = await WorkerManager.getDuckDB();
        expect(mockWorker).toHaveBeenCalledTimes(1);

        const db2 = await WorkerManager.getDuckDB();
        expect(mockWorker).toHaveBeenCalledTimes(1); // Should not spawn a second worker

        expect(db1).toBe(db2);
    });

    it('should initialize exactly once even for concurrent calls', async () => {
        expect(mockWorker).not.toHaveBeenCalled();
        (WorkerManager as any).initPromise = null;

        const [db1, db2] = await Promise.all([
            WorkerManager.getDuckDB(),
            WorkerManager.getDuckDB(),
        ]);

        expect(mockWorker).toHaveBeenCalledTimes(1); // Should not spawn a second worker
        expect(db1).toBe(db2);
    });

    it('should wrap the worker with comlink and initialize it', async () => {
        const wrapSpy = vi.spyOn(comlink, 'wrap');

        await WorkerManager.getDuckDB();

        expect(wrapSpy).toHaveBeenCalled();
    });
});
