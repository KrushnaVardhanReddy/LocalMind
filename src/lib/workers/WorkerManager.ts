import { wrap } from 'comlink';
import { workerCrashes, type WorkerName } from '../stores/workerHealth.store';

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
    private static initCADPromise: Promise<any> | null = null;
    private static initGeoPromise: Promise<any> | null = null;
    private static initCryptoPromise: Promise<any> | null = null;
    private static initPyodidePromise: Promise<any> | null = null;
    private static initRegexPromise: Promise<any> | null = null;
    private static initJqPromise: Promise<any> | null = null;

    private static attachErrorListeners(worker: Worker, name: WorkerName) {
        const handleError = (errorMsg: string) => {
            workerCrashes.update(crashes => [...crashes, {
                worker: name,
                error: errorMsg,
                timestamp: Date.now(),
                recoverable: true
            }]);
        };
        worker.addEventListener('error', (e) => handleError(e.message || 'Unknown error'));
        worker.addEventListener('messageerror', () => handleError('Message decoding failed'));
    }

    public static async terminate(name: WorkerName): Promise<void> {
        if (this.instances.has(name)) {
            this.instances.get(name)?.terminate();
            this.instances.delete(name);
        }
        this.proxies.delete(name);

        switch (name) {
            case 'duckdb': this.initDuckDBPromise = null; break;
            case 'sqlite': this.initSQLitePromise = null; break;
            case 'llm': this.initLLMPromise = null; break;
            case 'tesseract': this.initTesseractPromise = null; break;
            case 'datagen': this.initDataGenPromise = null; break;
            case 'treesitter': this.initTreeSitterPromise = null; break;
            case 'ner': this.initNERPromise = null; break;
            case 'ffmpeg': this.initFFmpegPromise = null; break;
            case 'whisper': this.initWhisperPromise = null; break;
            case 'opencv': this.initOpenCVPromise = null; break;
            case 'embeddings': this.initEmbeddingsPromise = null; break;
            case 'mammoth': this.initMammothPromise = null; break;
            case 'converter': this.initConverterPromise = null; break;
            case 'git': this.initGitPromise = null; break;
            case 'logparser': this.initLogParserPromise = null; break;
            case 'visualdiff': this.initVisualDiffPromise = null; break;
            case 'webllm': this.initWebLLMPromise = null; break;
            case 'geo': this.initGeoPromise = null; break;
            case 'crypto': this.initCryptoPromise = null; break;
            case 'pyodide': this.initPyodidePromise = null; break;
            case 'regex': this.initRegexPromise = null; break;
            // muPDF has its own promise structure, handling appropriately
            case 'mupdf': this.initMuPDFPromise = null; break;
        }
    }

    public static async restart(name: WorkerName): Promise<void> {
        await this.terminate(name);
        switch (name) {
            case 'duckdb': await this.getDuckDB(); break;
            case 'sqlite': await this.getSQLite(); break;
            case 'llm': await this.getLLM(); break;
            case 'tesseract': await this.getTesseract(); break;
            case 'datagen': await this.getDataGen(); break;
            case 'treesitter': await this.getTreeSitter(); break;
            case 'ner': await this.getNER(); break;
            case 'ffmpeg': await this.getFFmpeg(); break;
            case 'whisper': await this.getWhisper(); break;
            case 'opencv': await this.getOpenCV(); break;
            case 'embeddings': await this.getEmbeddings(); break;
            case 'mammoth': await this.getMammoth(); break;
            case 'converter': await this.getConverter(); break;
            case 'git': await this.getGit(); break;
            case 'logparser': await this.getLogParser(); break;
            case 'visualdiff': await this.getVisualDiff(); break;
            case 'webllm': await this.getWebLLM(); break;
            case 'geo': await this.getGeo(); break;
            case 'crypto': await this.getCrypto(); break;
            case 'pyodide': await this.getPyodideWorker(); break;
            case 'mupdf': await this.getMuPDF(); break;
        }
    }



    public static async getDuckDB() {
        if (this.proxies.has('duckdb')) {
            return this.proxies.get('duckdb');
        }

        if (!this.initDuckDBPromise) {
            this.initDuckDBPromise = (async () => {
                // Lazy load the worker file ONLY when requested
                const worker = new Worker(new URL('./duckdb.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('duckdb', worker);
                this.attachErrorListeners(worker, 'duckdb');

                // Wrap with Comlink

                // Wrap proxy for OOM detection on query
                const proxy = wrap<any>(worker);
                await proxy.init();

                const wrappedProxy = new Proxy(proxy, {
                    get(target, prop) {
                        if (prop === 'query') {
                            return async (...args: any[]) => {
                                return new Promise((resolve, reject) => {
                                    let isResolved = false;
                                    const timeoutId = setTimeout(() => {
                                        if (isResolved) return;
                                        isResolved = true;
                                        const errorMsg = 'OOM detected';
                                        workerCrashes.update(crashes => [...crashes, {
                                            worker: 'duckdb',
                                            error: errorMsg,
                                            timestamp: Date.now(),
                                            recoverable: false
                                        }]);
                                        reject(new Error(errorMsg));
                                    }, 30000); // 30s

                                    target.query(...args).then((res: any) => {
                                        if (isResolved) return;
                                        isResolved = true;
                                        clearTimeout(timeoutId);
                                        resolve(res);
                                    }).catch((err: any) => {
                                        if (isResolved) return;
                                        isResolved = true;
                                        clearTimeout(timeoutId);
                                        reject(err);
                                    });
                                });
                            };
                        }
                        return (target as any)[prop];
                    }
                });

                this.proxies.set('duckdb', wrappedProxy);
                return wrappedProxy;
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
                this.attachErrorListeners(worker, 'llm');

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
                this.attachErrorListeners(worker, 'tesseract');

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
                this.attachErrorListeners(worker, 'mupdf');

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
                this.attachErrorListeners(worker, 'datagen');

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
                this.attachErrorListeners(worker, 'treesitter');

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
                this.attachErrorListeners(worker, 'ner');

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
                this.attachErrorListeners(worker, 'ffmpeg');

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
                this.attachErrorListeners(worker, 'whisper');

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
                this.attachErrorListeners(worker, 'opencv');

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
                this.attachErrorListeners(worker, 'embeddings');

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
                this.attachErrorListeners(worker, 'mammoth');

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
                this.attachErrorListeners(worker, 'converter');

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
                this.attachErrorListeners(worker, 'git');

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
                this.attachErrorListeners(worker, 'logparser');

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
                this.attachErrorListeners(worker, 'visualdiff');

                const proxy = wrap<any>(worker);
                this.proxies.set('visualdiff', proxy);
                return proxy;
            })();
        }

        return this.initVisualDiffPromise;
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
                this.attachErrorListeners(worker, 'webllm');

                const proxy = wrap<any>(worker);
                this.proxies.set('webllm', proxy);
                return proxy;
            })();
        }

        return this.initWebLLMPromise;
    }

    // CAD WORKSPACE IS DEFERRED POST-MVP
    // public static async getCAD() {
    //     if (this.proxies.has('cad')) {
    //         return this.proxies.get('cad');
    //     }
    //
    //     if (!this.initCADPromise) {
    //         this.initCADPromise = (async () => {
    //             const worker = new Worker(new URL('./cad.worker.ts', import.meta.url), { type: 'module' });
    //             this.instances.set('cad', worker);
    //
    //             const proxy = wrap<any>(worker);
    //             // Let the component call init(), just like other workers (e.g. FFmpeg)
    //             this.proxies.set('cad', proxy);
    //             return proxy;
    //         })();
    //     }
    //
    //     return this.initCADPromise;
    // }

    public static async getGeo() {
        if (this.proxies.has('geo')) {
            return this.proxies.get('geo');
        }

        if (!this.initGeoPromise) {
            this.initGeoPromise = (async () => {
                const worker = new Worker(new URL('./geo.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('geo', worker);
                this.attachErrorListeners(worker, 'geo');

                const proxy = wrap<any>(worker);
                this.proxies.set('geo', proxy);
                return proxy;
            })();
        }

        return this.initGeoPromise;
    }

    public static async getCrypto() {
        if (this.proxies.has('crypto')) {
            return this.proxies.get('crypto');
        }

        if (!this.initCryptoPromise) {
            this.initCryptoPromise = (async () => {
                const worker = new Worker(new URL('./crypto.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('crypto', worker);
                this.attachErrorListeners(worker, 'crypto');

                const proxy = wrap<any>(worker);
                await proxy.init();
                this.proxies.set('crypto', proxy);
                return proxy;
            })();
        }

        return this.initCryptoPromise;
    }


    public static async getRegex() {
        if (this.proxies.has('regex')) {
            return this.proxies.get('regex');
        }

        if (!this.initRegexPromise) {
            this.initRegexPromise = (async () => {
                const worker = new Worker(new URL('./regex.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('regex', worker);
                this.attachErrorListeners(worker, 'regex');

                const proxy = wrap<any>(worker);
                this.proxies.set('regex', proxy);
                return proxy;
            })();
        }

        return this.initRegexPromise;
    }

    public static async getPyodideWorker() {
        if (this.proxies.has('pyodide')) {
            return this.proxies.get('pyodide');
        }

        if (!this.initPyodidePromise) {
            this.initPyodidePromise = (async () => {
                const worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('pyodide', worker);
                this.attachErrorListeners(worker, 'pyodide');

                const proxy = wrap<any>(worker);
                this.proxies.set('pyodide', proxy);
                return proxy;
            })();
        }

        return this.initPyodidePromise;
    }

    public static async getJq() {
        if (this.proxies.has('jq')) {
            return this.proxies.get('jq');
        }

        if (!this.initJqPromise) {
            this.initJqPromise = (async () => {
                const worker = new Worker(new URL('./jq.worker.ts', import.meta.url), { type: 'module' });
                this.instances.set('jq', worker);
                this.attachErrorListeners(worker, 'jq');

                const proxy = wrap<any>(worker);
                this.proxies.set('jq', proxy);
                return proxy;
            })();
        }

        return this.initJqPromise;
    }
}
