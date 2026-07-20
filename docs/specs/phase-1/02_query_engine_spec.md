# Spec: Query Engine & Streams API (v2)

## 1. Objective
Enable LocalMind to query massive files (e.g., 5GB automotive telemetry CSVs) entirely in the browser without exceeding the V8 memory limit (typically 2-4GB per tab). We achieve this by avoiding `FileReader.readAsText()` and instead using the **File System Access API** combined with **Streams API** to pass chunks directly into DuckDB WASM.

## 2. Architecture

```mermaid
graph LR
    Disk[Local Hard Drive] --> |File System Access API| Handle[FileSystemFileHandle]
    Handle --> |ReadableStream| Stream[Chunked Data Stream]
    Stream --> |Zero-Copy| DuckDB[DuckDB WASM]
    DuckDB --> |SQL Query| Results[JSON / Arrow]
```

## 3. Implementation Flow

### 3.1 Obtaining the File Handle
Instead of `<input type="file">`, we use `window.showOpenFilePicker()` to get a `FileSystemFileHandle`. This prevents the browser from loading the file into memory and grants us direct disk read access.

```typescript
const [fileHandle] = await window.showOpenFilePicker({
    types: [{ accept: { 'text/csv': ['.csv'], 'application/json': ['.json'] } }]
});
```

### 3.2 Registering the File with DuckDB
DuckDB WASM supports registering an HTML5 File object directly, which internally uses stream buffering.

```typescript
// Inside duckdb.worker.ts
import * as duckdb from '@duckdb/duckdb-wasm';

async function registerVirtualFile(file: File, tableName: string) {
    // DuckDB WASM handles the chunking internally when passed a File object
    await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
    
    // Create a view or table from the registered file
    await conn.query(`CREATE VIEW ${tableName} AS SELECT * FROM read_csv_auto('${file.name}')`);
}
```

### 3.3 Memory Invariants
- **NEVER** use `await file.text()` or `await file.arrayBuffer()` on files over 10MB.
- **ALWAYS** stream data directly into the WASM engine.
- Results returned from `query()` should be paginated (e.g., `LIMIT 100`) to prevent the result set itself from crashing the UI thread.
