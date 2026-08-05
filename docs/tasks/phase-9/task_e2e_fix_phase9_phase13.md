# E2E Fix Wave 3 — Phase 9 (Shell/UX) + Phase 13 (Universal Doc Q&A)

## Objective
Run the Phase 9 and Phase 13 E2E test suites, identify every failing test, read the relevant source files to understand the actual DOM and component structure, then fix both the tests and any source bugs you find. These two phases are the closest to passing and should reach 100% green.

## How to Work

1. Start the dev server: `bun run dev`
2. Run: `bunx playwright test tests/phase-9/ tests/phase-13/ --project=chromium`
3. For every failing test:
   - Read the error and page snapshot in `test-results/`
   - Open the relevant source component(s) in `src/`
   - Fix the test selector to match the actual DOM **or** fix the source bug if the component is broken
   - Re-run until that test passes
4. Fix source bugs when found — these phases are fully implemented so failures indicate real bugs or stale selectors
5. Run `bun run check` — zero TypeScript errors required before committing

## Known Issues to Fix First

### `tests/phase-9/shell.spec.ts`

Line 24 asserts `nav.getByText('Analytics', { exact: true })` is visible after clicking the Analytics link. Open `src/lib/components/` (or wherever the top nav is defined) and check exactly how the active workspace name is rendered. If the nav shows `📊 Analytics` (with emoji), `exact: true` will fail — update the selector to match the actual rendered text.

### `tests/phase-9/workspace-migration.spec.ts`

Line 31 asserts `h2 "Workspace: ExportTestWorkspace"` — open `AnalyticsWorkspace.svelte` and verify the exact workspace name heading format. Line 41 references `button "Update Chart"` — verify this button exists in `PivotBuilder.svelte`. Line 47–50 expects `Export Session` to become enabled after the setup steps — verify the disable condition in the source actually clears after creating a workspace and selecting a table.

### `tests/phase-13/universal-doc-qa.spec.ts`

Line 11 asserts `text="Upload a document to start chatting"` as the idle state. Line 16 asserts `text="Click to upload or drag and drop"` as the upload trigger. Open the universal-doc route component and verify both strings match exactly. Update whichever doesn't match. Also verify `tests/fixtures/sample-report.txt` contains `The total revenue for Q1 was $10,000.` and `tests/fixtures/sample-notes.md` contains `# Notes` and `We need to follow up on the contract.` — if not, update the fixture files.

### `tests/phase-13/directory-search.spec.ts`

Open this file fully and verify all selectors and routes against the source.

## All Other Tests — Fix the Same Way

After fixing the known issues above, re-run the full suite and fix any remaining failures in all spec files using the same approach: read the source component, identify the real selector or real bug, fix it, re-run.

## Phase 9 Test Files
- `tests/phase-9/shell.spec.ts`
- `tests/phase-9/command-palette.spec.ts`
- `tests/phase-9/explorer.spec.ts`
- `tests/phase-9/inspector-panel.spec.ts`
- `tests/phase-9/workspace-migration.spec.ts`

## Phase 13 Test Files
- `tests/phase-13/universal-doc-qa.spec.ts`
- `tests/phase-13/directory-search.spec.ts`

## Source Files to Reference
- `src/routes/+layout.svelte` — global shell layout and keyboard shortcuts
- `src/routes/+page.svelte` — landing page
- `src/lib/components/WorkspaceNav.svelte` (or equivalent top nav)
- `src/lib/components/FileExplorer.svelte` (or equivalent sidebar)
- `src/lib/components/InspectorPanel.svelte` (or equivalent)
- `src/lib/services/session.types.ts` — session schema
- `src/lib/services/SessionManager.ts` (or equivalent) — session capture/restore
- `src/lib/components/workspace/panels/AnalyticsWorkspace.svelte` — for session migration test
- `src/routes/plugins/universal-doc/+page.svelte` (or equivalent universal doc route)
- Any component under `src/lib/components/` related to universal doc Q&A, directory search

## Fixture Files to Check
- `tests/fixtures/sample-contract.pdf` — must exist
- `tests/fixtures/sample-report.txt` — must exist with content matching test assertions
- `tests/fixtures/sample-notes.md` — must exist with content matching test assertions

Read each fixture and compare its content against the assertions in the test. Update the fixture content if it doesn't match what the test expects — the fixture is a test artifact, it can be changed freely.

## Definition of Done
- `bunx playwright test tests/phase-9/ tests/phase-13/ --project=chromium` — ALL tests pass (no skips, no failures)
- `bun run check` — zero TypeScript errors
- Commit message: `jules: fix e2e phase9+13 to green`
