# Task 4: End-to-End Testing — Phase 2 (LocalMind Docs)

## Objective
Establish a comprehensive, zero-mock Playwright E2E test suite for Phase 2 (LocalMind Docs) that validates all document processing pipelines — OCR, PDF manipulation, PII redaction, semantic search, and bulk parsing — across Chrome, Firefox, and WebKit.

## Prerequisites
- All Phase 2 tasks (Tasks 1 through 3.5) must be fully complete and merged.
- Playwright must already be installed from Phase 1 E2E testing.
- **No mocking rule:** All tests must exercise real WASM engines. `page.route()` interception is only permitted for outbound AI API calls. Worker initialization must use real WASM binaries.

## Implementation Steps

### 1. Test Fixtures
- Create `tests/fixtures/docs/`:
  - `sample_invoice.pdf` — a real, multi-page PDF invoice (generate using `pdfkit` script in `scripts/generate-fixtures.ts`).
  - `scanned_document.png` — a real scanned image with visible text (low quality, slightly skewed to test OpenCV).
  - `sample_resume.pdf` — a single-page resume PDF with PII (NAME, EMAIL, PHONE).
  - `job_description.txt` — a plain text job description.

### 2. OCR Tests (`tests/phase-2/ocr.spec.ts`)
```typescript
test('OCR extracts text from a scanned PNG', async ({ page }) => {
    // Drop sample scanned image onto the Docs upload zone
    // Assert: extracted text panel is visible and non-empty
    // Assert: confidence score is displayed
    // Assert: low-confidence warning NOT shown (test image should be clear)
});

test('OCR pipeline includes OpenCV enhancement', async ({ page }) => {
    // Drop scanned_document.png (slightly skewed fixture)
    // Assert: "Enhancing image" progress step appears before "Running OCR"
    // Assert: before/after split view is rendered
    // Assert: OCR result confidence is higher with enhancement enabled
});
```

### 3. PDF Tool Tests (`tests/phase-2/pdf.spec.ts`)
```typescript
test('PDF merge produces a valid downloadable file', async ({ page }) => {
    // Drop two PDF fixtures onto the Merge tool
    // Assert: combined page count equals sum of both source PDFs
    // Trigger download and assert file is non-empty and ends with .pdf
});

test('PDF split extracts correct page range', async ({ page }) => {
    // Drop sample_invoice.pdf (3 pages)
    // Select pages 1–2 in split tool
    // Assert: extracted PDF download has exactly 2 pages
});

test('PDF compress reduces file size', async ({ page }) => {
    // Drop a large PDF
    // Assert: downloaded compressed PDF is smaller than original
});
```

### 4. PII Redaction Tests (`tests/phase-2/redaction.spec.ts`)
```typescript
test('PII scanner detects PERSON and EMAIL in resume', async ({ page }) => {
    // Drop sample_resume.pdf
    // Trigger OCR, then "Scan for PII"
    // Assert: at least one PERSON entity and one EMAIL entity are detected
    // Assert: confidence scores are displayed
    // Assert: "Apply Redactions" button is disabled until user reviews list
});

test('Applying redactions produces a downloadable redacted PDF', async ({ page }) => {
    // Complete PII scan
    // Click "Apply Redactions" → confirm modal
    // Assert: file download is triggered with a .pdf extension
});
```

### 5. Semantic Search Tests (`tests/phase-2/search.spec.ts`)
```typescript
test('Semantic search returns relevant results for a meaning-based query', async ({ page }) => {
    // Pre-index sample_invoice.pdf
    // Search for "payment terms and due date"
    // Assert: at least one result card renders with a similarity score > 0.5
});
```

### 6. Resume Screener Tests (`tests/phase-2/screener.spec.ts`)
```typescript
test('Resume screener ranks matching resume highest', async ({ page }) => {
    // Drop job_description.txt into JD panel
    // Drop sample_resume.pdf into resume drop zone
    // Assert: resume appears in ranking table with a score > 0%
    // Assert: privacy warning banner is visible
});
```

## Definition of Done
- `bun run test:e2e -- tests/phase-2/` passes across Chrome, Firefox, and WebKit.
- **Zero mocks** — all WASM workers must initialize with real binaries.
- All tests pass in CI without requiring a network connection (WASM binaries must be vendored or cached).
- Test runtime for the full Phase 2 suite does not exceed 5 minutes.
