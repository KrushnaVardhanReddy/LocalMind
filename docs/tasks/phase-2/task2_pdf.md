# Task 2: PDF Parsing and Manipulation

## Objective
Integrate local PDF processing capabilities, specifically text extraction and basic manipulation like merging, using MuPDF WASM.

## Prerequisites
- Completion of Task 1 (recommended).
- Review `docs/specs/phase-2/01_document_workspace_spec.md`.

## Implementation Steps

### 1. MuPDF Worker Setup
- Integrate `mupdf.js` (or a suitable WASM alternative).
- Create a dedicated Web Worker file (`src/lib/workers/mupdf.worker.ts`).

### 2. Text Extraction
- Implement logic to parse a PDF file and extract plain text from its pages.
- Handle the `EXTRACT_TEXT_PDF` action (add to contract if necessary).

### 3. PDF Merging UI
- Create a UI view where users can select multiple PDF files.
- Implement a drag-and-drop interface for reordering the files.
- Handle the `MERGE_PDFS` action in the worker to combine the files into a single `ArrayBuffer`.
- Provide a download link or save the merged file locally using the File System Access API.

## Acceptance Criteria
- [ ] Text can be reliably extracted from text-based PDFs locally.
- [ ] Multiple PDFs can be merged into a single document entirely in the browser.
- [ ] Memory limits are respected when handling large PDFs.
