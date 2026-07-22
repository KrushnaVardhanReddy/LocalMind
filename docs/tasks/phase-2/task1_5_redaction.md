# Task 1.5: Browser-Based PII Redaction

## Objective
Implement a local PII detection and redaction workflow using ONNX Runtime Web (NER model) to identify and permanently burn redactions on sensitive documents — all without any data ever leaving the browser.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md` (Section 4.3).
- Review `docs/contracts/phase-2/docs_worker_contracts.md` (NERWorkerContract, MuPDFWorkerContract).
- Tasks 1 (OCR) and 2 (MuPDF) must be complete.

## Implementation Steps

### 1. Install Dependencies
*(Already completed by Antigravity in `feature/dev`. No need to run these commands.)*

### 2. Create the NER Worker
- Create `src/lib/workers/ner.worker.ts`.
- In `init()`, download and cache the `dslim/bert-base-NER` ONNX model from Hugging Face (or bundle a quantized version in `/static/models/`).
- Implement `detectPII(text: string): Promise<PIIEntity[]>` using the tokenizer + ONNX session.
- Map ONNX output labels to `PIIEntityType` values from the contract.
- Call `expose(new NERService())`.

### 3. Register with WorkerManager
*(Already completed by Antigravity. `getNER()` is already in `WorkerManager.ts`.)*

### 4. Build the Redaction UI
- After OCR text extraction, add a "Scan for PII" button.
- On click:
  1. Pass the extracted text to `NERWorkerContract.detectPII()`.
  2. Overlay colored highlight boxes on the document preview for each detected entity, color-coded by type (PERSON = red, EMAIL = orange, etc.).
  3. Show a sidebar list of all detected entities with type, confidence, and a toggle to include/exclude from redaction.
- Add a "Apply Redactions" button. This button is disabled until the user has reviewed the list.

### 5. Apply Redactions via MuPDF
- On "Apply Redactions" confirm:
  1. Map character offsets from OCR word bounding boxes to `RedactionRegion[]`.
  2. Call `MuPDFWorkerContract.applyRedactions(regions)`.
  3. Download the redacted PDF.
- Show a modal: "⚠️ Redactions are permanent. The original file on your disk is unchanged. Do you want to download the redacted copy?"

## Definition of Done
- Dropping a resume PDF → "Scan for PII" → PERSON, EMAIL entities are detected and highlighted.
- Applying redactions produces a downloadable PDF where the redacted regions are fully blacked out.
- NER confidence below 0.7 is marked as "Uncertain" and excluded from auto-selection.
- **No mocks, no cloud.** NER runs via ONNX Runtime Web in a Worker.
- The original file on disk is never modified.
