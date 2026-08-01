import { WorkerManager } from '$lib/workers/WorkerManager';
import type { SessionManagerContract, SessionState } from './contracts/SessionManagerContract';
import type { WaSQLiteWorkerContract } from '$lib/contracts/wa_sqlite_contract';

export class SessionManager implements SessionManagerContract {
    async exportSession(workspaceId: string): Promise<Blob> {
        const sqliteWorker = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

        // Fetch all required data in parallel
        const [
            workspaces,
            activeFiles,
            queries,
            dashboardPanels,
        ] = await Promise.all([
            sqliteWorker.listWorkspaces(),
            sqliteWorker.listFiles(workspaceId),
            sqliteWorker.listSavedQueries(workspaceId),
            sqliteWorker.listDashboardPanels(workspaceId)
        ]);

        const workspace = workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            throw new Error(`Workspace with id ${workspaceId} not found`);
        }

        // We'll just grab the first dashboard panel's config if it exists as the spec only has a single chartConfig
        const chartConfig = dashboardPanels.length > 0 ? JSON.parse(dashboardPanels[0].chart_config) : null;

        const sessionState: SessionState = {
            version: "1.0",
            workspaceId: workspace.id,
            name: workspace.name,
            exportTimestamp: Date.now(),
            state: {
                activeFiles: activeFiles.map(f => ({
                    id: f.id,
                    name: f.file_name,
                    tableName: f.table_name,
                    sizeBytes: f.file_size_bytes,
                    registeredAt: f.registered_at
                })),
                queries: queries.map(q => ({
                    id: q.id,
                    name: q.name,
                    sql: q.sql,
                    timestamp: q.created_at
                })),
                chartConfig,
                chatHistory: [] // Chat history is not currently in the schema/sqlite worker so we default to empty
            }
        };

        const jsonString = JSON.stringify(sessionState, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }

    async importSession(file: File): Promise<string> {
        throw new Error("Not implemented");
    }

    async saveActiveState(workspaceId: string, state: Partial<SessionState['state']>): Promise<void> {
        throw new Error("Not implemented");
    }
}
