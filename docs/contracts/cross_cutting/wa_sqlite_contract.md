# Contract: wa-sqlite Worker (Cross-Cutting)

## 1. Overview
This contract defines the TypeScript interface that all LocalMind components must use when communicating with the `wa-sqlite` Web Worker via Comlink.

## 2. TypeScript Interface

```typescript
// docs/contracts/cross_cutting/wa_sqlite_contract.ts

export interface WorkspaceRecord {
    id: string;
    name: string;
    created_at: number;
    updated_at: number;
}

export interface RegisteredFileRecord {
    id: string;
    workspace_id: string;
    file_name: string;
    table_name: string;
    file_size_bytes: number;
    registered_at: number;
}

export interface SavedQueryRecord {
    id: string;
    workspace_id: string;
    name: string;
    sql: string;
    created_at: number;
}

export interface DashboardPanelRecord {
    id: string;
    workspace_id: string;
    chart_config: string; // JSON-serialized ECharts option
    grid_position: string; // JSON: {x, y, w, h}
    created_at: number;
}

export interface WaSQLiteWorkerContract {
    /**
     * Initializes the wa-sqlite WASM engine with an OPFS backend.
     * Must be called once before any other methods.
     */
    init(): Promise<void>;

    // --- Workspace CRUD ---
    createWorkspace(name: string): Promise<WorkspaceRecord>;
    listWorkspaces(): Promise<WorkspaceRecord[]>;
    deleteWorkspace(id: string): Promise<void>;

    // --- File Registration ---
    registerFile(workspaceId: string, fileName: string, tableName: string, fileSizeBytes: number): Promise<RegisteredFileRecord>;
    listFiles(workspaceId: string): Promise<RegisteredFileRecord[]>;
    unregisterFile(id: string): Promise<void>;

    // --- Saved Queries ---
    saveQuery(workspaceId: string, name: string, sql: string): Promise<SavedQueryRecord>;
    listSavedQueries(workspaceId: string): Promise<SavedQueryRecord[]>;
    deleteSavedQuery(id: string): Promise<void>;

    // --- Dashboard Panels ---
    saveDashboardPanel(workspaceId: string, chartConfig: object, gridPosition: object): Promise<DashboardPanelRecord>;
    listDashboardPanels(workspaceId: string): Promise<DashboardPanelRecord[]>;
    deleteDashboardPanel(id: string): Promise<void>;

    // --- Preferences ---
    setPreference(key: string, value: unknown): Promise<void>;
    getPreference<T>(key: string): Promise<T | null>;
}
```

## 3. Invariants for Jules
1. All IDs are `crypto.randomUUID()` generated on the worker side.
2. The UI **must never** directly access OPFS — all persistence goes through this contract.
3. Timestamps are Unix epoch integers (`Date.now()` / 1000).
4. `chart_config` and `grid_position` are stored as serialized JSON strings in SQLite and must be `JSON.parse()`-ed before use.
