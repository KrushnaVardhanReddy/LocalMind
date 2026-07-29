# Docs-1: Docs Workspace Route & Layout

## Objective
Surface the already-built Docs WASM stack (Tesseract OCR, MuPDF, OpenCV, Semantic Search, PII Redaction) as a first-class `/docs` workspace. All the engines exist — this task is purely UI routing, layout, and wiring.

## Prerequisites
- UX-1 (Workspace Launcher Dashboard) completed — the `/docs` workspace card must navigate to `/docs`.
- Existing workers: Tesseract, MuPDF, OpenCV, Transformers.js (all registered in WorkerManager.ts).

## Implementation

### 1. Route Structure
```
src/routes/docs/
├── +page.svelte          ← Main Docs workspace layout
├── +page.ts              ← Load function (no SSR)
└── components/
    ├── DocsSidebar.svelte     ← File list + upload zone
    ├── DocViewer.svelte       ← PDF/image/text preview panel
    ├── OcrPanel.svelte        ← OCR queue + results panel
    ├── PdfToolsPanel.svelte   ← Merge/split/compress/unlock PDF tools
    └── RedactionPanel.svelte  ← PII detection + visual redaction
```

### 2. Layout (`+page.svelte`)
Three-panel layout:
- **Left sidebar (240px):** File list with drag-and-drop upload zone. Shows file type icon, name, size, and processing status.
- **Center panel (flex):** Document viewer — renders PDF pages via MuPDF, images via `<img>`, text via `<pre>`.
- **Right panel (320px, collapsible):** Tool panel — tabs for OCR, PDF Tools, PII Redaction.

### 3. DocsSidebar.svelte
- Drag-and-drop zone for PDF, PNG, JPG, DOCX files.
- Uses File System Access API when available; falls back to `<input type="file">`.
- Shows processing status for each file: idle / OCR running / done / error.

### 4. OcrPanel.svelte
- "Run OCR" button — queues selected file through Tesseract WASM worker.
- Shows extracted text in a scrollable panel with word confidence highlighting.
- "Copy text" and "Save as .txt" buttons.
- Language selector: English, Spanish, French, German (Tesseract language packs).

### 5. PdfToolsPanel.svelte
Wire the existing MuPDF WASM worker to a simple UI:
- **Merge:** drop multiple PDFs, click Merge → download combined PDF.
- **Split:** enter page ranges (e.g., "1-3, 5, 7-10") → download ZIP of split PDFs.
- **Compress:** quality slider (72 / 150 / 300 DPI) → download compressed PDF.
- **Unlock/Decrypt:** password field → download unlocked PDF.

### 6. WorkspaceNav Integration
- Ensure the `WorkspaceNav` component highlights "Docs" as the active workspace when on `/docs`.

## Acceptance Criteria
- [ ] `/docs` route renders the three-panel layout.
- [ ] Drag-and-drop file upload works for PDF, PNG, JPG.
- [ ] OCR runs via Tesseract WASM and displays extracted text.
- [ ] PDF Merge, Split, Compress, Unlock all produce downloadable files.
- [ ] WorkspaceNav highlights "Docs" as active on `/docs`.
- [ ] No new WASM workers added — all wired to existing WorkerManager entries.
- [ ] Unit tests cover file queue state management and PDF tool invocations.
