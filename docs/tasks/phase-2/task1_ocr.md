# Task 1: OCR and Text Extraction Integration

## Objective
Implement local Optical Character Recognition (OCR) using Tesseract WASM to extract text from images and scanned documents without cloud APIs.

## Prerequisites
- Review `docs/specs/phase-2/01_document_workspace_spec.md`.
- Review `docs/contracts/phase-2/document_worker_contract.md`.

## Implementation Steps

### 1. Tesseract Worker Setup
- Install `tesseract.js`.
- Create a dedicated Web Worker file (`src/lib/workers/tesseract.worker.ts`).
- Implement the initialization logic to load the Tesseract core and language data files.

### 2. Message Routing
- Implement message handling in the worker for the `EXTRACT_TEXT_OCR` action.
- Ensure the worker reports progress back to the UI (e.g., initialization progress, recognition progress) using the `progress` field in the response contract.

### 3. UI Integration
- Create an Image/Document Viewer component.
- Add an "Extract Text" button that triggers the worker.
- Display a progress bar during extraction.
- Display the extracted text alongside the original image/document.

## Acceptance Criteria
- [ ] Users can upload an image containing text.
- [ ] Tesseract WASM correctly extracts the text locally.
- [ ] The UI thread remains responsive during extraction.
- [ ] Progress indicators are displayed accurately.
