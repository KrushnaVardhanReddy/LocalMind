/// <reference path="./wa-sqlite-examples.d.ts" />
import { expose } from 'comlink';
import * as SQLite from 'wa-sqlite';
import SQLiteAsyncModule from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import { AccessHandlePoolVFS } from 'wa-sqlite/src/examples/AccessHandlePoolVFS.js';
import type {
    WaSQLiteWorkerContract,
    WorkspaceRecord,
    RegisteredFileRecord,
    SavedQueryRecord,
    DashboardPanelRecord
} from '../contracts/wa_sqlite_contract';

class SQLiteService implements WaSQLiteWorkerContract {
    private sqlite3: SQLiteAPI | null = null;
    private db: number | null = null;

    async init() {
        if (this.sqlite3) return;

        const module = await SQLiteAsyncModule();
        this.sqlite3 = SQLite.Factory(module);

        const vfs = new AccessHandlePoolVFS('localmind-db');
        await vfs.isReady;
        this.sqlite3.vfs_register(vfs as any, true);

        this.db = await this.sqlite3.open_v2(
            'localmind_workspace.db',
            SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_URI,
            vfs.name
        );

        await this.execute('PRAGMA foreign_keys = ON;');

        await this.runSchemaMigrations();
    }

    private async runSchemaMigrations() {
        if (!this.sqlite3 || this.db === null) throw new Error("Database not initialized");

        const schema = `
            -- Saved Workspaces
            CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at INTEGER DEFAULT (unixepoch()),
                updated_at INTEGER DEFAULT (unixepoch())
            );

            -- Registered file metadata
            CREATE TABLE IF NOT EXISTS registered_files (
                id TEXT PRIMARY KEY,
                workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                table_name TEXT NOT NULL,
                file_size_bytes INTEGER,
                registered_at INTEGER DEFAULT (unixepoch())
            );

            -- Saved SQL queries
            CREATE TABLE IF NOT EXISTS saved_queries (
                id TEXT PRIMARY KEY,
                workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                sql TEXT NOT NULL,
                created_at INTEGER DEFAULT (unixepoch())
            );

            -- Dashboard panel layouts
            CREATE TABLE IF NOT EXISTS dashboard_panels (
                id TEXT PRIMARY KEY,
                workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
                chart_config TEXT NOT NULL,
                grid_position TEXT NOT NULL,
                created_at INTEGER DEFAULT (unixepoch())
            );

            -- Global user preferences
            CREATE TABLE IF NOT EXISTS preferences (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            -- Installed Plugins
            CREATE TABLE IF NOT EXISTS installed_plugins (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                version TEXT NOT NULL,
                author TEXT,
                description TEXT,
                manifest TEXT NOT NULL, -- JSON blob of plugin.json
                wasm_opfs_path TEXT NOT NULL, -- path within OPFS
                enabled INTEGER DEFAULT 1,
                installed_at INTEGER DEFAULT (unixepoch())
            );

            -- Document Chunks for Semantic Search
            CREATE TABLE IF NOT EXISTS document_chunks (
                id TEXT PRIMARY KEY,
                workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                embedding BLOB NOT NULL -- 384 float32 values stored as raw bytes
            );

            CREATE TABLE IF NOT EXISTS saved_pipelines (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                nodes TEXT NOT NULL,
                edges TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );
        `;

        for await (const stmt of this.sqlite3.statements(this.db, schema)) {
            while (await this.sqlite3.step(stmt) === SQLite.SQLITE_ROW) {}
        }
    }

