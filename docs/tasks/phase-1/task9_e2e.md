# Task 9: End-to-End Testing (Phase 1 — Full Analytics Surface)

## Objective
Establish a comprehensive Playwright test suite that validates the complete Phase 1 user journey — from the new workspace launcher dashboard through data ingestion, BI pivot building, report export, and AI consent flows — across Chrome, Firefox, and WebKit without regressions.

**No mocking allowed.** All tests must run against real DuckDB WASM workers and the actual application stack. AI tests use real API keys injected via environment variables.

## Prerequisites
- All Wave 1–4 tasks merged: UX-1 (Dashboard), UX-2 (Command Palette), Task 7.1–7.4 (PivotBuilder), UX-3 (Report Export), UX-4 (Template Gallery).
- `LOCALMIND_TEST_API_KEY` set in CI environment.
- Sample test fixtures committed to `tests/fixtures/`:
  - `sales_100k.csv` (100k rows: `region`, `product`, `revenue`, `date`)
  - `logs_10k.csv` (10k rows: `status_code`, `method`, `path`, `response_time`)

## Implementation

### 1. Playwright Setup
- Configure `playwright.config.ts` to spin up `bun run dev` before tests.
- Use `webServer` option with `reuseExistingServer: true` in CI.
- Browsers: Chromium, Firefox, WebKit (Desktop viewports only).
- Test output: HTML report + screenshots on failure committed to CI artifacts.

### 2. Workspace Launcher (UX-1)
- Navigate to `/` and assert the workspace launcher dashboard renders.
- Assert workspace cards for Analytics, Docs, DevTools are visible.
- Click "Analytics" card and assert navigation to `/analytics`.
- Assert `<h1>` heading is correct.

### 3. Command Palette (UX-2)
- On `/analytics`, press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
- Assert the Command Palette modal opens.
- Type "pivot" and assert filtered results appear.
- Press `Escape` and assert the palette closes without navigation.

### 4. Data Ingestion & DuckDB
- Navigate to `/analytics`.
- Drop `tests/fixtures/sales_100k.csv` onto the file drop zone using `page.dispatchEvent`.
- Assert the file appears in the file list with row count visible.
- Assert the Data Grid renders ≥ 1 row (confirming DuckDB registered the virtual table).

### 5. BI Pivot Builder — Full Journey
- Drag `region` to the Rows shelf.
- Drag `revenue` to the Values shelf, set aggregate to `SUM`.
- Assert the data grid updates with grouped results.
- Drag `product` to the Columns shelf.
- Expand the SQL panel and assert it contains `PIVOT` syntax.
- Assert the ECharts chart `<canvas>` is visible and non-zero in size.
- Add a filter: drag `region` to Filters, set operator `=` value `"West"`, assert grid filters.
- Switch chart type to "Line" via the toggle, assert the chart re-renders.

### 6. Template Gallery (UX-4)
- With `sales_100k.csv` loaded, click the "Templates" button.
- Assert the Template Gallery modal opens.
- Assert "Sales Overview" template appears in the suggestion list.
- Click "Use Template", assert the Pivot Builder shelves auto-populate.
- Assert the data grid updates with the template's configuration.

### 7. Static HTML Report Export (UX-3)
- With a configured pivot view, click "Export Report".
- Assert the export modal opens with section checkboxes.
- Select all sections (Pivot Table, Chart, Generated SQL).
- Click "Export" and assert a file download is triggered (`LocalMind_Report_*.html`).
- Assert the downloaded file contains `<table>`, `<img>` (base64 chart), and `<pre>` (SQL).
- Assert the file contains no external HTTP requests (no `src="http` patterns).

### 8. AI Consent Flow (No Mocking)
- Inject `LOCALMIND_TEST_API_KEY` via `playwright.config.ts` env.
- With a loaded dataset, click "Ask AI".
- Assert the Consent Modal appears showing the aggregated payload preview.
- Assert no network request has fired before consent.
- Click "I Consent".
- Assert the actual AI request fires and a summary text renders on screen.

## Definition of Done
- `bun run test:e2e` passes across Chromium, Firefox, and WebKit in CI.
- All 8 test sections pass with zero skips.
- Screenshots captured on failure are saved as CI artifacts.
- Full suite completes in under 5 minutes on a standard GitHub Actions runner.

## 💡 Implementation Tips for Jules (Playwright + Svelte 5 Drag-and-Drop)
- **HTML5 Drag and Drop:** Playwright's `page.dragTo()` often fails with Svelte 5's reactive DOM. Instead, explicitly dispatch events:
  ```typescript
  await sourceElement.dispatchEvent('dragstart');
  await targetShelf.dispatchEvent('dragenter');
  await targetShelf.dispatchEvent('dragover');
  await targetShelf.dispatchEvent('drop', { dataTransfer: new DataTransfer() });
  await sourceElement.dispatchEvent('dragend');
  ```
- **Waiting for reactivity:** After a drop, Svelte 5 `$state` updates happen quickly but asynchronously. Wait for a specific DOM state (`await expect(targetShelf).toContainText('column_name')`) before proceeding to the next assertion rather than relying on arbitrary timeouts.
- **Locators:** Use explicit `page.getByRole()` or specific text locators instead of fragile CSS selectors to grab the column pills and shelves.
- **Command Palette Locator:** Svelte 5 renders the palette items asynchronously. Do NOT use `locator('ul > li').filter({ hasText: 'pivot' })`. Instead, type 'pivot' into the input, then use: `await page.getByRole('list').getByText('pivot', { exact: false }).click();`
- **Pivot Table Select Locator:** The `<select id="pivotTableSelect">` is populated asynchronously by DuckDB. Do not blindly `selectOption('sales_100k')`. You MUST wait for the option to attach to the DOM: `await expect(page.locator('#pivotTableSelect').locator('option', { hasText: 'sales_100k' })).toBeAttached({ timeout: 10000 });` then select it.
- **AI Consent Modal Locator:** The header text in `ConsentModal.svelte` is exactly `"Privacy Notice & Consent"`, NOT `"Data Privacy Consent"`. Ensure your `.filter({ hasText: ... })` string matches this exactly.
