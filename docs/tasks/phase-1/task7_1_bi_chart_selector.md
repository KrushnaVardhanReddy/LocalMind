# Task 7.1: BI Pivot Builder — ECharts Visualization & Chart Type Selector

## Objective
Add ECharts chart rendering to the existing PivotBuilder component and provide a manual chart type selector. Currently the PivotBuilder only renders a data table — this task adds the visual chart layer that makes it a true BI tool.

## Prerequisites
- Existing `PivotBuilder.svelte` with working drag-and-drop shelves and DuckDB query execution.
- ECharts already in `package.json` (`echarts: ^6.1.0`).

## Implementation Details

### 1. ECharts Container
- Add an ECharts `<div>` container below the shelves and above (or beside) the data table.
- Use `echarts.init()` in an `$effect` block that re-renders whenever `result` changes.
- Ensure the chart container has a reasonable min-height (e.g., `400px`) and is responsive.
- Dispose the ECharts instance in `onDestroy` to prevent memory leaks.

### 2. Chart Type Selector UI
- Add a dropdown or segmented toggle group labeled "Chart Type" near the chart container.
- Options: **Auto** (default), Bar, Line, Pie, Scatter, Area.
- Store as: `let chartType = $state<'auto' | 'bar' | 'line' | 'pie' | 'scatter' | 'area'>('auto');`

### 3. Auto-Detection Logic
When `chartType === 'auto'`, infer the chart type from data cardinality:
- ≤ 5 distinct categories → Pie
- ≤ 20 distinct categories → Bar
- \> 20 distinct categories → Line

### 4. ECharts Config Factory
Create a function `buildEchartsOption(result, chartType, rows, values)` that generates the ECharts option object:
- **Bar / Line / Area**: X-axis = row dimension values, Y-axis = aggregated measure values. Each measure = one series.
- **Pie**: Map first dimension + first measure to `{ name, value }[]`. Ignore additional dimensions/measures gracefully.
- **Scatter**: Requires two numeric measures (X and Y). If only one measure, fall back to Bar.

### 5. Edge Cases & Fallbacks
- Pie chart with multiple measures: use only the first measure, no crash.
- Scatter with < 2 measures: gracefully fall back to Bar.
- No rows defined (only values): show a single-bar aggregation.
- Result with 0 rows: show the chart container with a "No data" message inside.

## Acceptance Criteria
- [ ] ECharts chart renders below the shelves when pivot data is available.
- [ ] Chart type selector with Auto, Bar, Line, Pie, Scatter, Area options is visible.
- [ ] Changing chart type dynamically updates the chart without re-querying DuckDB.
- [ ] Auto mode matches the cardinality rules from the spec.
- [ ] Invalid configs (e.g., Pie + 3 measures) degrade gracefully, never crash.
- [ ] Chart instance is properly disposed on component destroy (no memory leaks).
- [ ] Unit tests verify chart type auto-detection and config generation.
