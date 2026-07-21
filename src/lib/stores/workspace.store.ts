import { writable, get } from 'svelte/store';
import { WorkerManager } from '../workers/WorkerManager';
import type { WaSQLiteWorkerContract, WorkspaceRecord, SavedQueryRecord, RegisteredFileRecord, DashboardPanelRecord } from '../contracts/wa_sqlite_contract';

export const currentWorkspace = writable<WorkspaceRecord | null>(null);
export const workspaces = writable<WorkspaceRecord[]>([]);
export const savedQueries = writable<SavedQueryRecord[]>([]);
export const registeredFiles = writable<RegisteredFileRecord[]>([]);
export const dashboardPanels = writable<DashboardPanelRecord[]>([]);

let sqliteWorker: WaSQLiteWorkerContract | null = null;

async function getWorker(): Promise<WaSQLiteWorkerContract> {
    if (!sqliteWorker) {
        sqliteWorker = await WorkerManager.getSQLite() as WaSQLiteWorkerContract;
    }
    return sqliteWorker;
}

export async function loadWorkspaces() {
    const worker = await getWorker();
    const list = await worker.listWorkspaces();
    workspaces.set(list);
    return list;
}

export async function createWorkspace(name: string) {
    const worker = await getWorker();
    const ws = await worker.createWorkspace(name);
    await loadWorkspaces();
    await setWorkspace(ws.id);
    return ws;
}

export async function setWorkspace(id: string | null) {
    if (!id) {
        currentWorkspace.set(null);
        savedQueries.set([]);
        registeredFiles.set([]);
        dashboardPanels.set([]);
        return;
    }

    const worker = await getWorker();
    const list = await worker.listWorkspaces();
    const ws = list.find(w => w.id === id);
    if (!ws) throw new Error("Workspace not found");

    currentWorkspace.set(ws);

    // Auto load data for the new workspace
    const [queries, files, panels] = await Promise.all([
        worker.listSavedQueries(id),
        worker.listFiles(id),
        worker.listDashboardPanels(id)
    ]);

    savedQueries.set(queries);
    registeredFiles.set(files);
    dashboardPanels.set(panels);
}

// Helpers for interacting with the active workspace
export async function saveQuery(name: string, sql: string) {
    const ws = get(currentWorkspace);
    if (!ws) throw new Error("No active workspace");
    const worker = await getWorker();
    const result = await worker.saveQuery(ws.id, name, sql);
    savedQueries.update(q => [result, ...q]);
    return result;
}

export async function registerFile(fileName: string, tableName: string, fileSizeBytes: number) {
    const ws = get(currentWorkspace);
    if (!ws) throw new Error("No active workspace");
    const worker = await getWorker();
    const result = await worker.registerFile(ws.id, fileName, tableName, fileSizeBytes);
    registeredFiles.update(f => [result, ...f]);
    return result;
}
