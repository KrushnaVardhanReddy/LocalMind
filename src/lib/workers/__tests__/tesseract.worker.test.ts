import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TesseractService } from '../tesseract.worker';
import { WorkerManager } from '../WorkerManager';
import * as tesseract from 'tesseract.js';

vi.mock('comlink', () => ({
    expose: vi.fn(),
    proxy: vi.fn((x) => x)
}));

vi.mock('../WorkerManager', () => ({
    WorkerManager: {
        getMuPDF: vi.fn()
    }
}));

vi.mock('tesseract.js', () => ({
    createWorker: vi.fn()
}));

describe('TesseractService', () => {
    let service: TesseractService;
    let mockTesseractWorker: any;

    beforeEach(() => {
        service = new TesseractService();
        mockTesseractWorker = {
            recognize: vi.fn(),
            terminate: vi.fn()
        };
        (tesseract.createWorker as any).mockResolvedValue(mockTesseractWorker);
    });

    describe('init', () => {
        it('should initialize the tesseract worker with default language', async () => {
            await service.init();
            expect(tesseract.createWorker).toHaveBeenCalledWith(['eng'], 1, expect.any(Object));
        });

        it('should call onProgress callback when logger fires', async () => {
            let loggerFn: any;
            (tesseract.createWorker as any).mockImplementation(async (langs: any, num: any, options: any) => {
                loggerFn = options.logger;
                return mockTesseractWorker;
            });

            await service.init();

            const progressMock = vi.fn();
            service.onProgress = progressMock;

            loggerFn({ status: 'recognizing text', progress: 0.5 });

            expect(progressMock).toHaveBeenCalledWith(0.5, 'recognizing text');
        });
    });

    describe('recognizeImage', () => {
        it('should throw if not initialized', async () => {
            await expect(service.recognizeImage(new ArrayBuffer(10), 'image/png')).rejects.toThrow('Tesseract worker not initialized. Call init() first.');
        });

        it('should correctly call recognize and return formatted OCRResult', async () => {
            await service.init();

            mockTesseractWorker.recognize.mockResolvedValue({
                data: {
                    text: 'Hello World',
                    confidence: 95,
                    words: [
                        { text: 'Hello', confidence: 98, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } },
                        { text: 'World', confidence: 92, bbox: { x0: 15, y0: 0, x1: 25, y1: 10 } }
                    ]
                }
            });

            const buffer = new ArrayBuffer(10);
            const result = await service.recognizeImage(buffer, 'image/png');

            expect(mockTesseractWorker.recognize).toHaveBeenCalledWith(expect.any(Uint8Array), {}, { blocks: true, text: true });

            expect(result.text).toBe('Hello World');
            expect(result.confidence).toBe(95);
            expect(result.words).toHaveLength(2);
            expect(result.words[0]).toEqual({ text: 'Hello', confidence: 98, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } });
            expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        });
    });

    describe('recognizePDF', () => {
        it('should throw if not initialized', async () => {
            await expect(service.recognizePDF(new ArrayBuffer(10))).rejects.toThrow('Tesseract worker not initialized. Call init() first.');
        });

        it('should interact with MuPDF worker correctly when implemented', async () => {
            await service.init();

            const mockMuPDFWorker = {
                loadPDF: vi.fn().mockResolvedValue({ pageCount: 2 }),
                renderPage: vi.fn().mockResolvedValue(new ArrayBuffer(10))
            };
            (WorkerManager.getMuPDF as any).mockResolvedValue(mockMuPDFWorker);

            // Mock recognizeImage to avoid calling real Tesseract behavior
            const mockRecognizeImage = vi.spyOn(service, 'recognizeImage').mockResolvedValue({
                text: 'Page Text',
                confidence: 90,
                words: [],
                executionTimeMs: 10
            });

            const progressMock = vi.fn();
            service.onProgress = progressMock;

            const buffer = new ArrayBuffer(10);
            const results = await service.recognizePDF(buffer);

            expect(WorkerManager.getMuPDF).toHaveBeenCalled();
            expect(mockMuPDFWorker.loadPDF).toHaveBeenCalledWith(buffer);
            expect(mockMuPDFWorker.renderPage).toHaveBeenCalledTimes(2);
            expect(mockMuPDFWorker.renderPage).toHaveBeenNthCalledWith(1, 0);
            expect(mockMuPDFWorker.renderPage).toHaveBeenNthCalledWith(2, 1);

            expect(progressMock).toHaveBeenCalledTimes(2);
            expect(progressMock).toHaveBeenNthCalledWith(1, 0, 'Rendering page 1/2');
            expect(progressMock).toHaveBeenNthCalledWith(2, 0.5, 'Rendering page 2/2');

            expect(mockRecognizeImage).toHaveBeenCalledTimes(2);
            expect(results).toHaveLength(2);
        });
    });
});
