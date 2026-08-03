import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PyodideWorker } from './pyodide.worker';

// Mock the pyodide module
vi.mock('pyodide', () => {
    return {
        loadPyodide: vi.fn().mockResolvedValue({
            loadPackage: vi.fn().mockResolvedValue(true),
            setStdout: vi.fn(),
            setStderr: vi.fn(),
            globals: {
                set: vi.fn()
            },
            runPythonAsync: vi.fn().mockImplementation((code) => {
                if (code.includes('error')) {
                    throw new Error('Python error');
                }
                return 'mock_result';
            })
        })
    };
});

describe('PyodideWorker', () => {
    let worker: PyodideWorker;

    beforeEach(() => {
        worker = new PyodideWorker();
    });

    it('should initialize successfully', async () => {
        await expect(worker.init()).resolves.toBeUndefined();
    });

    it('should run python code async', async () => {
        await worker.init();
        const result = await worker.runPythonAsync('print("hello")');
        expect(result).toBe('mock_result');
    });

    it('should throw error on python error', async () => {
        await worker.init();
        await expect(worker.runPythonAsync('raise ValueError("error")')).rejects.toThrow('Python error');
    });
});
