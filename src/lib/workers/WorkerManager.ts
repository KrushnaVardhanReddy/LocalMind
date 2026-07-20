import { wrap } from 'comlink';

export class WorkerManager {
    private static instances: Map<string, Worker> = new Map();
    private static proxies: Map<string, any> = new Map();

    private static initPromise: Promise<any> | null = null;

    public static async getDuckDB() {
        if (this.proxies.has('duckdb')) {
            return this.proxies.get('duckdb');
        }

        if (!this.initPromise) {
            this.initPromise = (async () => {
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

        return this.initPromise;
    }
}
