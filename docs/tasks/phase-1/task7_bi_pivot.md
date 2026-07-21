# Task 9: Tableau-Style BI Pivot Builder (v2)

## Objective
Provide a drag-and-drop BI interface for non-technical users to build pivot tables without writing SQL, powered under the hood by dynamic DuckDB aggregations.

## Prerequisites
- Ensure Task 2 (Data Ingestion) and Task 3 (Data Grid) are complete.

## Implementation Steps

### 1. BI Drag-and-Drop UI
- Create a `PivotBuilder.svelte` component.
- Display two zones: "Rows/Dimensions" and "Values/Metrics".
- Display a list of columns fetched from `WorkerManager.getDuckDB().getSchema(tableName)`.
- Allow the user to drag columns into these zones.

### 2. Dynamic SQL Generation
- Create a utility that translates the UI state into a DuckDB SQL query.
  - *Rows* become the `GROUP BY` clause.
  - *Values* become aggregations (e.g., `SUM(col)`, `COUNT(col)`).
  - *Filters* become the `WHERE` clause.

### 3. Execution and Rendering
- Whenever a user drops a new column, instantly regenerate the SQL and dispatch it to the DuckDB worker.
- Render the result in a dedicated Pivot Data Grid.

## Definition of Done
- A user can create a pivot table summing "Revenue" by "Country" entirely through drag-and-drop.
- The UI translates this perfectly into a background DuckDB query.
- The UI thread remains completely responsive during the drag actions.
