# Task 1.8: Bulk Document Parsing

## Objective
Enable users to drop a folder of PDFs/images (invoices, resumes, contracts) and extract structured JSON/CSV data from all of them in parallel, using OCR and AI template matching — entirely offline.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md`.
- Tasks 1 (OCR), 1.2 (OpenCV), and 2 (MuPDF) must be complete.

## Implementation Steps

### 1. Folder Drop Zone
- Use the `webkitdirectory` attribute on a hidden `<input type="file">` to allow dropping an entire folder.
- Alternatively, support `DataTransferItem.webkitGetAsEntry()` for drag-and-drop folder support.
- Filter accepted types: `.pdf`, `.png`, `.jpg`, `.tiff`.

### 2. Parallel Processing Queue
- Create a `BulkProcessingQueue` class in `src/lib/workers/bulk-queue.ts`.
- Cap concurrency at `Math.min(navigator.hardwareConcurrency - 1, 4)` — never saturate all CPU cores.
- Each job: `{ file: File, status: 'queued' | 'processing' | 'done' | 'error', result?: ExtractionResult }`.

### 3. Extraction Template System
- Create `src/lib/templates/` with pre-built templates for common document types:
  - `invoice.template.json` — extract: vendor name, date, total amount, line items.
  - `resume.template.json` — extract: name, email, phone, skills, work history.
  - `contract.template.json` — extract: parties, effective date, governing law clause.
- Templates define regex and keyword anchors for structured extraction from raw OCR text.

### 4. Results Table
- Render a live-updating data grid (using the existing DuckDB query grid component) showing extraction results.
- Each row: file name, detected document type, extracted fields, confidence score.
- Allow inline editing to correct mis-extractions before export.

### 5. Export
- "Export All as CSV" button: flattens extracted fields into a CSV download.
- "Export All as JSON" button: one JSON object per file.
- Both exports run in a DuckDB WASM query for maximum speed.

## Definition of Done
- Dropping a folder of 50 invoice PDFs processes all within 2 minutes on a modern laptop.
- The live progress grid updates as each file completes.
- Exported CSV contains the correct extracted fields for all processed files.
- **No mocks.** Real Tesseract and MuPDF WASM do all processing.
- Errors (unreadable files) are shown inline in the grid, not silently skipped.
