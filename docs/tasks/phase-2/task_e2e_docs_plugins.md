TASK: Phase 2 — E2E Tests: Docs Plugins (Mermaid, Excalidraw, Doc Diff)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Write comprehensive Playwright E2E tests for the three newly merged Phase 2 Docs plugins:
1. Mermaid.js Diagram Integration (PR #103)
2. Excalidraw Local Whiteboard (PR #102)
3. Document Redline Diffing (PR #101)

These are the only test files to create. Do NOT modify any existing files.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Playwright only. No Vitest unit tests in this task.
- Each spec must be self-contained — no shared state between tests.
- Use `page.waitForSelector` / `page.waitForLoadState('networkidle')` for WASM-dependent features.
- Do NOT mock any workers or WASM modules.
- Always navigate to the correct route before each test (use `beforeEach`).

═══════════════════════════════════════════════════════════════
CONTEXT — REPO LAYOUT
═══════════════════════════════════════════════════════════════
- Mermaid rendering is in `src/routes/docs/markdown/+page.svelte`
- Excalidraw is in `src/lib/components/plugins/excalidraw/` and mounted at `/whiteboard`
- Doc Diff is in `src/lib/components/plugins/doc-diff/` and mounted at `/docs/compare`
- Existing E2E specs for reference: `tests/phase-2/doc-diff.spec.ts`, `tests/phase-8/whiteboard.spec.ts`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════

1. **Mermaid Diagrams (`mermaid.spec.ts`)**:
   - Navigate to `/docs/markdown`
   - Upload or paste a markdown file containing a `mermaid` fenced code block (e.g., a simple flowchart: `graph LR; A-->B`)
   - Wait for the page to render the SVG (selector: `svg[id^="mermaid"]` or `.mermaid-rendered svg`)
   - Assert the SVG is visible and has non-zero dimensions
   - Test the error case: paste invalid Mermaid syntax and assert an error message is shown (not a crash)

2. **Excalidraw Whiteboard (`excalidraw.spec.ts`)**:
   - Navigate to `/whiteboard`
   - Wait for the Excalidraw canvas to be visible (`canvas.excalidraw__canvas` or `.excalidraw`)
   - Simulate drawing by clicking and dragging on the canvas
   - Assert the canvas element exists and is interactive
   - Test toolbar: click the rectangle tool button and verify it becomes active
   - Test export: click the export button and verify a download is triggered (or a dialog appears)

3. **Document Redline Diffing (`doc-diff.spec.ts` — UPDATE existing)**:
   - Check if `tests/phase-2/doc-diff.spec.ts` already has comprehensive coverage
   - If it only has smoke tests, ADD the following scenarios:
     - Upload two different PDF/TXT files and verify the diff view shows added/removed lines highlighted
     - Verify the "Additions" / "Deletions" counter updates correctly
     - Test the toggle between "Unified" and "Split" diff views if available

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `tests/phase-2/mermaid.spec.ts`
2. NEW: `tests/phase-2/excalidraw.spec.ts`
3. MODIFY (if needed): `tests/phase-2/doc-diff.spec.ts` — add deeper coverage scenarios

Commit: "test: Phase 2 E2E — Mermaid, Excalidraw, Doc Diff plugins"
Target branch: feature/dev
