TASK: Phase 4 — E2E Tests: DevTools Workspace (Git, Log Parser, HAR, PCAP, Pipelines, PII Sanitizer)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Write comprehensive Playwright E2E tests for the LocalMind DevTools workspace. The DevTools workspace
(`/devtools`) is a multi-tool hub for developers. It currently has NO E2E coverage at all — this task
must create a full `tests/phase-4/` test suite covering all major DevTools sub-workspaces.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Playwright only.
- Use real fixture files — do not mock workers.
- Each sub-tool gets its own spec file.
- The DevTools workspace uses a tab/sidebar navigation — check the `DevToolsWorkspace.svelte` for structure.

═══════════════════════════════════════════════════════════════
CONTEXT — REPO LAYOUT
═══════════════════════════════════════════════════════════════
- Main DevTools panel: `src/lib/components/workspace/panels/DevToolsWorkspace.svelte`
- Sub-routes under `src/routes/devtools/`:
  - `formatters/` — JSON/JWT/Base64 formatters
  - `converters/` — JSON↔YAML↔XML converters
  - `git/` — Git History Analyzer
  - `logs/` — Visual Log Parser
  - `har/` — HAR File Analyzer
  - `pcap/` — PCAP Network Analyzer
  - `pipelines/` — Visual Transformation Pipelines
  - `pii-sanitizer/` — PII Data Sanitizer
  - `mock-server/` — Local Mock API Server
  - `datagen/` — Test Data Generator
  - `visual-diff/` — Visual Regression Diffing
  - `code/` — Code Analysis (tree-sitter)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════

1. **Formatters (`formatters.spec.ts`)**:
   - Navigate to `/devtools/formatters`
   - Paste a minified JSON string and click "Format" → assert pretty-printed output
   - Paste a valid JWT token → assert it decodes to header/payload sections
   - Paste a Base64 string → assert decoded text appears

2. **Converters (`converters.spec.ts`)**:
   - Navigate to `/devtools/converters`
   - Paste a JSON object → click "Convert to YAML" → assert valid YAML in output
   - Paste YAML → convert to JSON → assert valid JSON

3. **Git History Analyzer (`git-analyzer.spec.ts`)**:
   - Navigate to `/devtools/git`
   - Upload a `git log --format=...` fixture file (create `tests/fixtures/git-log.txt`)
   - Assert the timeline/table renders with commit entries
   - Test filtering by author or date range

4. **Visual Log Parser (`log-parser.spec.ts`)**:
   - Navigate to `/devtools/logs`
   - Upload a log fixture file (`tests/fixtures/app.log`)
   - Assert the parsed log entries appear with severity color coding
   - Test the "Anomaly Detection" feature if present

5. **HAR Analyzer (`har-analyzer.spec.ts`)**:
   - Navigate to `/devtools/har`
   - Upload a HAR fixture file (`tests/fixtures/sample.har`)
   - Assert request/response entries appear in a table
   - Click a request and verify the detail panel opens

6. **PCAP Analyzer (`pcap-analyzer.spec.ts`)**:
   - Navigate to `/devtools/pcap`
   - Upload a small PCAP fixture (`tests/fixtures/sample.pcap`)
   - Wait for parsing (this uses a WASM worker)
   - Assert packet entries appear in the table

7. **PII Sanitizer (`pii-sanitizer.spec.ts`)**:
   - Navigate to `/devtools/pii-sanitizer`
   - Paste a JSON payload containing email addresses and phone numbers
   - Click "Sanitize" and assert the output has PII replaced/redacted
   - Verify original data is not shown in the output

8. **Mock API Server (`mock-server.spec.ts`)**:
   - Navigate to `/devtools/mock-server`
   - Define a mock endpoint: `GET /api/users` → `[{"id":1,"name":"Test"}]`
   - Start the server and assert it becomes active
   - (If the mock server is accessible via localhost port) Make a fetch request and verify the mock response

9. **Test Data Generator (`datagen.spec.ts`)**:
   - Navigate to `/devtools/datagen`
   - Select schema type (e.g., "User" with name, email, age fields)
   - Click "Generate 10 rows"
   - Assert a table/JSON output appears with 10 rows

10. **Visual Regression Diffing (`visual-diff.spec.ts`)**:
    - Navigate to `/devtools/visual-diff`
    - Upload two similar PNG screenshots (create `tests/fixtures/before.png`, `tests/fixtures/after.png`)
    - Assert a diff canvas or highlighted difference overlay renders

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW directory: `tests/phase-4/`
2. NEW: `tests/phase-4/formatters.spec.ts`
3. NEW: `tests/phase-4/converters.spec.ts`
4. NEW: `tests/phase-4/git-analyzer.spec.ts`
5. NEW: `tests/phase-4/log-parser.spec.ts`
6. NEW: `tests/phase-4/har-analyzer.spec.ts`
7. NEW: `tests/phase-4/pcap-analyzer.spec.ts`
8. NEW: `tests/phase-4/pii-sanitizer.spec.ts`
9. NEW: `tests/phase-4/mock-server.spec.ts`
10. NEW: `tests/phase-4/datagen.spec.ts`
11. NEW: `tests/phase-4/visual-diff.spec.ts`
12. NEW fixtures as needed in `tests/fixtures/`

Commit: "test: Phase 4 E2E — DevTools workspace (Formatters, Git, Log, HAR, PCAP, PII, Mock Server)"
Target branch: feature/dev
