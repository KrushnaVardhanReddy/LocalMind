# Task 3.5: Local AI Resume Screener & Ranker

## Objective
Implement a local, fully private resume screening tool that ranks a batch of PDF/DOCX resumes against a job description using semantic similarity — entirely in the browser, with zero PII ever leaving the device.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md`.
- Tasks 1 (OCR), 3 (Semantic Search / Embeddings), 1.8 (Bulk Parsing) must be complete.

## Implementation Steps

### 1. Build the Screener UI
- Create `src/routes/docs/screener/+page.svelte`.
- Two-panel layout:
  - **Left:** Job Description input — either a `<textarea>` or a file drop zone (accepts `.txt`, `.md`, `.pdf`).
  - **Right:** Resume drop zone — accepts a folder of `.pdf` and `.docx` files.

### 2. Job Description Embedding
- When the user submits the job description (text or extracted PDF text), embed it using `EmbeddingsWorkerContract.embed()`.

### 3. Resume Processing Pipeline
- For each dropped resume:
  1. If PDF: use MuPDF to extract embedded text. If scanned, use Tesseract.
  2. If DOCX: use `mammoth.js` (`bun add mammoth`) to extract plain text.
  3. Chunk the resume text into 256-token chunks.
  4. Embed all chunks using `EmbeddingsWorkerContract.embedBatch()`.
  5. Compute the candidate's score as the **max cosine similarity** across all their chunks vs. the job description embedding.

### 4. Ranking Table
- Display a live-updating table as each resume is processed:

| Rank | Candidate Name | Match Score | Key Matching Skills | File |
|------|---------------|-------------|--------------------|----- |
| 1    | (from NER)    | 94%         | (extracted skills) | resume.pdf |

- "Candidate Name" is extracted from the resume text using the NER worker.
- "Key Matching Skills" is extracted via keyword frequency matching against the job description.

### 5. Export Results
- "Export Ranking as CSV" button.
- **Privacy warning**: the CSV contains only names and scores extracted from text — not the raw resume files. Display: "Your resume files have not been uploaded anywhere."

## Definition of Done
- Ranking 50 resumes against a job description completes within 60 seconds.
- The ranking table updates in real time as each resume is processed.
- **No mocks, no cloud.** All embedding, OCR, and NER is local WASM.
- A candidate with directly matching keywords and experience scores highest.
- The privacy warning is prominently displayed.
