# Task 2: Local PDF Manipulation (MuPDF WASM)

## Objective
Implement the MuPDF WASM Web Worker to provide a full suite of PDF manipulation tools: merge, split, compress, and render — all running locally without any server-side processing.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md`.
- Review `docs/contracts/phase-2/docs_worker_contracts.md` (MuPDFWorkerContract).
- Task 1 (OCR) must be complete — MuPDF renders PDF pages for Tesseract.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add mupdf
```

### 2. Create the MuPDF Worker
- Create `src/lib/workers/mupdf.worker.ts`.
- Implement all methods of `MuPDFWorkerContract` strictly.
- `loadPDF()`: reads an `ArrayBuffer`, loads into MuPDF's `Document.openDocument()`, returns metadata.
- `renderPage()`: renders a page at the specified DPI using `Page.toImageData()`, returns PNG `ArrayBuffer`.
- `mergePDFs()`: iterates through all input buffers, loads each as a MuPDF Document, copies all pages into a new Document.
- `extractPages()`: creates a new Document, copies only the specified page range.
- `applyRedactions()`: uses MuPDF's annotation API to draw filled black rectangles and flatten them.
- `compressPDF()`: re-saves the document with `{ linearize: true, compress: true }` options.
- Call `expose(new MuPDFService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getMuPDF()` with the Singleton lazy-loading pattern.

### 4. Build the PDF Tools UI
- Create `src/routes/docs/pdf/+page.svelte` with the following tool tabs:
  - **Viewer:** Render PDF pages progressively using `renderPage()`. Show a thumbnail strip on the left.
  - **Merge:** Multi-file drop zone. Drag to reorder PDFs. "Merge" button downloads the combined file.
  - **Split:** Page range input. Preview selected pages. "Extract" downloads the sliced PDF.
  - **Compress:** Show original size vs. compressed size estimate. "Compress & Download" button.

### 5. Page Preview
- Use the `renderPage()` output to display page thumbnails in an `<img>` element via `URL.createObjectURL(new Blob([arrayBuffer], { type: 'image/png' }))`.
- Release object URLs with `URL.revokeObjectURL()` after rendering to prevent memory leaks.

## Definition of Done
- A 50-page PDF can be split into individual pages without crashing.
- Merging 5 PDFs into one produces a valid, openable combined PDF.
- Compression reduces a typical text PDF by at least 30%.
- **No mocks.** MuPDF WASM is the real engine.
- Object URL cleanup is verified — no memory leak on page re-render.
