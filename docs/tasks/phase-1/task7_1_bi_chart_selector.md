# Task 7.1: BI Pivot Builder - Manual Chart Type Selector

## Objective
Enhance the existing Tableau-Style BI Pivot Builder (`PivotBuilder.svelte`) by adding a manual chart type selector. Users should be able to override the auto-selected chart type and explicitly choose between Bar, Line, Pie, Scatter, and Area charts for their pivoted data.

## Implementation Details

### 1. UI Components
- Add a dropdown or toggle group in the PivotBuilder UI (near the shelf controls or chart container) labeled "Chart Type".
- Options: Auto (default), Bar, Line, Pie, Scatter, Area.

### 2. State Management
- Introduce a new state variable (e.g., `let manualChartType = $state('auto');`) in `PivotBuilder.svelte`.

### 3. ECharts Configuration Logic
- Refactor the ECharts config generation logic to respect `manualChartType`.
- If `manualChartType !== 'auto'`, override the automatically inferred `series.type`.
- Handle different data mappings:
  - **Bar / Line / Area**: Use categorical X-axis and numerical Y-axis.
  - **Pie**: Map rows/values to an array of `{ name, value }` objects. Take the first dimension and first measure if multiple exist.
  - **Scatter**: Requires two numeric measures (X and Y) and optionally a dimension for grouping/color.

### 4. Edge Cases & Fallbacks
- **Graceful degradation:** If the user selects a Pie chart but has dragged 3 dimensions and 2 measures, render the Pie chart using only the first dimension and first measure, ignoring the rest to prevent rendering errors.

## Acceptance Criteria
- [ ] Users see a "Chart Type" selector with Auto, Bar, Line, Pie, Scatter, and Area options.
- [ ] Changing the chart type dynamically updates the ECharts visualization without requiring a new DuckDB query.
- [ ] Invalid configurations (e.g., Pie chart with 3 measures) do not crash the app, but gracefully degrade.
- [ ] The "Auto" mode behaves identically to the previous behavior (cardinality-based selection).
- [ ] E2E/Component tests updated to verify the chart type overrides.
