import { wrap } from 'comlink';
import { addCrashEvent } from '../stores/workerHealth.store.js';


export class WorkerManager {
    private static instances: Map<string, Worker> = new Map();
    private static duckdbRegisteredFiles: { file: File, tableName: string }[] = [];

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



    private static registerWorkerListeners(workerName: string, worker: Worker) {
        worker.onerror = (err) => {
            addCrashEvent({ workerName, error: err.message || 'Worker crashed', type: 'crash' });
        };
        worker.onmessageerror = () => {
            addCrashEvent({ workerName, error: 'Worker message error (malformed input)', type: 'crash' });
        };
    }


    public static async restartWorker(workerName: string) {
        const worker = this.instances.get(workerName);
        if (worker) {
            worker.terminate();
        }
        this.instances.delete(workerName);
        this.proxies.delete(workerName);

        switch (workerName) {
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
        }

        if (workerName === 'duckdb') {
            const newDb = await this.getDuckDB();
            for (const f of this.duckdbRegisteredFiles) {
                try {
                    await newDb.registerFile(f.file, f.tableName);
                } catch (e) {
                    console.error("Failed to re-register file on DuckDB restart", e);
                }
            }
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
                this.registerWorkerListeners('duckdb', worker);
                this.instances.set('duckdb', worker);

                // Wrap with Comlink
                const proxy = wrap<any>(worker);
                await proxy.init(); // Wait for WASM instantiation

                // Use a JS Proxy to intercept calls to the Comlink proxy safely
                const wrappedProxy = new Proxy(proxy, {
                    get: (target, prop) => {
                        if (prop === 'registerFile') {
                            return async (file: File, tableName: string) => {
                                this.duckdbRegisteredFiles.push({ file, tableName });
                                return await target.registerFile(file, tableName);
                            };
                        }
                        if (prop === 'query') {
                            return async (...args: any[]) => {
                                try {
                                    return await Promise.race([
                                        target.query(...args),
                                        new Promise((_, reject) => setTimeout(() => reject(new Error('OOM Timeout')), 30000))
                                    ]);
                                } catch (err: any) {
                                    if (err.message === 'OOM Timeout') {
                                        addCrashEvent({ workerName: 'duckdb', error: 'OOM Timeout detected', type: 'oom' });
                                    }
                                    throw err;
                                }
                            };
                        }
                        return target[prop as keyof typeof target];
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
                this.registerWorkerListeners('sqlite', worker);
                this.instances.set('sqlite', worker);

                // Wrap with Comlink
                const proxy = wrap<any>(worker);
                await proxy.init(); // Wait for WASM instantiation

                const wrappedProxy = new Proxy(proxy, {
                    get: (target, prop) => {
                        if (prop === 'query') {
                            return async (...args: any[]) => {
                                try {
                                    return await Promise.race([
                                        target.query(...args),
                                        new Promise((_, reject) => setTimeout(() => reject(new Error('OOM Timeout')), 30000))
                                    ]);
                                } catch (err: any) {
                                    if (err.message === 'OOM Timeout') {
                                        addCrashEvent({ workerName: 'sqlite', error: 'OOM Timeout detected', type: 'oom' });
                                    }
                                    throw err;
                                }
                            };
                        }
                        return target[prop as keyof typeof target];
                    }
                });

                this.proxies.set('sqlite', wrappedProxy);
                return wrappedProxy;
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
                this.registerWorkerListeners('llm', worker);
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
                this.registerWorkerListeners('tesseract', worker);
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
                this.registerWorkerListeners('mupdf', worker);
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
                this.registerWorkerListeners('datagen', worker);
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
                this.registerWorkerListeners('treesitter', worker);
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
                this.registerWorkerListeners('ner', worker);
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
                this.registerWorkerListeners('ffmpeg', worker);
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
                this.registerWorkerListeners('whisper', worker);
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
                this.registerWorkerListeners('opencv', worker);
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
                this.registerWorkerListeners('embeddings', worker);
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
                this.registerWorkerListeners('mammoth', worker);
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
                this.registerWorkerListeners('converter', worker);
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
                this.registerWorkerListeners('git', worker);
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
                this.registerWorkerListeners('logparser', worker);
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
                this.registerWorkerListeners('visualdiff', worker);
                this.instances.set('visualdiff', worker);

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
                this.registerWorkerListeners('webllm', worker);
                this.instances.set('webllm', worker);

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
                this.registerWorkerListeners('geo', worker);
                this.instances.set('geo', worker);

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
                this.registerWorkerListeners('crypto', worker);
                this.instances.set('crypto', worker);

                const proxy = wrap<any>(worker);
                await proxy.init();
                this.proxies.set('crypto', proxy);
                return proxy;
            })();
        }

        return this.initCryptoPromise;
    }
}
