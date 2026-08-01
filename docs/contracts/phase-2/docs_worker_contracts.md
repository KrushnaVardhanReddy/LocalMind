# Contract: Phase 2 — Docs Worker Interfaces

## 1. Tesseract OCR Worker Contract

```typescript
// docs/contracts/phase-2/tesseract_worker_contract.ts

export interface OCRResult {
    text: string;
    confidence: number; // 0–100
    words: Array<{
        text: string;
        confidence: number;
        bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
    executionTimeMs: number;
}

export interface TesseractWorkerContract {
    /**
     * Initializes the Tesseract WASM engine with the specified language models.
     * @param langs - Array of language codes, e.g. ['eng', 'fra']
     */
    init(langs?: string[]): Promise<void>;

    /**
     * Optional callback for receiving progress updates from Tesseract.
     * Use Comlink.proxy() when passing this callback from the main thread.
     */
    onProgress?: (progress: number, status: string) => void;

    /**
     * Runs OCR on a single image (PNG, JPEG, TIFF, BMP, or PDF page raster).
     * The image is passed as an ArrayBuffer to avoid copying via Comlink transfer.
     */
    recognizeImage(imageBuffer: ArrayBuffer, mimeType: string): Promise<OCRResult>;

    /**
     * Runs OCR on all pages of a PDF.
     * Returns an array of OCRResult, one per page.
     */
    recognizePDF(pdfBuffer: ArrayBuffer): Promise<OCRResult[]>;
}
```

## 2. MuPDF Worker Contract

```typescript
// docs/contracts/phase-2/mupdf_worker_contract.ts

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
    /**
     * Loads a PDF into the WASM engine's memory. 
     * Returns metadata. Must be called before all other methods.
     */
    loadPDF(pdfBuffer: ArrayBuffer): Promise<PDFMetadata>;

    /** Render a single page as a PNG raster for display or OCR. */
    renderPage(pageIndex: number, dpi?: number): Promise<ArrayBuffer>;

    /** Merge an array of PDF buffers into a single PDF. */
    mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<ArrayBuffer>;

    /** Extract a range of pages into a new PDF. */
    extractPages(startPage: number, endPage: number): Promise<ArrayBuffer>;

    /** Apply redaction annotations (burn them permanently). */
    applyRedactions(regions: RedactionRegion[]): Promise<ArrayBuffer>;

    /** Compress the loaded PDF, returning a reduced-size ArrayBuffer. */
    compressPDF(): Promise<ArrayBuffer>;
}
```

## 3. NER (PII Detection) Worker Contract

```typescript
// docs/contracts/phase-2/ner_worker_contract.ts

export type PIIEntityType = 'PERSON' | 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'ADDRESS' | 'DATE_OF_BIRTH';

export interface PIIEntity {
    type: PIIEntityType;
    text: string;
    startChar: number;
    endChar: number;
    confidence: number;
}

export interface NERWorkerContract {
    /**
     * Downloads and initializes the NER ONNX model.
     * Must be called once before detection.
     */
    init(): Promise<void>;

    /**
     * Runs PII detection on a plain-text string.
     * Returns all detected PII entities with their character offsets.
     */
    detectPII(text: string): Promise<PIIEntity[]>;
}
```

## 4. Embeddings Worker Contract

```typescript
// docs/contracts/phase-2/embeddings_worker_contract.ts

export interface EmbeddingsWorkerContract {
    /**
     * Downloads and initializes the embedding model (all-MiniLM-L6-v2).
     */
    init(): Promise<void>;

    /**
     * Generates a 384-dimensional embedding vector for a text string.
     */
    embed(text: string): Promise<number[]>;

    /**
     * Batches embedding generation for an array of text chunks.
     */
    embedBatch(chunks: string[]): Promise<number[][]>;

    /**
     * Helper for RAG: format search results into a context string.
     */
    buildContextString(results: { text: string, sourceId: string }[]): string;

    /**
     * Computes cosine similarity between a query vector and an array of chunk embeddings.
     * @param queryVector - 384-dimensional query embedding.
     * @param chunkBlobs - Array of binary embedding blobs (Uint8Array format).
     * @returns Array of cosine similarity scores.
     */
    computeSimilarity(queryVector: number[], chunkBlobs: Uint8Array[]): Promise<number[]>;
}
```

## 5. Diff Worker Contract

```typescript
// docs/contracts/phase-2/diff_worker_contract.ts

export interface DiffResult {
    html: string; // HTML string with <ins> and <del> tags
    additions: number;
    deletions: number;
    executionTimeMs: number;
}

export interface DiffWorkerContract {
    /**
     * Computes the difference between two large text strings using diff-match-patch.
     * Evaluated in a Web Worker to prevent UI blocking.
     */
    computeTextDiff(oldText: string, newText: string): Promise<DiffResult>;
}
```

## 6. Invariants for Jules
1. All `ArrayBuffer` arguments should be transferred (not copied) via Comlink's transfer mechanism: `Comlink.transfer(buffer, [buffer])`.
2. The UI must never call `MuPDF.applyRedactions()` without first displaying a confirmation modal.
3. Embedding vectors are 384-dimension arrays of `float32` — store as `BLOB` in wa-sqlite.
4. NER confidence below 0.7 must be flagged as "low confidence" in the UI — do not auto-redact.
