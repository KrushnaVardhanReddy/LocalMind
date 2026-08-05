# E2E Fix Wave 2b — Phase 6 (Advanced Workspaces) + Phase 7 (Plugin Runtime) + Phase 8 (Whiteboard)

## Objective
Run the Phase 6, 7, and 8 E2E test suites, identify every failing test, read the relevant source files to understand the actual DOM and component structure, then fix both the tests and any source bugs you find.

## How to Work

1. Start the dev server: `bun run dev`
2. Run: `bunx playwright test tests/phase-6/ tests/phase-7/ tests/phase-8/ --project=chromium`
3. For every failing test:
   - Read the error and page snapshot in `test-results/`
   - Open the relevant source component(s) in `src/`
   - Fix the test selector to match the actual DOM **or** fix the source bug if the component is broken
   - Re-run until that test passes
4. For any test that navigates to a route that does not exist in `src/routes/`: add `test.skip('Route not yet implemented')` to the test body so the suite loads cleanly without hanging — do NOT delete the test
5. For tests marked `.fixme`: do NOT remove the `.fixme`. But ensure the `beforeEach` hook doesn't throw a timeout (the route must at least render without crashing)
6. For any test that depends on WASM/WebGPU that genuinely cannot run headlessly: add `test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1')`
7. Run `bun run check` — zero TypeScript errors required before committing

## Known Issues to Fix First

### `tests/phase-6/crypto.spec.ts` — All tests are `.fixme`

The `beforeEach` navigates to `/crypto` and waits for `text=Cryptography Workspace`. First check if this route exists (`find src/routes -name "+page.svelte" | grep -i crypto`). If the route does NOT exist, add a guard to `beforeEach` so the suite doesn't hang: check visibility with a short timeout and call `test.skip()` if the route isn't found. Leave all `.fixme` markers in place.

### `tests/phase-6/code-interpreter.spec.ts` — All tests are `.fixme`

Same pattern as crypto: navigate to `/plugins/code-interpreter`, check if route exists, add beforeEach guard if not. Tests use `.cm-content` (CodeMirror) — verify CodeMirror is actually used in the component before leaving that selector. Leave `.fixme` in place.

### `tests/phase-6/geospatial.spec.ts`

Check fixture `tests/fixtures/sample.geojson` — verify it exists and contains valid GeoJSON. Verify the route the test navigates to exists in `src/routes/`.

### `tests/phase-6/finance.spec.ts`

Check fixture `tests/fixtures/transactions.csv` — verify it exists and has the columns the test expects.

### `tests/phase-7/plugin-runtime.spec.ts` and `tests/phase-8/whiteboard.spec.ts`

Open each file fully, check which routes they navigate to, verify those routes exist. Apply the same pattern: route guard in `beforeEach` if the route isn't implemented yet.

## All Other Tests — Fix the Same Way

After fixing the known issues above, re-run the full suite and fix any remaining failures in all spec files using the same approach: read the source component, identify the real selector or real bug, fix it, re-run.

## Phase 6 Test Files
- `tests/phase-6/crypto.spec.ts`
- `tests/phase-6/code-interpreter.spec.ts`
- `tests/phase-6/finance.spec.ts`
- `tests/phase-6/geospatial.spec.ts`
- `tests/phase-6/annotate.spec.ts`
- `tests/phase-6/diagrams-workspace.spec.ts`

## Phase 7 Test Files
- `tests/phase-7/plugin-runtime.spec.ts`

## Phase 8 Test Files
- `tests/phase-8/whiteboard.spec.ts`

## Source Files to Reference
Start by listing all routes:
```bash
find src/routes -name "+page.svelte" | sort
```
Then for each test file, find the matching route and component and read them before making any changes.

- Any component under `src/lib/components/` or `src/routes/` matching: crypto, finance, geospatial, annotate, diagrams, code-interpreter, plugin, whiteboard
- `tests/fixtures/sample.geojson` — check it exists and is valid GeoJSON
- `tests/fixtures/transactions.csv` — check it exists and has columns the finance tests expect

## Definition of Done
- `bunx playwright test tests/phase-6/ --project=chromium` — all tests pass, skip, or have `.fixme`; no unexpected crashes
- `bunx playwright test tests/phase-7/ --project=chromium` — same
- `bunx playwright test tests/phase-8/ --project=chromium` — same
- `bun run check` — zero TypeScript errors
- Commit message: `jules: fix e2e phase6+7+8 route guards and selectors`
