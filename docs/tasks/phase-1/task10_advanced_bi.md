TASK: Phase 1 — Task 10: Advanced BI Polish (Treemaps, Heatmaps, Cross-filtering)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Elevate the Pivot Builder visualization component by introducing advanced ECharts chart types (Treemaps, Heatmaps) and enabling interactive cross-filtering (clicking charts to filter).

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-1/06_bi_pivot_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Treemaps & Heatmaps: Add new chart types to the `PivotBuilder` UI and configure `buildEchartsOption` to render them.
- Cross-Filtering: Listen to ECharts click events. When a user clicks a pie slice or bar, automatically add that category to the `PivotBuilder`'s Filters shelf and re-trigger the query.
- Pill Configuration UX: Replace the native `<select>` dropdowns on the value pills with a sleek Svelte-based popover or modal.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/lib/components/pivot/PivotBuilder.svelte` (Main orchestration component)
- `src/lib/components/pivot/PivotChart.svelte` (Chart rendering and UI wrappers)
- `src/lib/utils/chartBuilder.ts` (ECharts configuration generator)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Dependencies: ECharts is already installed (`^5.5.0`). Do NOT install a new charting library.
- Cross-Filtering Logic: In `PivotChart.svelte`, attach to the ECharts instance using `chartInstance.on('click', (params) => { ... })`. You need to dispatch an event back to `PivotBuilder.svelte` with the dimension name and value so it can append to the `filters` array.
- Svelte 5 Popovers: For the Pill Configuration, use Svelte 5 `$state(false)` to control the visibility of absolute-positioned popover divs. Avoid using heavy external UI libraries; build it with Tailwind.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. MODIFY: `src/lib/components/pivot/PivotBuilder.svelte`
2. MODIFY: `src/lib/components/pivot/PivotChart.svelte`
3. MODIFY: `src/lib/utils/chartBuilder.ts`

Commit: "feat: Phase 1 Task 10 advanced BI polish"
Target branch: feature/task10-advanced-bi
