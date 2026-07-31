TASK: Phase 1 — Task 11: High-Performance Data Grid Upgrade

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Replace the basic HTML table in the "Query Data" section with a high-performance data grid capable of rendering thousands of rows smoothly (e.g., using `Perspective` or `AG Grid`).

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-1/06_bi_pivot_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Grid Evaluation: Evaluate `perspective-viewer` vs a lightweight virtualized Svelte grid.
- Integration: Feed the DuckDB SQL results directly into the grid.
- Features: Ensure sorting, pagination (or infinite scroll virtualization), and responsive columns.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/lib/components/pivot/PivotBuilder.svelte` (Current table renderer and data orchestrator)
- `package.json`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Dependencies: Install `@finos/perspective@^3.2.0` and `@finos/perspective-viewer@^3.2.0` (or `ag-grid-community@^32.0.0` depending on your architectural choice).
- Architecture: We use Svelte 5. Ensure the grid component correctly leverages `$effect` to watch for changes to the DuckDB `result` array and updates the grid's data source without fully unmounting and destroying the grid component.
- Styling: The grid must respect the application's dark mode toggle (`document.documentElement.classList.contains('dark')`). Be sure to dynamically swap or load the respective dark/light theme CSS provided by the grid library.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. MODIFY: `package.json`
2. MODIFY: `src/lib/components/pivot/PivotBuilder.svelte`

Commit: "feat: Phase 1 Task 11 data grid upgrade"
Target branch: feature/task11-data-grid
