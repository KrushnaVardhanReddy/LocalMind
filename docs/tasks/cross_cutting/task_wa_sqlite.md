# Task: wa-sqlite Workspace Persistence

## Objective
Implement the `wa-sqlite` Web Worker as a persistent local state store backed by the browser's Origin Private File System (OPFS). All LocalMind workspace data (saved queries, file metadata, dashboard layouts, preferences) must be persisted through this worker.

## Prerequisites
- Review `docs/specs/cross_cutting/02_wa_sqlite_spec.md`.
- Review `docs/contracts/cross_cutting/wa_sqlite_contract.md`.
- Task 1 (WorkerPool) must be complete — the wa-sqlite worker registers through `WorkerManager`.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add wa-sqlite
```

### 2. Create the wa-sqlite Worker
- Create `src/lib/workers/sqlite.worker.ts`.
- Initialize `wa-sqlite` using the `OPFSCoopSyncVFS` backend (required for OPFS persistence).
- Run the schema migration on `init()` — create all tables defined in `02_wa_sqlite_spec.md` using `CREATE TABLE IF NOT EXISTS`.
- Implement all methods defined in `WaSQLiteWorkerContract`.
- Call `expose(new SQLiteService())` at the end of the file.

### 3. Register with WorkerManager
- Add a `getSQLite()` static method to `WorkerManager.ts` following the same lazy-loading Singleton pattern used for `getDuckDB()`.

### 4. Create Svelte Store Wrapper
- Create `src/lib/stores/workspace.store.ts`.
- This store wraps the SQLiteWorker calls with reactive Svelte writable stores.
- Export: `currentWorkspace`, `savedQueries`, `registeredFiles`, `dashboardPanels`.
- These stores should auto-load their data when `currentWorkspace` changes.

### 5. Wire Up UI
- In the app header/sidebar, add a workspace selector dropdown bound to the `workspace.store.ts`.
- Add a "New Workspace" button that calls `createWorkspace()`.

## Definition of Done
- Saving a query, refreshing the browser tab, and reopening the workspace restores the saved query.
- OPFS storage is visible in DevTools → Application → Storage → File System.
- **No mocks.** The wa-sqlite WASM engine must be the real engine — no in-memory stubs.
- The UI thread is never blocked during any database write.
