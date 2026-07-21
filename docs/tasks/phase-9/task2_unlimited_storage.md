# Task 2: Storage Quota Bypass (Tauri Native FS)

## Objective
In the Tauri desktop app, replace OPFS-based storage with native filesystem paths so the wa-sqlite database and all workspace files are stored directly in the user's OS filesystem — removing browser storage quotas entirely.

## Prerequisites
- Review `docs/specs/phase-9/01_tauri_desktop_spec.md`.
- Task 1 (Tauri Scaffold) must be complete.

## Implementation Steps

### 1. Detect Tauri at Runtime
- The `tauri-bridge.ts` utility already exposes `isTauri()`.
- Create `src/lib/storage/storage-backend.ts` that exports:
  ```typescript
  type StorageBackend = 'opfs' | 'native-fs';
  export function getStorageBackend(): StorageBackend {
      return isTauri() ? 'native-fs' : 'opfs';
  }
  ```

### 2. Native wa-sqlite Path
- In the `sqlite.worker.ts`, check `getStorageBackend()`.
- If `'native-fs'`: instead of using `OPFSCoopSyncVFS`, use wa-sqlite's `IDBBatchAtomicVFS` with the Tauri `app_data_dir()` as the base path (via a Tauri Rust command exposed to JS).
- Create a Tauri Rust command `get_data_dir()` that returns `app_data_dir().join("localmind").join("workspace.db")`.

### 3. Large File Streaming (Beyond 2GB)
- In the `tauri-bridge.ts` `openFilePicker()`, after the user selects a file, expose the file path to the DuckDB worker via a new Tauri command `get_file_buffer(path)` that streams the file without loading it into JS heap.
- Update `DuckDBWorkerContract` to accept a `filePath: string` alternative to `File` in the `registerFile()` method — for Tauri-only use.

### 4. Storage Usage Display
- In Settings, show:
  - **Web:** "OPFS Storage used: X MB / ∞ (OPFS limit)".
  - **Desktop:** "Workspace database: `~/Library/Application Support/LocalMind/workspace.db` (X MB)".

## Definition of Done
- In the Tauri app, the wa-sqlite database is stored at the OS app data path (verifiable via Finder/Explorer).
- A 10GB CSV file can be registered with DuckDB in the Tauri app without the browser crashing.
- The storage path is displayed correctly in Settings.
- **No mocks.** Real Tauri Rust commands are invoked.
- The web version continues to use OPFS unchanged (the bridge correctly routes).