    private async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.sqlite3 || this.db === null) throw new Error("Database not initialized");
        const results: T[] = [];

        const str = this.sqlite3.str_new(this.db, sql);
        const pStmtObj = await this.sqlite3.prepare_v2(this.db, this.sqlite3.str_value(str));
        this.sqlite3.str_finish(str);

        if (!pStmtObj) return results;

        const pStmt = pStmtObj.stmt;

        try {
            for (let i = 0; i < params.length; i++) {
                const param = params[i];
                if (typeof param === 'string') {
                    this.sqlite3.bind_text(pStmt, i + 1, param);
                } else if (typeof param === 'number') {
                    if (Number.isInteger(param)) {
                        this.sqlite3.bind_int(pStmt, i + 1, param);
                    } else {
                        this.sqlite3.bind_double(pStmt, i + 1, param);
                    }
                } else if (param === null) {
                    this.sqlite3.bind_null(pStmt, i + 1);
                } else {
                    this.sqlite3.bind_text(pStmt, i + 1, JSON.stringify(param));
                }
            }

            const columnCount = this.sqlite3.column_count(pStmt);
            const columnNames: string[] = [];
            for (let i = 0; i < columnCount; i++) {
                columnNames.push(this.sqlite3.column_name(pStmt, i));
            }

            while (await this.sqlite3.step(pStmt) === SQLite.SQLITE_ROW) {
                const row: any = {};
                for (let i = 0; i < columnCount; i++) {
                    const type = this.sqlite3.column_type(pStmt, i);
                    let value: any = null;
                    if (type === SQLite.SQLITE_INTEGER) {
                        value = this.sqlite3.column_int(pStmt, i);
                    } else if (type === SQLite.SQLITE_FLOAT) {
                        value = this.sqlite3.column_double(pStmt, i);
                    } else if (type === SQLite.SQLITE_TEXT) {
                        value = this.sqlite3.column_text(pStmt, i);
                    } else if (type === SQLite.SQLITE_BLOB) {
                        value = this.sqlite3.column_blob(pStmt, i);
                    }
                    row[columnNames[i]] = value;
                }
                results.push(row as T);
            }
        } finally {
            this.sqlite3.finalize(pStmt);
        }

        return results;
    }

    private async execute(sql: string, params: any[] = []): Promise<void> {
        await this.query(sql, params);
    }

    // --- Workspace CRUD ---
    async createWorkspace(name: string): Promise<WorkspaceRecord> {
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        await this.execute(
            `INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
            [id, name, now, now]
        );
        const rows = await this.query<WorkspaceRecord>(`SELECT * FROM workspaces WHERE id = ?`, [id]);
        return rows[0];
    }

    async listWorkspaces(): Promise<WorkspaceRecord[]> {
        return await this.query<WorkspaceRecord>(`SELECT * FROM workspaces ORDER BY updated_at DESC`);
    }

    async deleteWorkspace(id: string): Promise<void> {
        await this.execute(`BEGIN TRANSACTION`);
        try {
            await this.execute(`DELETE FROM workspaces WHERE id = ?`, [id]);
            await this.execute(`COMMIT`);
        } catch (e) {
            await this.execute(`ROLLBACK`);
            throw e;
        }
    }

    // --- File Registration ---
    async registerFile(workspaceId: string, fileName: string, tableName: string, fileSizeBytes: number): Promise<RegisteredFileRecord> {
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        await this.execute(
            `INSERT INTO registered_files (id, workspace_id, file_name, table_name, file_size_bytes, registered_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, workspaceId, fileName, tableName, fileSizeBytes, now]
        );
        const rows = await this.query<RegisteredFileRecord>(`SELECT * FROM registered_files WHERE id = ?`, [id]);
        return rows[0];
    }

    async listFiles(workspaceId: string): Promise<RegisteredFileRecord[]> {
        return await this.query<RegisteredFileRecord>(`SELECT * FROM registered_files WHERE workspace_id = ? ORDER BY registered_at DESC`, [workspaceId]);
    }

    async unregisterFile(id: string): Promise<void> {
        await this.execute(`DELETE FROM registered_files WHERE id = ?`, [id]);
    }

    // --- Saved Queries ---
    async saveQuery(workspaceId: string, name: string, sql: string): Promise<SavedQueryRecord> {
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        await this.execute(
            `INSERT INTO saved_queries (id, workspace_id, name, sql, created_at) VALUES (?, ?, ?, ?, ?)`,
            [id, workspaceId, name, sql, now]
        );
        const rows = await this.query<SavedQueryRecord>(`SELECT * FROM saved_queries WHERE id = ?`, [id]);
        return rows[0];
    }

    async listSavedQueries(workspaceId: string): Promise<SavedQueryRecord[]> {
        return await this.query<SavedQueryRecord>(`SELECT * FROM saved_queries WHERE workspace_id = ? ORDER BY created_at DESC`, [workspaceId]);
    }

    async deleteSavedQuery(id: string): Promise<void> {
        await this.execute(`DELETE FROM saved_queries WHERE id = ?`, [id]);
    }

    // --- Dashboard Panels ---
    async saveDashboardPanel(workspaceId: string, chartConfig: object, gridPosition: object): Promise<DashboardPanelRecord> {
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        const chartConfigStr = JSON.stringify(chartConfig);
        const gridPositionStr = JSON.stringify(gridPosition);
        await this.execute(
            `INSERT INTO dashboard_panels (id, workspace_id, chart_config, grid_position, created_at) VALUES (?, ?, ?, ?, ?)`,
            [id, workspaceId, chartConfigStr, gridPositionStr, now]
        );
        const rows = await this.query<DashboardPanelRecord>(`SELECT * FROM dashboard_panels WHERE id = ?`, [id]);
        return rows[0];
    }

    async listDashboardPanels(workspaceId: string): Promise<DashboardPanelRecord[]> {
        return await this.query<DashboardPanelRecord>(`SELECT * FROM dashboard_panels WHERE workspace_id = ? ORDER BY created_at DESC`, [workspaceId]);
    }

    async deleteDashboardPanel(id: string): Promise<void> {
        await this.execute(`DELETE FROM dashboard_panels WHERE id = ?`, [id]);
    }

    // --- Preferences ---
    async setPreference(key: string, value: unknown): Promise<void> {
        const valueStr = JSON.stringify(value);
        await this.execute(
            `INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            [key, valueStr]
        );
    }

    async getPreference<T>(key: string): Promise<T | null> {
        const rows = await this.query<{value: string}>(`SELECT value FROM preferences WHERE key = ?`, [key]);
        if (rows.length === 0) return null;
        try {
            return JSON.parse(rows[0].value) as T;
        } catch (e) {
            return null;
        }
    }

    // --- Plugins ---
    async savePlugin(record: any): Promise<any> {
        const now = Math.floor(Date.now() / 1000);
        await this.execute(
            `INSERT INTO installed_plugins (id, name, version, author, description, manifest, wasm_opfs_path, enabled, installed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name = excluded.name, version = excluded.version, author = excluded.author, description = excluded.description, manifest = excluded.manifest, wasm_opfs_path = excluded.wasm_opfs_path, enabled = excluded.enabled`,
            [record.id, record.name, record.version, record.author, record.description, record.manifest, record.wasm_opfs_path, record.enabled, now]
        );
        const rows = await this.query(`SELECT * FROM installed_plugins WHERE id = ?`, [record.id]);
        return rows[0];
    }

    async listPlugins(): Promise<any[]> {
        return await this.query(`SELECT * FROM installed_plugins ORDER BY installed_at DESC`);
    }

    async deletePlugin(id: string): Promise<void> {
        await this.execute(`DELETE FROM installed_plugins WHERE id = ?`, [id]);
    }

    async updatePluginEnabled(id: string, enabled: boolean): Promise<void> {
        await this.execute(`UPDATE installed_plugins SET enabled = ? WHERE id = ?`, [enabled ? 1 : 0, id]);
    }

    // --- Document Chunks ---
    async insertDocumentChunk(record: any): Promise<any> {
        const id = crypto.randomUUID();

        // Ensure embedding is a Uint8Array for SQLite blob binding
        const embeddingBlob = new Uint8Array(record.embedding);

        await this.execute(
            `INSERT INTO document_chunks (id, workspace_id, file_name, chunk_index, chunk_text, embedding) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, record.workspace_id, record.file_name, record.chunk_index, record.chunk_text, embeddingBlob]
        );
        const rows = await this.query(`SELECT * FROM document_chunks WHERE id = ?`, [id]);
        return rows[0];
    }

    async getAllDocumentChunks(workspaceId: string): Promise<any[]> {
        return await this.query(`SELECT * FROM document_chunks WHERE workspace_id = ? ORDER BY file_name ASC, chunk_index ASC`, [workspaceId]);
    }

    // --- Saved Pipelines ---
    async savePipeline(name: string, nodes: string, edges: string): Promise<any> {
        const id = crypto.randomUUID();
        const now = Math.floor(Date.now() / 1000);
        await this.execute(
            `INSERT INTO saved_pipelines (id, name, nodes, edges, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [id, name, nodes, edges, now]
        );
        const rows = await this.query(`SELECT * FROM saved_pipelines WHERE id = ?`, [id]);
        return rows[0];
    }

    async listPipelines(): Promise<any[]> {
        return await this.query(`SELECT * FROM saved_pipelines ORDER BY updated_at DESC`);
    }

    async deletePipeline(id: string): Promise<void> {
        await this.execute(`DELETE FROM saved_pipelines WHERE id = ?`, [id]);
    }
}

expose(new SQLiteService());
