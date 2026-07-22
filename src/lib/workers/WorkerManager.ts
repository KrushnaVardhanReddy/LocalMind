import { wrap } from 'comlink';

export class WorkerManager {
    private static instances: Map<string, Worker> = new Map();
    private static proxies: Map<string, any> = new Map();
    private static pluginProxies: Map<string, any> = new Map();

    private static initDuckDBPromise: Promise<any> | null = null;
    private static initSQLitePromise: Promise<any> | null = null;
    private static initLLMPromise: Promise<any> | null = null;
    private static initTesseractPromise: Promise<any> | null = null;
    private static initDataGenPromise: Promise<any> | null = null;

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

    public static registerPluginWorker(pluginId: string, worker: Worker, proxy: any) {
        this.instances.set(`plugin_${pluginId}`, worker);
        this.pluginProxies.set(pluginId, proxy);
    }

    public static getPluginWorker(pluginId: string) {
        return this.pluginProxies.get(pluginId);
    }

    public static removePluginWorker(pluginId: string) {
        const worker = this.instances.get(`plugin_${pluginId}`);
        if (worker) {
            worker.terminate();
            this.instances.delete(`plugin_${pluginId}`);
        }
        this.pluginProxies.delete(pluginId);
    }

    public static async getLLM() {
        if (this.proxies.has('llm')) {
            return this.proxies.get('llm');
        }

        if (!this.initLLMPromise) {
            this.initLLMPromise = (async () => {
                const worker = new Worker(new URL('./llm.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('llm', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('llm', proxy);
                return proxy;
            })();
        }

        return this.initLLMPromise;
    }

    public static async getTesseract() {
        if (this.proxies.has('tesseract')) {
            return this.proxies.get('tesseract');
        }

        if (!this.initTesseractPromise) {
            this.initTesseractPromise = (async () => {
                const worker = new Worker(new URL('./tesseract.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('tesseract', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('tesseract', proxy);
                return proxy;
            })();
        }

        return this.initTesseractPromise;
    }

    private static initMuPDFPromise: Promise<any> | null = null;

    public static async getMuPDF() {
        if (this.proxies.has('mupdf')) {
            return this.proxies.get('mupdf');
        }

        if (!this.initMuPDFPromise) {
            this.initMuPDFPromise = (async () => {
                const worker = new Worker(new URL('./mupdf.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('mupdf', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('mupdf', proxy);
                return proxy;
            })();
        }

        return this.initMuPDFPromise;
    }

    public static async getDataGen() {
        if (this.proxies.has('datagen')) {
            return this.proxies.get('datagen');
        }

        if (!this.initDataGenPromise) {
            this.initDataGenPromise = (async () => {
                const worker = new Worker(new URL('./datagen.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('datagen', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('datagen', proxy);
                return proxy;
            })();
        }

        return this.initDataGenPromise;
    }
}
