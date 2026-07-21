# Task 7: Multi-File Auto-Joins & Visual Data Diffing (v2)

## Objective
Enable users to upload multiple files, automatically detect foreign keys via the LLM worker, and perform visual data diffing directly in DuckDB WASM.

## Prerequisites
- Ensure Task 4 (AI Insights) and Task 2 (Data Ingestion) are complete.

## Implementation Steps

### 1. Multi-File Ingestion
- Update the UI to accept multiple files in the drag-and-drop zone.
- Register all dropped files in DuckDB (e.g., `table_1`, `table_2`).

### 2. AI Auto-Join Detection
- In `llm.worker.ts`, add `detectJoins(schemas: Record<string, string>[])`.
- Pass the schemas of all uploaded tables to the AI.
- Prompt the AI to return a JSON array of suggested SQL `JOIN` clauses based on column names.

### 3. Visual Diffing Logic
- Add a UI option to "Diff Files".
- When triggered, execute a DuckDB `EXCEPT` and `INTERSECT` query between two tables with identical schemas to find added, removed, and modified rows.
- Render the diff in the Data Grid (Task 3) using green for additions and red for deletions.

## Definition of Done
- A user can drop `sales_2024.csv` and `sales_2025.csv`.
- The UI can automatically generate a diff using DuckDB without freezing the browser.
