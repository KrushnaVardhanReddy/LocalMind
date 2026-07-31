import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerManager } from '../WorkerManager';
import * as comlink from 'comlink';



// Mock the global Worker constructor
const mockWorker = vi.fn().mockImplementation(function() {
    return {
        addEventListener: vi.fn(),
        terminate: vi.fn()
    };
}) as any;

global.Worker = mockWorker;



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
        (WorkerManager as any).initDuckDBPromise = null;
        (WorkerManager as any).initSQLitePromise = null;
        (WorkerManager as any).initLLMPromise = null;
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


    it('should lazily initialize the LLM worker exactly once', async () => {
        expect(mockWorker).not.toHaveBeenCalled();

        const llm1 = await WorkerManager.getLLM();
        expect(mockWorker).toHaveBeenCalledTimes(1);

        const llm2 = await WorkerManager.getLLM();
        expect(mockWorker).toHaveBeenCalledTimes(1);

        expect(llm1).toBe(llm2);
    });

    it('should terminate the duckdb worker and clear its promise', async () => {
        await WorkerManager.getDuckDB();
        expect((WorkerManager as any).instances.has('duckdb')).toBe(true);
        expect((WorkerManager as any).proxies.has('duckdb')).toBe(true);
        expect((WorkerManager as any).initDuckDBPromise).not.toBeNull();

        const workerInstance = (WorkerManager as any).instances.get('duckdb');

        await WorkerManager.terminate('duckdb');

        expect(workerInstance.terminate).toHaveBeenCalled();
        expect((WorkerManager as any).instances.has('duckdb')).toBe(false);
        expect((WorkerManager as any).proxies.has('duckdb')).toBe(false);
        expect((WorkerManager as any).initDuckDBPromise).toBeNull();
    });

    it('should restart the duckdb worker', async () => {
        const db1 = await WorkerManager.getDuckDB();
        const workerInstance1 = (WorkerManager as any).instances.get('duckdb');
        expect(mockWorker).toHaveBeenCalledTimes(1);

        await WorkerManager.restart('duckdb');

        expect(workerInstance1.terminate).toHaveBeenCalled();
        expect(mockWorker).toHaveBeenCalledTimes(2); // Should have created a new worker

        const db2 = await WorkerManager.getDuckDB(); // Should return the newly created one
        // Note: db1 might not literally !== db2 here if comlink mock returns same static object,
        // but let's verify mockWorker call count which proves it re-inited.
        expect(mockWorker).toHaveBeenCalledTimes(2);
    });

});
