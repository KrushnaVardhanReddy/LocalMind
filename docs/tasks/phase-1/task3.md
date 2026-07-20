# Task 3: Query Execution and Data Visualization (v2)

## Objective
Implement a local SQL editor and render query results in a high-performance data grid and Apache ECharts, strictly enforcing pagination to protect the UI thread.

## Prerequisites
- Review `docs/specs/phase-1/02_query_engine_spec.md`.
- Ensure Task 2 (Data Ingestion) is complete.

## Implementation Steps

### 1. Implement SQL Editor UI
- In the Svelte workspace, add a simple textarea (or lightweight code editor like CodeMirror) for writing SQL queries.
- Add an "Execute" button bound to the `Ctrl+Enter` shortcut.

### 2. Implement Worker Query Logic
- In `duckdb.worker.ts`, implement the `query(sql: string, limit: number = 1000)` method.
- Ensure the worker appends a `LIMIT` clause or wraps the query if the UI requests a limited result set.
- Execute the query and parse the results back to a plain JSON array of objects to pass over the Comlink boundary.

### 3. Implement Data Grid
- Render the `QueryResult.rows` in an HTML table or a virtualized data grid (like `svelte-virtual-table`) in the UI.
- Handle empty states, loading spinners during execution, and error states (e.g., syntax errors returned from DuckDB).

### 4. Implement Basic ECharts Visualization
- Install Apache ECharts (`bun add echarts`).
- Create a `ChartViewer.svelte` component.
- Take the `QueryResult` and map it into a basic Bar or Line chart (e.g., mapping column 1 to the X-axis and column 2 to the Y-axis).

## Definition of Done
- The user can write a `SELECT` query against the file registered in Task 2.
- The UI executes the query via the Web Worker without freezing.
- Results exceeding 1,000 rows are safely truncated to protect the DOM.
- The data is displayed correctly in both a tabular format and a basic chart.
