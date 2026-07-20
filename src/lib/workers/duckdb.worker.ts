import { expose } from 'comlink';

export interface QueryResult {
    columns: string[];
    rows: any[];
    executionTimeMs: number;
}

export interface DuckDBWorkerContract {
    /**
     * Initializes the WASM engine. Called once.
     */
    init(): Promise<void>;

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
    private db: any = null;

    async init() {
        // Initialize DuckDB WASM here
        // This is only called once.
        this.db = {};
    }

    async registerFile(file: File, tableName: string) {
        // Stub
    }

    async query(sql: string, limit?: number): Promise<QueryResult> {
        if (!this.db) throw new Error("DB not initialized");

        return {
            columns: ['stub_col'],
            rows: [{ stub_col: 'stub_val' }],
            executionTimeMs: 0,
        };
    }

    async getSchema(tableName: string): Promise<Record<string, string>> {
        return {
            stub_col: 'VARCHAR'
        };
    }
}

expose(new DuckDBService());
