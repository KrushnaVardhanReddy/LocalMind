# Task 1: Local OCR Integration (Tesseract WASM)

## Objective
Implement the Tesseract OCR Web Worker to extract text from dropped images and scanned PDF pages entirely in the browser, with zero cloud dependency.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md`.
- Review `docs/contracts/phase-2/docs_worker_contracts.md` (TesseractWorkerContract).
- Phase 1 WorkerPool (Task 1) must be complete — Tesseract registers through `WorkerManager`.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add tesseract.js
```

### 2. Create the Tesseract Worker
- Create `src/lib/workers/tesseract.worker.ts`.
- Implement `TesseractWorkerContract` strictly.
- Use `Tesseract.createWorker()` in `init()` with language `'eng'` by default.
- `recognizeImage()`: accepts an `ArrayBuffer`, converts it to a `Blob`, passes to `worker.recognize()`.
- `recognizePDF()`: use the MuPDF worker (via `WorkerManager.getMuPDF()`) to render each page as a PNG, then run `recognizeImage()` per page.
- Expose progress events via a `onProgress` callback in the contract for the UI loading bar.
- Call `expose(new TesseractService())` at the end.

### 3. Register with WorkerManager
- Add `WorkerManager.getTesseract()` following the Singleton lazy-loading pattern.

### 4. Build the Docs Upload UI
- Create `src/routes/docs/+page.svelte`.
- Implement a drag-and-drop zone that accepts: `.pdf`, `.png`, `.jpg`, `.tiff`, `.bmp`.
- On file drop, display a processing state with a progress bar bound to OCR progress.

### 5. Display OCR Results
- Render the extracted text in a `<pre>` block with copy-to-clipboard functionality.
- Show per-word confidence scores as a color gradient overlay on the original image (green = high, red = low).
- Display a warning banner if the overall confidence is below 80%.

## Definition of Done
- Dropping a scanned invoice PNG produces extracted text within 10 seconds on a modern laptop.
- Confidence scores are displayed per-word.
- Low confidence warning banner renders correctly.
- **No mocks, no cloud.** Tesseract WASM is the real engine.
- The main thread is not blocked during OCR — the UI remains interactive.
