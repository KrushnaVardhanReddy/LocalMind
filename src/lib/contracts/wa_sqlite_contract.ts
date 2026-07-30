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

export interface InstalledPluginRecord {
    id: string;
    name: string;
    version: string;
    author: string | null;
    description: string | null;
    manifest: string; // JSON blob of plugin.json
    wasm_opfs_path: string; // path within OPFS
    enabled: number; // 0 or 1
    installed_at: number;
}

export interface DocumentChunkRecord {
    id: string;
    workspace_id: string;
    file_name: string;
    chunk_index: number;
    chunk_text: string;
    embedding: ArrayBuffer; // 384 float32 values stored as raw bytes
}

export interface SavedPipelineRecord {
    id: string;
    name: string;
    nodes: string; // JSON
    edges: string; // JSON
    updated_at: number;
}

export interface CustomTemplateRecord {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'sales' | 'hr' | 'logs' | 'finance' | 'general';
    required_columns: string; // JSON
    optional_columns: string; // JSON
    pivot_config: string; // JSON
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

    // --- Plugins ---
    savePlugin(record: Omit<InstalledPluginRecord, 'installed_at'>): Promise<InstalledPluginRecord>;
    listPlugins(): Promise<InstalledPluginRecord[]>;
    deletePlugin(id: string): Promise<void>;
    updatePluginEnabled(id: string, enabled: boolean): Promise<void>;

    // --- Document Chunks (Embeddings) ---
    insertDocumentChunk(record: Omit<DocumentChunkRecord, 'id'>): Promise<DocumentChunkRecord>;
    getAllDocumentChunks(workspaceId: string): Promise<DocumentChunkRecord[]>;

    // --- Saved Pipelines ---
    savePipeline(name: string, nodes: string, edges: string): Promise<SavedPipelineRecord>;
    listPipelines(): Promise<SavedPipelineRecord[]>;
    deletePipeline(id: string): Promise<void>;

    // --- Custom Templates ---
    saveCustomTemplate(record: Omit<CustomTemplateRecord, 'created_at' | 'id'>): Promise<CustomTemplateRecord>;
    listCustomTemplates(): Promise<CustomTemplateRecord[]>;
    deleteCustomTemplate(id: string): Promise<void>;
}
