import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MuPDFService } from './mupdf.worker';
import * as mupdf from 'mupdf';

// Mock comlink global context for tests running in Node
vi.mock('comlink', () => ({
    expose: vi.fn(),
    transfer: (obj: any) => obj, // Just return the object for tests
}));

describe('MuPDFService Worker', () => {
    let service: MuPDFService;
    let dummyPdfBuffer: ArrayBuffer;

    beforeEach(() => {
        service = new MuPDFService();

        // Generate a minimal valid PDF using mupdf natively for testing
        const doc = new mupdf.PDFDocument();
        // create a minimal page
        // TypeScript typings for mupdf are a bit incomplete in this specific test mock scenario.
        // We bypass them for test setup only.
        const anyDoc = doc as any;
        const page1 = anyDoc.addPage([0, 0, 100, 100], 0, new (mupdf.PDFObject as any)(), new mupdf.Buffer(new ArrayBuffer(0)));
        anyDoc.insertPage(-1, page1);
        const page2 = anyDoc.addPage([0, 0, 100, 100], 0, new (mupdf.PDFObject as any)(), new mupdf.Buffer(new ArrayBuffer(0)));
        anyDoc.insertPage(-1, page2);

        const buf = doc.saveToBuffer().asUint8Array();
        dummyPdfBuffer = new Uint8Array(buf).buffer;
    });

    it('loadPDF parses correctly and returns metadata', async () => {
        const metadata = await service.loadPDF(dummyPdfBuffer);
        expect(metadata.pageCount).toBe(2);
        expect(metadata.fileSizeBytes).toBeGreaterThan(0);
    });

    it('renderPage returns a valid ArrayBuffer', async () => {
        await service.loadPDF(dummyPdfBuffer);
        const imgBuffer = await service.renderPage(0, 72);
        expect(imgBuffer).toBeInstanceOf(ArrayBuffer);
        expect(imgBuffer.byteLength).toBeGreaterThan(0);
    });

    it('mergePDFs combines two PDFs', async () => {
        const outBuffer = await service.mergePDFs([dummyPdfBuffer, dummyPdfBuffer]);
        expect(outBuffer).toBeInstanceOf(ArrayBuffer);

        // verify merged has 4 pages
        const testService = new MuPDFService();
        const meta = await testService.loadPDF(outBuffer);
        expect(meta.pageCount).toBe(4);
    });

    it('extractPages reduces page count', async () => {
        await service.loadPDF(dummyPdfBuffer);
        const outBuffer = await service.extractPages(0, 0); // extract only 1st page

        // verify extracted has 1 page
        const testService = new MuPDFService();
        const meta = await testService.loadPDF(outBuffer);
        expect(meta.pageCount).toBe(1);
    });

    it('compressPDF works without error', async () => {
        await service.loadPDF(dummyPdfBuffer);
        const outBuffer = await service.compressPDF();
        expect(outBuffer).toBeInstanceOf(ArrayBuffer);
        expect(outBuffer.byteLength).toBeGreaterThan(0);
        // It might not be smaller for an already tiny 2-page dummy pdf, so just test it runs.
    });

    it('applyRedactions runs without error', async () => {
        await service.loadPDF(dummyPdfBuffer);
        const outBuffer = await service.applyRedactions([{ page: 0, x: 10, y: 10, width: 20, height: 20 }]);
        expect(outBuffer).toBeInstanceOf(ArrayBuffer);
        expect(outBuffer.byteLength).toBeGreaterThan(0);
    });
});
