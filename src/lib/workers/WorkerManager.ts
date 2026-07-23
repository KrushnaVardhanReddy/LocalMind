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
    private static initTreeSitterPromise: Promise<any> | null = null;
    private static initNERPromise: Promise<any> | null = null;
    private static initFFmpegPromise: Promise<any> | null = null;
    private static initWhisperPromise: Promise<any> | null = null;
    private static initOpenCVPromise: Promise<any> | null = null;
    private static initEmbeddingsPromise: Promise<any> | null = null;
    private static initConverterPromise: Promise<any> | null = null;
    private static initGitPromise: Promise<any> | null = null;
    private static initLogParserPromise: Promise<any> | null = null;
    private static initVisualDiffPromise: Promise<any> | null = null;


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

    private static initWebLLMPromise: Promise<any> | null = null;

    public static async getWebLLM() {
        if (this.proxies.has('webllm')) {
            return this.proxies.get('webllm');
        }

        if (!this.initWebLLMPromise) {
            this.initWebLLMPromise = (async () => {
                const worker = new Worker(new URL('./webllm.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('webllm', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('webllm', proxy);
                return proxy;
            })();
        }

        return this.initWebLLMPromise;
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

    public static async getTreeSitter() {
        if (this.proxies.has('treesitter')) {
            return this.proxies.get('treesitter');
        }

        if (!this.initTreeSitterPromise) {
            this.initTreeSitterPromise = (async () => {
                const worker = new Worker(new URL('./treesitter.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('treesitter', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('treesitter', proxy);
                return proxy;
            })();
        }

        return this.initTreeSitterPromise;
    }

    public static async getNER() {
        if (this.proxies.has('ner')) {
            return this.proxies.get('ner');
        }

        if (!this.initNERPromise) {
            this.initNERPromise = (async () => {
                const worker = new Worker(new URL('./ner.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('ner', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('ner', proxy);
                return proxy;
            })();
        }

        return this.initNERPromise;
    }

    public static async getFFmpeg() {
        if (this.proxies.has('ffmpeg')) {
            return this.proxies.get('ffmpeg');
        }

        if (!this.initFFmpegPromise) {
            this.initFFmpegPromise = (async () => {
                const worker = new Worker(new URL('./ffmpeg.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('ffmpeg', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('ffmpeg', proxy);
                return proxy;
            })();
        }

        return this.initFFmpegPromise;
    }

    public static async getWhisper() {
        if (this.proxies.has('whisper')) {
            return this.proxies.get('whisper');
        }

        if (!this.initWhisperPromise) {
            this.initWhisperPromise = (async () => {
                const worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('whisper', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('whisper', proxy);
                return proxy;
            })();
        }

        return this.initWhisperPromise;
    }

    public static async getOpenCV() {
        if (this.proxies.has('opencv')) {
            return this.proxies.get('opencv');
        }

        if (!this.initOpenCVPromise) {
            this.initOpenCVPromise = (async () => {
                const worker = new Worker(new URL('./opencv.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('opencv', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('opencv', proxy);
                return proxy;
            })();
        }

        return this.initOpenCVPromise;
    }

    public static async getEmbeddings() {
        if (this.proxies.has('embeddings')) {
            return this.proxies.get('embeddings');
        }

        if (!this.initEmbeddingsPromise) {
            this.initEmbeddingsPromise = (async () => {
                const worker = new Worker(new URL('./embeddings.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('embeddings', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('embeddings', proxy);
                return proxy;
            })();
        }

        return this.initEmbeddingsPromise;
    }

    private static initMammothPromise: Promise<any> | null = null;

    public static async getMammoth() {
        if (this.proxies.has('mammoth')) {
            return this.proxies.get('mammoth');
        }

        if (!this.initMammothPromise) {
            this.initMammothPromise = (async () => {
                const worker = new Worker(new URL('./mammoth.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('mammoth', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('mammoth', proxy);
                return proxy;
            })();
        }

        return this.initMammothPromise;
    }

    public static async getConverter() {
        if (this.proxies.has('converter')) {
            return this.proxies.get('converter');
        }

        if (!this.initConverterPromise) {
            this.initConverterPromise = (async () => {
                const worker = new Worker(new URL('./converter.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('converter', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('converter', proxy);
                return proxy;
            })();
        }

        return this.initConverterPromise;
    }

    public static async getGit() {
        if (this.proxies.has('git')) {
            return this.proxies.get('git');
        }

        if (!this.initGitPromise) {
            this.initGitPromise = (async () => {
                const worker = new Worker(new URL('./git.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('git', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('git', proxy);
                return proxy;
            })();
        }

        return this.initGitPromise;
    }

    public static async getLogParser() {
        if (this.proxies.has('logparser')) {
            return this.proxies.get('logparser');
        }

        if (!this.initLogParserPromise) {
            this.initLogParserPromise = (async () => {
                const worker = new Worker(new URL('./log-parser.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('logparser', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('logparser', proxy);
                return proxy;
            })();
        }

        return this.initLogParserPromise;
    }

    public static async getVisualDiff() {
        if (this.proxies.has('visualdiff')) {
            return this.proxies.get('visualdiff');
        }

        if (!this.initVisualDiffPromise) {
            this.initVisualDiffPromise = (async () => {
                const worker = new Worker(new URL('./visual-diff.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('visualdiff', worker);

                const proxy = wrap<any>(worker);
                this.proxies.set('visualdiff', proxy);
                return proxy;
            })();
        }

        return this.initVisualDiffPromise;
    }
}
