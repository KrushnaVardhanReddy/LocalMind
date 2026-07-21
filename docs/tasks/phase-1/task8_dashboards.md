# Task 8: Interactive Dashboard Builder (v2)

## Objective
Allow users to pin multiple AI-customized charts and data grids into a single grid-layout dashboard that persists locally.

## Prerequisites
- Ensure Task 6 (AI Chart Customization) is complete.

## Implementation Steps

### 1. Dashboard Layout UI
- Install `svelte-grid` or a similar grid layout library.
- Create a `Dashboard.svelte` view that allows drag-and-drop resizing of widgets.

### 2. Widget State Management
- When a user pins a chart from the main query view, serialize its SQL query and ECharts configuration.
- Save this configuration array to `localStorage` (or `wa-sqlite` if Phase 1 cross-cutting persistence is complete).

### 3. Parallel Execution
- On dashboard load, iterate through the pinned widgets.
- Dispatch all associated SQL queries to the `WorkerManager.getDuckDB()` concurrently via `Promise.all()`.
- Render the ECharts components as the queries resolve.

## Definition of Done
- A user can pin at least 3 different charts to a dashboard.
- The layout is saved on page refresh.
- The DuckDB worker can handle the concurrent query load without crashing.
