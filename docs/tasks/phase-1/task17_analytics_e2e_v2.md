TASK: Phase 1 — Task 17: Analytics E2E V2 (Playwright)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
We need **100% comprehensive End-to-End coverage** of the entire Phase 1 Analytics Workspace. This is not just a smoke test; you must deeply test all core user flows, including file ingestion, DuckDB SQL execution, Pivot Builder interactions, Cross-filtering, Dashboard building, and all recent additions (Chart Inspector, Treemaps, Data Grid).

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Zero mocking for WASM workers (DuckDB, etc.). The tests must run against the real compiled binaries in the browser context.
- Use `page.evaluate` only when strictly necessary. Prefer standard DOM interactions (`click()`, `fill()`, `dragAndDrop()`).
- Data Persistence: Verify that Analytics state survives page reloads (testing wa-sqlite persistence).

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `tests/phase-1/v2/` (Target directory for the new comprehensive suite)
- `tests/fixtures/` (Test data - ensure you use large realistic CSV/JSON datasets)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
You must write separate test files to cover the following deep workflows:
1. **Data Ingestion & SQL (`data_engine.spec.ts`)**: Upload a CSV -> Wait for DuckDB WASM -> Write a custom SQL query -> Verify output grid.
2. **Pivot & Chart Builder (`pivot_builder.spec.ts`)**: Drag 'Region' to Rows, 'Sales' to Values. Change aggregation from SUM to AVG. Switch chart type from Bar to Pie. Verify canvas renders.
3. **Advanced Chart Inspector (`inspector.spec.ts`)**: Click the chart, open the Inspector, toggle "Stacked", apply a custom JSON override (`{"title": {"text": "Custom Title"}}`), and verify the ECharts DOM reflects the change.
4. **Dashboards & Cross-filtering (`dashboards.spec.ts`)**: Pin 3 charts to a dashboard. Click a slice on a pie chart and verify the other charts filter correctly (cross-filtering).
5. **Niche Analytics (`specialty_analytics.spec.ts`)**: Test the HTML Extractor, Treemap/Heatmap rendering, and Network Graph visualizer.

Wait for Canvas: ECharts renders on a `<canvas>`. Ensure Playwright waits for the canvas to be visible and stable before capturing screenshots or verifying state.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `tests/phase-1/v2/data_engine.spec.ts`
2. NEW: `tests/phase-1/v2/pivot_builder.spec.ts`
3. NEW: `tests/phase-1/v2/inspector.spec.ts`
4. NEW: `tests/phase-1/v2/dashboards.spec.ts`
5. NEW: `tests/phase-1/v2/specialty_analytics.spec.ts`

Commit: "test: Phase 1 Task 17 Comprehensive Analytics E2E"
Target branch: feature/task17-analytics-e2e
