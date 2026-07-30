import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as duckdb from '@duckdb/duckdb-wasm';
import { expose } from 'comlink';
import { APP_VERSION } from '../../config/app-version.js';


vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

vi.mock('@duckdb/duckdb-wasm', () => {
    const AsyncDuckDB = vi.fn().mockImplementation(function() {
        return {
            instantiate: vi.fn().mockResolvedValue(undefined),
            connect: vi.fn().mockResolvedValue({
                query: vi.fn().mockImplementation(async (query: string) => {
                    if (query.startsWith('DESCRIBE')) {
                        return {
                            toArray: () => [{ toJSON: () => ({ column_name: 'col1', column_type: 'VARCHAR' }) }]
                        };
                    }
                    return {
                        toArray: () => [{ toJSON: () => ({ col1: 'val1' }) }],
                        schema: { fields: [{ name: 'col1' }] }
                    };
                }),
            }),
            registerFileHandle: vi.fn().mockResolvedValue(undefined),
        };
    });

    return {
        selectBundle: vi.fn().mockResolvedValue({ mainModule: 'mock.wasm', mainWorker: 'mock.worker.js' }),
        ConsoleLogger: vi.fn().mockImplementation(function() {}),
        AsyncDuckDB,
        DuckDBDataProtocol: {
            BROWSER_FILEREADER: 1
        }
    };
});


// Mock caches API
const mockDelete = vi.fn().mockResolvedValue(true);
globalThis.caches = {
    keys: vi.fn().mockResolvedValue([]),
    delete: mockDelete,
} as any;

describe('DuckDB Worker', () => {
    let duckdbWorkerModule: any;

    beforeEach(() => {
        // Mock global Worker
        (global as any).Worker = vi.fn();
    });

    let service: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Load the worker to get the exposed service instance
        // But since comlink.expose is mocked, we need to extract the instance it was called with.
        duckdbWorkerModule = await import('../duckdb.worker');
        const exposeMock = (await import('comlink')).expose as any;
        expect(exposeMock).toHaveBeenCalled();
        service = exposeMock.mock.calls[0][0];
    });

    afterEach(() => {
        vi.resetModules();
    });


    it('should clear old WASM caches when version differs', async () => {
        const consoleSpy = vi.spyOn(console, 'log');

        // Setup mismatched cache keys
        globalThis.caches.keys = vi.fn().mockResolvedValue([
            'wasm-cache-v1.0.0', // Old version
            'other-cache-v1',
            `wasm-cache-${APP_VERSION}` // Current version
        ]);

        await service.init();

        // Should check keys
        expect(mockDelete).toHaveBeenCalledWith('wasm-cache-v1.0.0');
        expect(mockDelete).not.toHaveBeenCalledWith('other-cache-v1');
        expect(mockDelete).not.toHaveBeenCalledWith(`wasm-cache-${APP_VERSION}`);

        // Should log the update message
        expect(consoleSpy).toHaveBeenCalledWith('Updating DuckDB engine...');
    });

    it('should not clear caches if versions match exactly', async () => {
        const consoleSpy = vi.spyOn(console, 'log');
        mockDelete.mockClear();

        globalThis.caches.keys = vi.fn().mockResolvedValue([
            `wasm-cache-${APP_VERSION}`
        ]);

        await service.init();

        expect(mockDelete).not.toHaveBeenCalled();
        expect(consoleSpy).not.toHaveBeenCalledWith('Updating DuckDB engine...');
    });

    it('should initialize DuckDB correctly', async () => {
        await service.init();
        expect(duckdb.selectBundle).toHaveBeenCalled();
        expect(service['db']).toBeDefined();
        expect(service['conn']).toBeDefined();
    });

    it('should register a CSV file and create a view', async () => {
        await service.init();
        const file = new File(['a,b\n1,2'], 'test.csv', { type: 'text/csv' });

        await service.registerFile(file, 'test_table');

        expect(service['db'].registerFileHandle).toHaveBeenCalledWith('test.csv', file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
        expect(service['conn'].query).toHaveBeenCalledWith(expect.stringContaining('CREATE OR REPLACE VIEW test_table AS SELECT * FROM read_csv_auto(\'test.csv\')'));
    });

    it('should execute a query and return formatted results', async () => {
        await service.init();

        const result = await service.query('SELECT * FROM test_table');

        expect(service['conn'].query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM test_table LIMIT 1000'));
        expect(result.columns).toEqual(['col1']);
        expect(result.rows).toEqual([{ col1: 'val1' }]);
        expect(typeof result.executionTimeMs).toBe('number');
    });

    it('should return schema information', async () => {
        await service.init();

        const schema = await service.getSchema('test_table');

        expect(service['conn'].query).toHaveBeenCalledWith('DESCRIBE test_table');
        expect(schema).toEqual({ col1: 'VARCHAR' });
    });
});
