import { expose, transfer } from 'comlink';
import * as mupdf from 'mupdf';

export interface PDFMetadata {
    pageCount: number;
    title?: string;
    author?: string;
    fileSizeBytes: number;
}

export interface RedactionRegion {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface MuPDFWorkerContract {
    loadPDF(pdfBuffer: ArrayBuffer): Promise<PDFMetadata>;
    renderPage(pageIndex: number, dpi?: number): Promise<ArrayBuffer>;
    mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<ArrayBuffer>;
    extractPages(startPage: number, endPage: number): Promise<ArrayBuffer>;
    applyRedactions(regions: RedactionRegion[]): Promise<ArrayBuffer>;
    compressPDF(): Promise<ArrayBuffer>;
    extractText(): Promise<string>;
}

export class MuPDFService implements MuPDFWorkerContract {
    private doc: mupdf.Document | null = null;
    private currentPdfBufferLength: number = 0;

    public async loadPDF(pdfBuffer: ArrayBuffer): Promise<PDFMetadata> {
        const uint8 = new Uint8Array(pdfBuffer);

        if (this.doc) {
        }

        this.doc = mupdf.Document.openDocument(uint8, 'application/pdf');
        this.currentPdfBufferLength = pdfBuffer.byteLength;

        const pageCount = this.doc.countPages();
        const title = this.doc.getMetaData(mupdf.Document.META_INFO_TITLE);
        const author = this.doc.getMetaData(mupdf.Document.META_INFO_AUTHOR);

        return {
            pageCount,
            fileSizeBytes: pdfBuffer.byteLength,
            title: title || undefined,
            author: author || undefined,
        };
    }

    public async renderPage(pageIndex: number, dpi: number = 72): Promise<ArrayBuffer> {
        if (!this.doc) {
            throw new Error('PDF not loaded. Call loadPDF first.');
        }

        const page = this.doc.loadPage(pageIndex);
        const scale = dpi / 72;
        const matrix = mupdf.Matrix.scale(scale, scale);

        const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
        const pngBytes = pixmap.asPNG();

        const buffer = new Uint8Array(pngBytes).buffer;

        return transfer(buffer, [buffer]);
    }

    public async mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<ArrayBuffer> {
        const newDoc = new mupdf.PDFDocument();

        for (const buffer of pdfBuffers) {
            const uint8 = new Uint8Array(buffer);
            const srcDoc = mupdf.Document.openDocument(uint8, 'application/pdf') as mupdf.PDFDocument;
            const pageCount = srcDoc.countPages();

            for (let i = 0; i < pageCount; i++) {
                newDoc.graftPage(-1, srcDoc, i);
            }
        }

        const outBuffer = newDoc.saveToBuffer().asUint8Array();
        const finalBuffer = new Uint8Array(outBuffer).buffer;
        return transfer(finalBuffer, [finalBuffer]);
    }

    public async extractPages(startPage: number, endPage: number): Promise<ArrayBuffer> {
        if (!this.doc) {
            throw new Error('PDF not loaded. Call loadPDF first.');
        }

        const newDoc = new mupdf.PDFDocument();

        for (let i = startPage; i <= endPage; i++) {
            newDoc.graftPage(-1, this.doc as mupdf.PDFDocument, i);
        }

        const outBuffer = newDoc.saveToBuffer().asUint8Array();
        const finalBuffer = new Uint8Array(outBuffer).buffer;
        return transfer(finalBuffer, [finalBuffer]);
    }

    public async compressPDF(): Promise<ArrayBuffer> {
        if (!this.doc) {
            throw new Error('PDF not loaded. Call loadPDF first.');
        }

        let pdfDoc: mupdf.PDFDocument;
        if (this.doc instanceof mupdf.PDFDocument) {
            pdfDoc = this.doc;
        } else {
            pdfDoc = this.doc as mupdf.PDFDocument;
        }

        const outBuffer = pdfDoc.saveToBuffer({ compress: true }).asUint8Array();
        const finalBuffer = new Uint8Array(outBuffer).buffer;
        return transfer(finalBuffer, [finalBuffer]);
    }

    public async applyRedactions(regions: RedactionRegion[]): Promise<ArrayBuffer> {
        if (!this.doc) {
            throw new Error('PDF not loaded. Call loadPDF first.');
        }

        let pdfDoc = this.doc as mupdf.PDFDocument;

        for (const region of regions) {
            const page = pdfDoc.loadPage(region.page);
            const annot = page.createAnnotation('Redact');
            annot.setRect([region.x, region.y, region.x + region.width, region.y + region.height]);
            annot.setColor([0, 0, 0]);
            annot.update();
            page.applyRedactions();
        }

        const outBuffer = pdfDoc.saveToBuffer().asUint8Array();
        const finalBuffer = new Uint8Array(outBuffer).buffer;
        return transfer(finalBuffer, [finalBuffer]);
    }

    public async extractText(): Promise<string> {
        if (!this.doc) {
            throw new Error('PDF not loaded. Call loadPDF first.');
        }

        let fullText = '';
        const numPages = this.doc.countPages();
        for (let i = 0; i < numPages; i++) {
            const page = this.doc.loadPage(i);
            try {
                const structuredText = page.toStructuredText('text');
                fullText += structuredText.asText() + '\n\n';
            } catch (e) {
                console.warn(`Failed to extract text from page ${i}:`, e);
            }
        }
        return fullText;
    }
}

expose(new MuPDFService());
