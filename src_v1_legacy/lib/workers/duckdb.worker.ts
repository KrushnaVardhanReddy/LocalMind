import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

type WorkerMessage<T = any> = {
  id: string;
  action: 'INIT' | 'LOAD_FILE' | 'EXECUTE_QUERY' | 'CANCEL_QUERY' | 'GET_COLUMN_STATS';
  payload: T;
};

type WorkerResponse<T = any> = {
  id: string;
  status: 'SUCCESS' | 'ERROR';
  data?: T;
  error?: string;
};

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: duckdb_wasm,
        mainWorker: mvp_worker,
    },
    eh: {
        mainModule: duckdb_wasm_eh,
        mainWorker: eh_worker,
    },
};

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

async function initDB() {
    if (db) return;

    console.log("Worker: Starting initDB");
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    console.log("Worker: Selected bundle", bundle);

    // We need to resolve the worker URL properly in Vite for the DuckDB worker.
    // The ?url suffix in Vite gives a string path, but new Worker expects a URL if it's external, or just works with the path.
    // Since mvp_worker is a URL string provided by Vite, we can pass it to a new Worker.
    // NOTE: DuckDB might need blob URLs depending on CORS, but Vite's asset handling should make it same-origin.

    const worker = new Worker(bundle.mainWorker!);
    console.log("Worker: Worker spawned");
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    console.log("Worker: Calling instantiate");
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    console.log("Worker: Instantiated, calling connect");
    conn = await db.connect();
    console.log("Worker: Connected");
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, action, payload } = e.data;
  console.log("Worker: Received message", { id, action });

  try {
    switch (action) {
      case 'INIT':
        await initDB();
        postMessage({
            id,
            status: 'SUCCESS',
            data: { ready: true }
        } as WorkerResponse);
        break;

      case 'EXECUTE_QUERY':
        if (!conn) throw new Error("DuckDB is not initialized");
        const { query } = payload;

        const result = await conn.query(query);
        const rows = result.toArray().map((r: any) => r.toJSON());

        postMessage({
            id,
            status: 'SUCCESS',
            data: { rows, durationMs: 0 }
        } as WorkerResponse);
        break;

      case 'LOAD_FILE':
        if (!db || !conn) throw new Error("DuckDB is not initialized");
        const { tableName, fileFormat, file } = payload;

        if (!file) throw new Error("No file provided");

        console.log(`Worker: Loading file ${file.name} as ${tableName}`);

        // Register the file in DuckDB's virtual file system
        await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

        // Load data into DuckDB table based on format
        let loadQuery = '';
        if (fileFormat === 'CSV') {
            loadQuery = `CREATE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${file.name}')`;
        } else if (fileFormat === 'JSON') {
            loadQuery = `CREATE TABLE ${tableName} AS SELECT * FROM read_json_auto('${file.name}')`;
        } else if (fileFormat === 'PARQUET') {
            loadQuery = `CREATE TABLE ${tableName} AS SELECT * FROM read_parquet('${file.name}')`;
        } else {
            // Try inference or fallback to CSV
            loadQuery = `CREATE TABLE ${tableName} AS SELECT * FROM '${file.name}'`;
        }

        // Drop table if it exists
        await conn.query(`DROP TABLE IF EXISTS ${tableName}`);

        // Execute the load query
        await conn.query(loadQuery);

        // Get row count
        const countResult = await conn.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = Number(countResult.toArray()[0].toJSON().count);

        // Infer schema
        const schemaResult = await conn.query(`PRAGMA table_info('${tableName}')`);
        const schema = schemaResult.toArray().map((r: any) => r.toJSON());

        postMessage({
            id,
            status: 'SUCCESS',
            data: { rowCount, schema }
        } as WorkerResponse);
        break;

      case 'CANCEL_QUERY':
        throw new Error("CANCEL_QUERY not implemented yet");

      case 'GET_COLUMN_STATS':
        if (!conn) throw new Error("DuckDB is not initialized");
        const { tableName: statsTable, columnName: statsColumn } = payload;

        // Use double quotes for identifiers in case they have spaces or special characters
        const queryStr = `
          SELECT
            MIN("${statsColumn}") as min,
            MAX("${statsColumn}") as max,
            AVG(TRY_CAST("${statsColumn}" AS DOUBLE)) as mean,
            COUNT(CASE WHEN "${statsColumn}" IS NULL THEN 1 END) as nullCount,
            COUNT(DISTINCT "${statsColumn}") as uniqueValues
          FROM "${statsTable}"
        `;
        const statsResult = await conn.query(queryStr);
        const stats = statsResult.toArray()[0].toJSON();

        // Convert bigints to numbers or strings to avoid serialization issues
        const sanitizeStats = (val: any) => typeof val === 'bigint' ? Number(val) : val;

        postMessage({
            id,
            status: 'SUCCESS',
            data: {
              min: sanitizeStats(stats.min),
              max: sanitizeStats(stats.max),
              mean: sanitizeStats(stats.mean),
              nullCount: sanitizeStats(stats.nullCount),
              uniqueValues: sanitizeStats(stats.uniqueValues)
            }
        } as WorkerResponse);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err: any) {
    console.error("Worker Error:", err);
    postMessage({
      id,
      status: 'ERROR',
      error: err.message || 'Unknown error'
    } as WorkerResponse);
  }
};
