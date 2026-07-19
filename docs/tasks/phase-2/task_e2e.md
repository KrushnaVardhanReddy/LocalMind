# Task 4: End-to-End Testing (Phase 2)

## Objective
Implement robust End-to-End tests for the Document Workspace workflows.

## Prerequisites
- Completion of Tasks 1-3.

## Implementation Steps

### 1. Test: OCR Workflow
- Create a test that:
  1. Uploads a sample image containing text (from fixtures).
  2. Triggers the "Extract Text" action.
  3. Verifies that the correct text is extracted and displayed in the UI.

### 4. Test: Semantic Search Flow
- Create a test that:
  1. Uploads a sample text document.
  2. Waits for embedding generation to complete.
  3. Enters a semantic query (a related concept, not an exact keyword).
  4. Verifies that the correct paragraph is returned in the search results.

### 5. Test: PDF Merging
- Create a test that:
  1. Uploads two sample PDFs.
  2. Triggers the merge action.
  3. Verifies that a new file is available for download or preview.

## Acceptance Criteria
- [ ] Playwright E2E tests validate all major Document Workspace features locally.
