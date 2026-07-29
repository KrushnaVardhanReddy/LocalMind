# Task 7.2: BI Pivot Builder — True Pivot, Filters & SQL Panel

## Objective
Upgrade the PivotBuilder from a simple GROUP BY executor to a true Tableau-style pivot table with a Columns shelf (DuckDB `PIVOT ON`), a Filters shelf, and a transparent Generated SQL panel.

## Prerequisites
- Task 7 (base PivotBuilder) completed.
- Task 7.1 (ECharts visualization) should be completed or in-flight.

## Implementation Details

### 1. Columns Shelf (PIVOT ON)
- Add a third drag-and-drop zone: **Columns / Pivot Headers**.
- When the Columns shelf has a value, switch SQL generation from simple `GROUP BY` to DuckDB `PIVOT` syntax:
  ```sql
  PIVOT (
      SELECT dim1, pivot_col, measure
      FROM table
  )
  ON pivot_col
  USING SUM(measure)
  GROUP BY dim1
  ```
- **Guard rail**: Before accepting a column into the Columns shelf, query DuckDB for `SELECT COUNT(DISTINCT "col") FROM "table"`. If > 50, show a warning: "This column has too many distinct values (>50) for a pivot. Consider using it as a Row instead." and reject the drop.

### 2. Filters Shelf
- Add a fourth drag-and-drop zone: **Filters**.
- When a column is dropped into Filters, show an inline editor with:
  - **Operator dropdown**: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`
  - **Value input**: text field (auto-suggest distinct values from DuckDB for `=`/`IN` operators)
- Multiple filters are combined with `AND`.
- Filters are injected into the `WHERE` clause of the generated SQL.
- State: `let filters = $state<{ column: string, operator: string, value: string }[]>([]);`

### 3. Generated SQL Panel
- Add a collapsible panel (collapsed by default) labeled **"Generated SQL"** below the shelves.
- Display the exact SQL string that was sent to DuckDB, syntax-highlighted if possible (use `highlight.js` which is already in package.json).
- Add a **"Copy SQL"** button that copies to clipboard with visual feedback.
- The SQL updates reactively whenever shelves or filters change.

### 4. SQL Generation Refactor
- Refactor `generateAndExecuteSQL()` to handle three modes:
  1. **Values only** (no rows, no columns): `SELECT AGG(col) FROM table`
  2. **Rows + Values** (no columns): `SELECT rows, AGG(vals) FROM table GROUP BY rows`
  3. **Rows + Columns + Values**: Full `PIVOT` syntax
- All modes respect the Filters shelf by prepending a `WHERE` clause.
- Store the generated SQL string in state: `let generatedSQL = $state('');`

## Acceptance Criteria
- [ ] Columns shelf appears and accepts drag-and-drop.
- [ ] Dropping a column with > 50 distinct values into Columns shelf shows a warning and rejects.
- [ ] When Columns shelf has a value, SQL uses DuckDB `PIVOT` syntax.
- [ ] Filters shelf accepts columns with operator + value editor.
- [ ] Multiple filters combine with AND and appear in the WHERE clause.
- [ ] Generated SQL panel shows the exact query, syntax-highlighted, with a copy button.
- [ ] Unit tests cover all three SQL generation modes and filter injection.
