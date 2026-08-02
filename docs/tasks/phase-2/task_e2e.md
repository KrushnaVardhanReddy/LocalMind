TASK: Phase 2 — Docs E2E: End-to-End Testing for Docs Workspace

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Establish a comprehensive, zero-mock Playwright E2E test suite for Phase 2 (LocalMind Docs). This must validate all document processing pipelines — OCR, PDF manipulation, PII redaction, semantic search, and bulk parsing — across Chrome, Firefox, and WebKit.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-2/02_docs_workspace_ui_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Zero WASM Mocking: All tests must exercise the real WASM engines (MuPDF, OpenCV, Tesseract, Transformers.js). 
- Network Isolation: Do NOT rely on outbound network requests during tests. `page.route()` interception is ONLY permitted for outbound AI API calls to prevent flakiness and API costs.
- Speed: Ensure tests are resilient and use appropriate timeouts (`waitForSelector`) as WASM initialization can take a few seconds in CI.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `playwright.config.ts` (Existing config from Phase 1)
- `tests/phase-2/` (Directory for new test specs)
- `tests/fixtures/docs/` (Directory for test assets)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Fixtures: Use or create realistic fixtures (a multi-page PDF invoice, a skewed PNG for OpenCV testing, and a resume PDF containing PII).
- File Uploads: Use Playwright's `locator.setInputFiles()` to simulate user drag-and-drop actions in the Docs upload zone.
- Assertions: When testing OCR or Search, assert that confidence scores are rendered and results match expected fixture text (e.g., `expect(page.getByText('Expected Text')).toBeVisible()`).

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `tests/fixtures/docs/sample_invoice.pdf` (and other required fixtures)
2. NEW: `tests/phase-2/ocr.spec.ts`
3. NEW: `tests/phase-2/pdf.spec.ts`
4. NEW: `tests/phase-2/redaction.spec.ts`
5. NEW: `tests/phase-2/search.spec.ts`

Commit: "test: Phase 2 Docs Workspace Playwright E2E suite"
Target branch: feature/phase2-docs-e2e
