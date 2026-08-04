TASK: Phase 13 — E2E Tests: Universal Document Q&A & Directory Semantic Search

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Write comprehensive Playwright E2E tests for the two Universal Document Plugin workspaces:
1. Universal Document Q&A Workspace (PR #98)
2. Local Directory Semantic Search (PR #99)

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Playwright only. These are browser-level integration tests.
- WebLLM is heavy — use `page.waitForSelector` with generous timeouts (up to 60s) for AI operations.
- Do NOT mock WebLLM or embeddings workers. Tests must run against real WASM binaries.
- Place fixture PDFs in `tests/fixtures/` (create small, < 100KB test PDFs with known content).

═══════════════════════════════════════════════════════════════
CONTEXT — REPO LAYOUT
═══════════════════════════════════════════════════════════════
- Universal Doc Q&A route: `src/routes/plugins/universal-doc/`
- Universal Doc Q&A component: `src/lib/components/plugins/universal-doc/`
- Directory Search route: `src/routes/plugins/directory-search/`
- Directory Search component: `src/lib/components/plugins/directory-search/`
- Embeddings worker: `src/lib/workers/embeddings.worker.ts`
- Spec: `docs/specs/phase-13/01_universal_document_plugins_spec.md`
- Existing unit tests for reference: `src/lib/components/plugins/directory-search/__tests__/`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════

1. **Universal Document Q&A (`universal-doc-qa.spec.ts`)**:
   - Navigate to `/plugins/universal-doc`
   - Upload a small PDF fixture (create `tests/fixtures/sample-contract.pdf` with known text like "The payment amount is $5,000")
   - Wait for the document to load and process (loader/spinner should disappear)
   - Type a question in the Q&A input: "What is the payment amount?"
   - Submit the question and wait for the AI response (can take up to 60s on first load)
   - Assert the response contains relevant text (or at least is not empty)
   - Test multiple questions in sequence (conversation continuity)
   - Test uploading a second document and verifying the context switches

2. **Directory Semantic Search (`directory-search.spec.ts`)**:
   - Navigate to `/plugins/directory-search`
   - Upload a folder with at least 2 test text files (use `tests/fixtures/` PDFs or TXTs)
   - Wait for the embedding process to complete (progress bar or "Ready" indicator)
   - Type a semantic search query relevant to the fixture content
   - Assert search results appear with file names and relevant snippets
   - Click a result and verify it opens/highlights correctly
   - Test an unrelated query and verify it returns low-confidence or no results

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `tests/phase-13/universal-doc-qa.spec.ts`
2. NEW: `tests/phase-13/directory-search.spec.ts`
3. NEW fixture: `tests/fixtures/sample-contract.pdf` (small PDF with known text content)
4. NEW fixture: `tests/fixtures/sample-report.txt` (plain text with known paragraphs)

Commit: "test: Phase 13 E2E — Universal Doc Q&A & Directory Semantic Search"
Target branch: feature/dev
