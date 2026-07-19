# Phase 1: Query Engine & Analytics Specification

## 1. Overview
The Query Engine is the computational heart of Phase 1. It utilizes WebAssembly (DuckDB WASM) running in Web Workers to perform complex SQL queries, aggregations, and data transformations locally in the browser, matching native database speeds.

## 2. Core Features

### 2.1 Local SQL Execution
- **Engine**: DuckDB WASM.
- **Functionality**: Execute standard SQL (SELECT, JOIN, GROUP BY, window functions) against loaded CSV, JSON, and Parquet files.
- **Persistence**: Save frequently used queries to a local IndexedDB/wa-sqlite store.

### 2.2 Visualizations & Profiling
- **Column Statistics**: Automatically calculate min, max, mean, null count, and unique values for each column.
- **Charting**: Generate Pivot tables, line charts, bar charts, and pie charts using Apache ECharts based on query results.

### 2.3 Data Diffing
- **Behavior**: Compare two datasets (e.g., last month's CSV vs. this month's CSV).
- **Output**: Highlight added rows, deleted rows, and modified values.

### 2.4 Python Notebook (Optional Module)
- **Engine**: Pyodide WASM.
- **Behavior**: Allow advanced users to run pandas/polars scripts locally against the loaded data for custom data cleaning or analysis.

## 3. Architecture & Threading
- **Isolation**: DuckDB WASM and Pyodide MUST run in dedicated Web Workers.
- **Communication**: The main UI thread communicates with the engine via asynchronous message passing (detailed in Contracts).
- **Concurrency**: Support cancelling long-running queries without hanging the application.

## 4. Non-Functional Requirements
- **Performance**: Simple aggregations on a 1M row dataset should return in < 500ms.
- **Resilience**: Out-of-memory errors in the Web Worker must be caught and presented gracefully to the user in the UI.
