# Task 9: Tableau-Style BI Pivot Builder

## Objective
Implement a drag-and-drop Pivot Builder UI in the Data Workspace that allows users to visually explore datasets. The UI must map drag-and-drop actions into dynamic DuckDB SQL queries and render the results via ECharts, simulating a Tableau-like experience entirely in the browser.

## Spec Reference
`docs/specs/phase-1/06_bi_pivot_spec.md` (To be created)

## Prerequisites
- Phase 1 tasks 1–3 complete (DuckDB worker and ECharts integration active).

## Implementation Steps

### Step 1: Data Classification (Dimensions vs. Measures)
- Read the DuckDB table schema.
- Categorize columns into **Dimensions** (VARCHAR, DATE, BOOLEAN) and **Measures** (INTEGER, FLOAT, DOUBLE).
- Render these as draggable "pills" in a sidebar (e.g., blue for Dimensions, green for Measures).

### Step 2: Drag-and-Drop Dropzones
Implement a UI with three primary dropzones using the HTML5 Drag and Drop API or a library like `svelte-dnd-action`:
1. **Rows Shelf**: Defines the `GROUP BY` clause.
2. **Columns Shelf**: Defines additional categorical grouping (pivot).
3. **Values Shelf**: Defines the aggregation functions (SUM, AVG, COUNT).

### Step 3: Dynamic SQL Generation
Create a utility function `buildPivotQuery(rows, cols, values, tableName)`:
- If a Measure is dropped in Values, default to `SUM()`, but allow clicking to change to `AVG()`, `COUNT()`, `MIN()`, or `MAX()`.
- Construct the DuckDB SQL dynamically.
- Example: 
  - Rows: `category`
  - Values: `SUM(revenue)`
  - SQL: `SELECT category, SUM(revenue) as revenue FROM table GROUP BY category ORDER BY revenue DESC`

### Step 4: Auto-Charting Mapping
- Pass the resulting DuckDB dataset to ECharts.
- If only one Dimension and one Measure are present, default to a Bar Chart.
- If two Dimensions are present, default to a Grouped/Stacked Bar Chart or Heatmap.
- Allow the user to manually override the chart type.

### Step 5: Web Worker Integration
- Ensure every change in the dropzones sends the generated SQL via the `WorkerPool` to the DuckDB WASM worker to prevent blocking the Svelte UI thread.
- Show a subtle loading state over the chart area during the query execution.

## Acceptance Criteria
- [ ] Users can drag columns into Rows and Values shelves to automatically generate a chart.
- [ ] The Svelte UI correctly builds valid DuckDB SQL from the shelf state.
- [ ] Changing the aggregation type (e.g., SUM to AVG) instantly updates the chart.
- [ ] The UI remains responsive (non-blocking) during heavy queries.
- [ ] Accessible keyboard fallbacks are provided for moving columns to shelves without a mouse.
