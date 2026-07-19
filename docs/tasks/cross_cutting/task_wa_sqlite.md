# Task: wa-sqlite Workspace Persistence

## Objective
Integrate `wa-sqlite` to persist workspace state (active dataset schema, table metadata, saved queries) across browser sessions.

## Spec Reference
`docs/specs/phase-1/01_data_ingestion_spec.md` — §2.5 Workspace Persistence

## Prerequisites
- WorkerPool abstraction task complete (`docs/tasks/cross_cutting/task_worker_pool.md`).

## Implementation Steps

### 1. Install wa-sqlite
```bash
npm install wa-sqlite
```

### 2. Initialize wa-sqlite in DuckDB Worker
- Inside `duckdb.worker.ts`, import and initialize `wa-sqlite` with an OPFS-backed database file (`localmind.db`).
- Create the schema on first run:
  ```sql
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    schema_json TEXT NOT NULL,
    row_count INTEGER,
    created_at INTEGER,
    last_accessed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS saved_queries (
    id TEXT PRIMARY KEY,
    workspace_id TEXT REFERENCES workspaces(id),
    name TEXT NOT NULL,
    sql TEXT NOT NULL,
    created_at INTEGER
  );
  ```

### 3. Persist on File Load
- After a file is successfully loaded into DuckDB and the schema is inferred, upsert a row into `workspaces`.
- Update `last_accessed_at` each time the workspace is activated.

### 4. Restore on App Start
- On `INIT`, query `wa-sqlite` for the most recently accessed workspace.
- If found, attempt to re-register the file with DuckDB. If the file is no longer accessible (File System Access API handle expired), surface a prompt: "Your last session with `{file_name}` cannot be restored. Please re-open the file."

### 5. Saved Queries Panel
- Add a `SAVE_QUERY` action to the DuckDB worker contract.
- In the UI, add a "Save Query" button in the SQL editor. On click, prompt for a name and persist to `saved_queries`.
- Add a "Saved Queries" panel that lists saved queries and allows one-click load into the SQL editor.

### 6. Expose `LOAD_SAVED_QUERY` and `DELETE_SAVED_QUERY` Actions
- Add these to the worker contract and implement in the worker.

## Acceptance Criteria
- [ ] Active dataset schema is restored on page reload without re-uploading the file (using OPFS handle if available).
- [ ] Saved queries persist across sessions.
- [ ] "Saved Queries" panel lists and loads queries correctly.
- [ ] Graceful message shown when file handle is no longer valid.
