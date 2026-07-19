import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

type WorkerMessage<T = any> = {
  id: string;
  action: 'INIT' | 'LOAD_FILE' | 'EXECUTE_QUERY' | 'CANCEL_QUERY';
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
        throw new Error("LOAD_FILE not implemented yet");

      case 'CANCEL_QUERY':
        throw new Error("CANCEL_QUERY not implemented yet");

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
