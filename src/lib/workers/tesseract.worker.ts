import { expose } from 'comlink';
import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';
import { WorkerManager } from './WorkerManager';

export interface OCRResult {
    text: string;
    confidence: number;
    words: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
    executionTimeMs: number;
}

export interface TesseractWorkerContract {
    init(langs?: string[]): Promise<void>;
    onProgress?: (progress: number, status: string) => void;
    recognizeImage(imageBuffer: ArrayBuffer, mimeType: string): Promise<OCRResult>;
    recognizePDF(pdfBuffer: ArrayBuffer): Promise<OCRResult[]>;
}

export class TesseractService implements TesseractWorkerContract {
    private worker: TesseractWorker | null = null;
    public onProgress?: (progress: number, status: string) => void;

    public async init(langs: string[] = ['eng']): Promise<void> {
        this.worker = await createWorker(langs, 1, {
            logger: (m) => {
                if (this.onProgress && m.status) {
                    // tesseract.js logger returns progress as 0-1.
                    this.onProgress(m.progress, m.status);
                }
            },
            workerPath: '/tesseract/worker.min.js',
            langPath: '/tesseract/lang-data',
            corePath: '/tesseract/tesseract-core.wasm.js',
        });
    }

    public async recognizeImage(imageBuffer: ArrayBuffer, mimeType: string): Promise<OCRResult> {
        if (!this.worker) {
            throw new Error('Tesseract worker not initialized. Call init() first.');
        }

        const startTime = performance.now();
        // tesseract.js worker.recognize behaves weirdly with Blobs in some node/browser polyfill envs.
        // ArrayBuffer directly usually works, or Uint8Array.
        const buffer = new Uint8Array(imageBuffer);
        // Cast buffer to any since tesseract types expect ImageLike which lacks Uint8Array in this typescript version
        const { data } = await this.worker.recognize(buffer as any, {}, { blocks: true, text: true });
        const executionTimeMs = performance.now() - startTime;

        const words: any[] = [];
        if (data.blocks) {
            for (const block of data.blocks) {
                if (block.paragraphs) {
                    for (const paragraph of block.paragraphs) {
                        if (paragraph.lines) {
                            for (const line of paragraph.lines) {
                                if (line.words) {
                                    for (const word of line.words) {
                                        words.push({
                                            text: word.text,
                                            confidence: word.confidence,
                                            bbox: {
                                                x0: word.bbox.x0,
                                                y0: word.bbox.y0,
                                                x1: word.bbox.x1,
                                                y1: word.bbox.y1,
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else if ((data as any).words) {
             for (const word of (data as any).words) {
                words.push({
                    text: word.text,
                    confidence: word.confidence,
                    bbox: {
                        x0: word.bbox.x0,
                        y0: word.bbox.y0,
                        x1: word.bbox.x1,
                        y1: word.bbox.y1,
                    }
                });
             }
        }

        return {
            text: data.text,
            confidence: data.confidence,
            words,
            executionTimeMs
        };
    }

    public async recognizePDF(pdfBuffer: ArrayBuffer): Promise<OCRResult[]> {
        if (!this.worker) {
            throw new Error('Tesseract worker not initialized. Call init() first.');
        }

        // Tesseract directly doesn't extract text well from PDF without rasterizing
        // The contract states we use MuPDF to render pages.
        const muPDF = await WorkerManager.getMuPDF(); // This will throw NotImplementedError per current implementation

        // This code won't be reached until MuPDF is implemented, but to satisfy the contract:
        const results: OCRResult[] = [];
        // Cast muPDF to any to bypass TS error since WorkerManager.getMuPDF() currently returns void/Promise<void> or throws
        const metadata = await (muPDF as any).loadPDF(pdfBuffer);

        for (let i = 0; i < metadata.pageCount; i++) {
            if (this.onProgress) {
                this.onProgress(i / metadata.pageCount, `Rendering page ${i + 1}/${metadata.pageCount}`);
            }
            const rasterBuffer = await (muPDF as any).renderPage(i);
            const result = await this.recognizeImage(rasterBuffer, 'image/png');
            results.push(result);
        }

        return results;
    }
}

expose(new TesseractService());
