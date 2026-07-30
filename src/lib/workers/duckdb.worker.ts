import { expose } from 'comlink';
import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import duckdb_wasm_coi from '@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url';
import coi_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url';
import coi_pthread_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url';
import { APP_VERSION } from '../config/app-version.js';


export interface QueryResult {
    columns: string[];
    rows: any[];
    executionTimeMs: number;
}

export interface DuckDBWorkerContract {
    /**
     * Initializes the WASM engine. Called once.
     */
    init(onProgress?: (msg: string) => void): Promise<void>;

    /**
     * Registers a local File object directly with DuckDB.
     */
    registerFile(file: File, tableName: string): Promise<void>;

    /**
     * Executes a SQL query against the registered tables.
     * Returns a max of 1000 rows by default to prevent UI freezing.
     */
    query(sql: string, limit?: number): Promise<QueryResult>;

    /**
     * Returns schema information (column names and types) for a given table.
     */
    getSchema(tableName: string): Promise<Record<string, string>>;
}

class DuckDBService implements DuckDBWorkerContract {
    private db: duckdb.AsyncDuckDB | null = null;
    private conn: duckdb.AsyncDuckDBConnection | null = null;

    async init(onProgress?: (msg: string) => void) {
        if (this.db) return; // Already initialized

        // WASM Cache Busting
        try {
            const cacheKeys = await caches.keys();
            const expectedCacheName = `wasm-cache-${APP_VERSION}`;
            let clearedCache = false;

            for (const key of cacheKeys) {
                if (key.startsWith('wasm-cache-') && key !== expectedCacheName) {
                    await caches.delete(key);
                    clearedCache = true;
                }
            }


            if (clearedCache) {
                const msg = 'Updating DuckDB engine...';
                console.log(msg);
                if (onProgress) onProgress(msg);
            }

        } catch (e) {
            console.error('Failed to clear WASM cache:', e);
        }


        const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
            mvp: {
                mainModule: duckdb_wasm,
                mainWorker: mvp_worker,
            },
            eh: {
                mainModule: duckdb_wasm_eh,
                mainWorker: eh_worker,
            },
            coi: {
                mainModule: duckdb_wasm_coi,
                mainWorker: coi_worker,
                pthreadWorker: coi_pthread_worker
            }
        };

        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();

        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        this.db = db;
        this.conn = await db.connect();
    }

    async registerFile(file: File, tableName: string) {
        if (!this.db || !this.conn) throw new Error("DB not initialized");

        const buffer = new Uint8Array(await file.arrayBuffer());
        await this.db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

        let readFunc = 'read_csv_auto';
        if (file.name.endsWith('.json')) {
            readFunc = 'read_json_auto';
        } else if (file.name.endsWith('.parquet')) {
            readFunc = 'read_parquet';
        }

        const safeFileName = file.name.replace(/'/g, "''");
        await this.conn.query(`CREATE OR REPLACE VIEW ${tableName} AS SELECT * FROM ${readFunc}('${safeFileName}')`);
    }

    async query(sql: string, limit: number = 1000): Promise<QueryResult> {
        if (!this.db || !this.conn) throw new Error("DB not initialized");

        const start = performance.now();
        // Modify query to include limit if not present and limit is specified
        let finalSql = sql.trim().replace(/;$/, '');
        if (limit && !sql.toLowerCase().includes('limit')) {
            finalSql = `${finalSql} LIMIT ${limit}`;
        }

        const result = await this.conn.query(finalSql);
        const executionTimeMs = performance.now() - start;

        // Convert arrow table to array of objects
        const rows = result.toArray().map(row => row.toJSON());
        const columns = result.schema.fields.map(f => f.name);

        return {
            columns,
            rows,
            executionTimeMs,
        };
    }

    async getSchema(tableName: string): Promise<Record<string, string>> {
        if (!this.db || !this.conn) throw new Error("DB not initialized");

        const result = await this.conn.query(`DESCRIBE ${tableName}`);
        const rows = result.toArray().map(row => row.toJSON());

        const schema: Record<string, string> = {};
        for (const row of rows) {
            schema[row.column_name] = row.column_type;
        }

        return schema;
    }
}

expose(new DuckDBService());
