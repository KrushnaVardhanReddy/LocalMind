# Phase 2: Document Workspace — Testing Specification

## 1. Overview
This specification defines the End-to-End (E2E) testing requirements for Phase 2 of the Document Workspace. Tests use Playwright against the local SvelteKit dev server. All test fixtures are committed to `tests/fixtures/phase-2/`.

## 2. Test Fixtures Required
- `sample_invoice.jpg` — A scanned image containing clear printed text (used for OCR testing).
- `document_a.pdf` and `document_b.pdf` — Two short PDFs (used for merge testing).
- `research_article.txt` — A multi-paragraph text document (used for semantic search testing).

## 3. Test Scenarios

### 3.1 OCR Workflow
- **Pre-condition**: Document Workspace is initialized.
- **Action**: Upload `sample_invoice.jpg` via the file picker.
- **Verification**:
  1. Tesseract WASM worker initializes and a loading indicator is visible.
  2. Extracted text appears in the text viewer panel within 30 seconds.
  3. The extracted text contains at least one expected keyword from the fixture (e.g., "Invoice").
  4. A "Copy Text" action is available and copies the content to clipboard.

### 3.2 PDF Merge
- **Pre-condition**: Document Workspace is initialized.
- **Action**: Upload `document_a.pdf` and `document_b.pdf`. Select both and trigger the merge action.
- **Verification**:
  1. A merged PDF is offered for download or previewed inline.
  2. The resulting document contains page content from both input files.

### 3.3 Semantic Search
- **Pre-condition**: `research_article.txt` is uploaded and embeddings have been generated.
- **Action**: Enter a semantic query that is conceptually related but not lexically matching a known paragraph.
- **Verification**:
  1. The correct paragraph from the fixture is returned in the top 3 results.
  2. Results are ranked by semantic relevance score.
  3. The query does not send any document content to an external API.

### 3.4 Accessibility Audit
- **Action**: Load the Document Workspace with a file active.
- **Verification**: Run `@axe-core/playwright` scan. Zero violations at `critical` or `serious` impact level.

## 4. Acceptance Criteria
- [ ] All Playwright scenarios pass against the local build.
- [ ] No axe-core violations at `critical` or `serious` level.
- [ ] Test fixtures are committed to `tests/fixtures/phase-2/`.
