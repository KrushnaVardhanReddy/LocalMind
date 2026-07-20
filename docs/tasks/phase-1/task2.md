# Task 2: Data Ingestion and Local File Access (v2 Streams API)

## Objective
Implement the zero-copy data ingestion pipeline by using the File System Access API and passing the `File` object through Comlink directly to DuckDB WASM, avoiding memory crashes on large datasets.

## Prerequisites
- Review `docs/specs/phase-1/02_query_engine_spec.md`.
- Ensure Task 1 (WorkerPool setup) is complete and tested.

## Implementation Steps

### 1. Implement File Picker UI
- In `src/routes/+page.svelte`, create a drag-and-drop zone and a "Select File" button.
- Bind the button to invoke the `window.showOpenFilePicker()` API.
- Ensure the picker accepts `.csv`, `.json`, and `.parquet` files.

### 2. Expand the Worker Contract
- Update `ui_worker_contract.md` (if needed) and the DuckDB Worker class to implement `registerFile(file: File, tableName: string)`.

### 3. Implement DuckDB File Registration
- In `src/lib/workers/duckdb.worker.ts`, write the logic for `registerFile()`.
- Use the `@duckdb/duckdb-wasm` API to register the file handle (`db.registerFileHandle(...)`).
- After registering the file, execute a `CREATE VIEW` query so the user can immediately select from the file as a table (e.g., `CREATE VIEW uploaded_data AS SELECT * FROM read_csv_auto('filename.csv')`).

### 4. Connect UI to Worker
- In the Svelte component, after obtaining the `File` from the picker, call `WorkerManager.getDuckDB()`.
- Await the `registerFile()` method, passing the local file object.
- Show a success notification or error toast upon completion.

## Definition of Done
- A 5GB CSV can be selected and registered without the browser tab crashing.
- The browser Memory profile shows no spikes when the file is selected (proving it's not being read into memory via `FileReader`).
- DuckDB successfully registers the virtual file.
