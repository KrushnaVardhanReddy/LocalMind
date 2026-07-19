# Task 3: Query Execution and Data Visualization

## Objective
Build the user interface and logic for executing complex SQL queries against the ingested data and visualizing the results.

## Prerequisites
- Completion of Task 2 (Data Ingestion).
- Review `docs/specs/phase-1/02_query_engine_spec.md`.

## Implementation Steps

### 1. SQL Editor UI
- Integrate a basic code editor (e.g., CodeMirror or Monaco) for writing SQL queries.
- Connect the editor to the DuckDB Worker via the `EXECUTE_QUERY` action defined in the contract.

### 2. Data Table View
- Implement a paginated data table component to display the results of SQL queries.
- Ensure the table handles large result sets efficiently (e.g., virtual scrolling).

### 3. Column Statistics & Profiling
- For the active table, automatically run background queries to compute statistics (min, max, mean, null count, unique values) for each column.
- Display these statistics in a sidebar or header above the data table.

### 4. Basic Charting Integration
- Install Apache ECharts (`echarts`).
- Create a charting component that takes query results and maps them to basic chart types (Line, Bar, Pie).
- Allow the user to select the X and Y axes from the query results.

## Acceptance Criteria
- [ ] Users can write and execute arbitrary SQL queries against their loaded data.
- [ ] Results are displayed in a performant, paginated data table.
- [ ] Column statistics are automatically calculated and displayed.
- [ ] Users can generate basic charts from their query results.
