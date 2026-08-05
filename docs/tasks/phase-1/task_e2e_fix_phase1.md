# E2E Fix Wave 1 — Phase 1 (Analytics) + Infra

## Objective
Fix all failing Phase 1 E2E tests and add missing infrastructure targets.
**Do NOT skip or delete tests.** Fix either the test selector or the source code bug that causes the failure.

## How to Work

1. Start the dev server: `bun run dev`
2. Run the full suite: `bunx playwright test tests/phase-1/ --project=chromium`
3. For every failing test:
   - Read the error message and the page snapshot in `test-results/`
   - Open the relevant source component(s) in `src/` to understand the actual DOM
   - Fix the test selector to match the actual DOM **or** fix the source bug if the component is genuinely broken
   - Re-run until that test passes
4. Repeat for all `tests/phase-1/v2/` specs in the same way
5. Run `bun run check` — zero TypeScript errors required before committing

## Known Failures to Fix First

### `tests/phase-1/e2e.spec.ts` — BI Pivot Builder & Template Gallery

**Bug A — Dead button click (line 75):**
The test clicks `button { hasText: '🔀 Pivot' }` which does not exist in the DOM.
The `🔀` emoji only appears inside the `PivotBuilder.svelte` heading span as decoration, NOT as a tab-switcher button. The Pivot Builder `<h2>` and `select#pivotTableSelect` are already visible after file upload — there is no tab to switch.

Fix: Remove the dead click and `.ag-row` wait. Replace with assertions that confirm the already-rendered elements:
```diff
-    // Switch to Pivot Builder panel
-    await page.locator('button', { hasText: '🔀 Pivot' }).click();
-    await expect(page.locator('h2', { hasText: 'Pivot Builder' })).toBeVisible({ timeout: 60000 });
-    await page.waitForSelector('.ag-row', { timeout: 60000 });
+    // Pivot Builder is always visible once a file is uploaded (no tab click needed)
+    await expect(page.locator('h2', { hasText: 'Pivot Builder' })).toBeVisible({ timeout: 30000 });
+    await expect(page.locator('select#pivotTableSelect')).toBeVisible({ timeout: 30000 });
```

**Bug B — Wrong Templates button text (line 84):**
The source renders the button as `✨ Templates`, not bare `Templates`. Fix:
```diff
-    const templateBtn = page.locator('button', { hasText: 'Templates' });
+    const templateBtn = page.locator('button', { hasText: '✨ Templates' });
```

**Bug C — Verify other selectors match source:**
After applying the fixes above, re-run and check remaining assertions:
- `text=SUM_revenue` — open `PivotTable.svelte` and confirm the column header format. Update if it renders differently (e.g. `SUM(revenue)`)
- `h1 "Welcome to LocalMind"` — open `src/routes/+page.svelte` and confirm the exact heading text. Update if it differs.

## All Other Tests in Phase 1

After fixing the known failures above, re-run the full suite and fix any remaining failures in `e2e.spec.ts` and all `v2/` specs using the same approach: read the source, find the real selector, fix the test.

Test files to cover completely:
- `tests/phase-1/e2e.spec.ts` (all 5 tests)
- `tests/phase-1/v2/dashboards.spec.ts`
- `tests/phase-1/v2/data_engine.spec.ts`
- `tests/phase-1/v2/inspector.spec.ts`
- `tests/phase-1/v2/pivot_builder.spec.ts`
- `tests/phase-1/v2/specialty_analytics.spec.ts`

Source files to reference when fixing any test:
- `src/routes/+page.svelte`
- `src/routes/analytics/+page.svelte`
- `src/lib/components/workspace/panels/AnalyticsWorkspace.svelte`
- `src/lib/components/pivot/PivotBuilder.svelte`
- `src/lib/components/pivot/PivotTable.svelte`
- `src/lib/components/TemplateGallery.svelte`
- `src/lib/components/ExportModal.svelte`

## Infrastructure Changes

### `Makefile` — Add missing targets
Phases 5, 7, and 8 have `tests/` directories but no Makefile targets. Add them alongside a CI-safe subset target and a Chromium-only fast target. Update the `help` echo block to list all new commands:
```makefile
test-e2e-phase5:
	bunx playwright test tests/phase-5/

test-e2e-phase7:
	bunx playwright test tests/phase-7/

test-e2e-phase8:
	bunx playwright test tests/phase-8/

test-e2e-ci:
	bunx playwright test tests/phase-1/ tests/phase-9/ tests/phase-13/ --project=chromium

test-e2e-chromium:
	bunx playwright test --project=chromium
```

### `playwright.config.ts` — Fix cascade failures
With `workers: 1`, a Firefox timeout kills the entire Firefox run causing 20+ "did not run". Increase local retries:
```diff
-  retries: process.env.CI ? 2 : 0,
+  retries: process.env.CI ? 2 : 1,
```

## Definition of Done
- `bunx playwright test tests/phase-1/ --project=chromium` — ALL tests pass
- `bun run check` — zero TypeScript errors
- Commit message: `jules: fix e2e phase1 selectors and add missing makefile targets`
