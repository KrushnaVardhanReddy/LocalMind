# Task 2: Data Ingestion and Local File Access

## Objective
Implement the local file ingestion pipeline, utilizing the File System Access API to load data directly into the browser and process it using memory-efficient streams.

## Prerequisites
- Completion of Task 1 (Scaffolding and Web Worker Integration).
- Review `docs/specs/phase-1/01_data_ingestion_spec.md`.

## Implementation Steps

### 1. File Selection UI
- Create a UI component (`FilePicker.svelte`) utilizing the File System Access API (`showOpenFilePicker`).
- Add fallback to standard `<input type="file">` for unsupported browsers.
- Support file types: `.csv`, `.json`, `.parquet`.

### 2. Stream Processing & Loading to DuckDB
- Implement logic to read the selected file as a stream or `ArrayBuffer`.
- Extend the `ui_worker_contract.md` and Web Worker (`duckdb.worker.ts`) to handle a `LOAD_FILE` action.
- Use DuckDB WASM's virtual file system (VFS) to register the local file blob/buffer.
- Execute a `CREATE TABLE ... AS SELECT * FROM ...` query to persist the data into DuckDB's in-memory storage.

### 3. Basic Schema Inference
- After loading the file into DuckDB, execute a `DESCRIBE` or `PRAGMA table_info` query.
- Parse the output to determine column names and inferred data types.
- Store this schema information in a Svelte store for use by the UI.

## Acceptance Criteria
- [ ] Users can select a CSV/Parquet file from their local machine.
- [ ] The file is loaded into DuckDB WASM without uploading to a server.
- [ ] The schema (columns and types) is correctly inferred and displayed in the UI.
- [ ] Loading large files (e.g., 50MB+) does not crash the browser tab.
