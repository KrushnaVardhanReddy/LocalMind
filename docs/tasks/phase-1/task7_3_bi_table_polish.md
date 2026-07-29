# Task 7.3: BI Pivot Builder — Table Polish (Totals, Pagination, Empty State)

## Objective
Polish the PivotBuilder's data table with grand totals, client-side pagination, and a helpful empty state — completing the Tableau-style experience.

## Prerequisites
- Task 7 (base PivotBuilder) completed.
- Task 7.1 (ECharts) and Task 7.2 (Pivot/Filters) should be completed or in-flight.

## Implementation Details

### 1. Grand Totals Row
- After all data rows, render a **bold "Grand Total" row** that computes the aggregate across all visible rows.
- For each measure column, compute the total client-side from the result data:
  - SUM → sum all values
  - COUNT → sum all counts
  - AVG → weighted average (sum of values / count of rows)
  - MIN → min across all values
  - MAX → max across all values
- The totals row should be visually distinct: bold text, light background (e.g., `bg-gray-100`), sticky at the bottom of the table.
- Dimension columns in the totals row display "Grand Total" in the first column and empty in the rest.

### 2. Client-Side Pagination
- If the result set exceeds **1,000 rows**, paginate the table.
- Show pagination controls below the table: `< Previous | Page X of Y | Next >`
- State: `let currentPage = $state(1);` and `const PAGE_SIZE = 1000;`
- The grand totals row is always visible regardless of which page is displayed (it computes over the full result set).
- Show row count: "Showing rows 1–1000 of 5,432"

### 3. Empty State
- When no columns have been dragged to any shelf, show a centered empty state prompt:
  > **"Drag columns to Rows and Values to start building your pivot."**
- Use a subtle icon (e.g., a grid/chart icon) and muted text styling.
- When columns are in shelves but the query returns 0 rows, show:
  > **"No data matches your current configuration."**

### 4. Minor UX Improvements
- Add alternating row colors (`even:bg-gray-50`) for readability on large datasets.
- Number formatting: Use `toLocaleString()` with `maximumFractionDigits: 2` (already partially done).
- Add column sorting: Click a column header to sort the result table client-side (ascending/descending toggle).

## Acceptance Criteria
- [ ] Grand totals row appears at the bottom with correct aggregations for each measure.
- [ ] Pagination kicks in at > 1,000 rows with Previous/Next controls and page indicator.
- [ ] Grand totals row remains visible across all pages.
- [ ] Empty state prompt shows when no shelves are populated.
- [ ] "No data" message shows when query returns 0 rows.
- [ ] Alternating row colors applied.
- [ ] Column headers are clickable for client-side sorting.
- [ ] Unit tests verify totals computation and pagination logic.
