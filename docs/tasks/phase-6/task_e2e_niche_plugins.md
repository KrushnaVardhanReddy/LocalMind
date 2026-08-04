TASK: Phase 6 — E2E Tests: Niche Plugin Workspaces (Geo, CAD, Finance, Annotate, Diagrams, Code Interpreter)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Write comprehensive Playwright E2E smoke + interaction tests for the Phase 6 niche plugin workspaces.
These are all feature-complete but currently lack E2E coverage. Each spec must test the primary
happy-path user flow for its workspace.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Playwright only. Focus on UI interaction, not internal state.
- For WASM-heavy workspaces (Pyodide, OpenCV, etc.) use generous timeouts (up to 60s).
- Keep each spec file to the SINGLE workspace it covers. Do not combine workspaces in one file.
- Use `tests/fixtures/` for any required test data files.

═══════════════════════════════════════════════════════════════
CONTEXT — REPO LAYOUT
═══════════════════════════════════════════════════════════════
- Geo-Spatial route: `src/routes/geo/+page.svelte`
- CAD Workspace: (check `src/routes/` for a `cad/` or `whiteboard/` route with CAD mode)
- Finance Workspace route: `src/routes/plugins/finance/`
- Annotate Workspace route: `src/routes/plugins/annotate/`
- Diagrams Workspace route: `src/routes/plugins/diagrams/`
- Code Interpreter route: `src/routes/plugins/code-interpreter/`
- Existing crypto spec for style reference: `tests/phase-6/crypto.spec.ts`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════

1. **Geo-Spatial Workspace (`geospatial.spec.ts`)**:
   - Navigate to `/geo`
   - Wait for the map to render (look for a Leaflet/MapLibre canvas or tile layer)
   - Upload a GeoJSON fixture file and assert it renders on the map as markers/polygons
   - Click a data point/marker and assert a popup or info panel appears

2. **Finance & Tax Workspace (`finance.spec.ts`)**:
   - Navigate to `/plugins/finance`
   - Upload a CSV with transaction data (create `tests/fixtures/transactions.csv`)
   - Assert the workspace loads the data and renders a summary/chart
   - Interact with a filter or date-range picker if available

3. **Annotate Workspace (`annotate.spec.ts`)**:
   - Navigate to `/plugins/annotate`
   - Upload a test image (create `tests/fixtures/sample-image.png`)
   - Wait for the image to appear on the canvas
   - Click the "Draw" or "Rectangle" tool and perform a canvas drag
   - Assert an annotation/shape appears
   - Click "Export" and verify a download is triggered

4. **Diagrams AI Workspace (`diagrams-workspace.spec.ts`)**:
   - Navigate to `/plugins/diagrams`
   - Enter a prompt like "Generate a UML class diagram for a User and Order" in the AI input
   - Submit and wait for Mermaid SVG to render
   - Assert the SVG is visible and contains the expected elements (e.g., "User", "Order" labels)
   - Test the "Export as PNG" or "Export as SVG" button

5. **Code Interpreter — Pyodide (`code-interpreter.spec.ts`)**:
   - Navigate to `/plugins/code-interpreter`
   - Wait for Pyodide to load (the "Ready" or "Python kernel initialized" indicator)
   - Type a simple Python script in the editor: `print("hello from pyodide")`
   - Click "Run" and wait for output
   - Assert the output panel shows `hello from pyodide`
   - Test an error case: type `1/0` and assert the error/traceback is shown

6. **Study Notes & Flashcard Generator (`study-notes.spec.ts`)**:
   - Navigate to `/plugins/study-notes`
   - Upload or paste a text/PDF document
   - Click "Generate Flashcards" and wait for the AI output
   - Assert flashcards appear (front/back cards visible)
   - Click "Next Card" / "Flip" and verify card navigation

7. **Podcast Summarizer (`summarizer.spec.ts`)**:
   - Navigate to `/plugins/summarizer`
   - Upload a short audio fixture (create `tests/fixtures/sample.mp3` — can be a 5-second silent MP3)
   - Click "Transcribe" and wait for Whisper WASM output (generous timeout: 90s)
   - Assert a transcript appears in the output panel
   - Click "Summarize" and wait for AI summary

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW directory: `tests/phase-6/` (already exists, just add to it)
2. NEW: `tests/phase-6/geospatial.spec.ts`
3. NEW: `tests/phase-6/finance.spec.ts`
4. NEW: `tests/phase-6/annotate.spec.ts`
5. NEW: `tests/phase-6/diagrams-workspace.spec.ts`
6. NEW: `tests/phase-6/code-interpreter.spec.ts`
7. NEW: `tests/phase-3/study-notes.spec.ts`
8. NEW: `tests/phase-3/summarizer.spec.ts`
9. NEW fixtures as needed in `tests/fixtures/`

Commit: "test: Phase 6 & 3 E2E — Niche plugins (Geo, Finance, Annotate, Diagrams, Pyodide, Study Notes, Summarizer)"
Target branch: feature/dev
