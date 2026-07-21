import { wrap } from 'comlink';

export class WorkerManager {
    private static instances: Map<string, Worker> = new Map();
    private static proxies: Map<string, any> = new Map();

    private static initDuckDBPromise: Promise<any> | null = null;
    private static initSQLitePromise: Promise<any> | null = null;

    public static async getDuckDB() {
        if (this.proxies.has('duckdb')) {
            return this.proxies.get('duckdb');
        }

        if (!this.initDuckDBPromise) {
            this.initDuckDBPromise = (async () => {
                // Lazy load the worker file ONLY when requested
                const worker = new Worker(new URL('./duckdb.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('duckdb', worker);

                // Wrap with Comlink
                const proxy = wrap<any>(worker);
                await proxy.init(); // Wait for WASM instantiation
                this.proxies.set('duckdb', proxy);
                return proxy;
            })();
        }

        return this.initDuckDBPromise;
    }

    public static async getSQLite() {
        if (this.proxies.has('sqlite')) {
            return this.proxies.get('sqlite');
        }

        if (!this.initSQLitePromise) {
            this.initSQLitePromise = (async () => {
                // Lazy load the worker file ONLY when requested
                const worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('sqlite', worker);

                // Wrap with Comlink
                const proxy = wrap<any>(worker);
                await proxy.init(); // Wait for WASM instantiation
                this.proxies.set('sqlite', proxy);
                return proxy;
            })();
        }

        return this.initSQLitePromise;
    }
}
