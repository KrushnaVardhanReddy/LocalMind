import { WorkerManager } from '$lib/workers/WorkerManager';
import type { SessionManagerContract, SessionState } from './contracts/SessionManagerContract';
import type { WaSQLiteWorkerContract } from '$lib/contracts/wa_sqlite_contract';
import { pivotConfigStore, aiSummaryStore, missingFilesStore, toastMessage } from '$lib/stores/analytics.store';

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
        const aiSummary = await sqliteWorker.getPreference<string>(`aiSummary_${workspaceId}`);

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
                chatHistory: [], // Chat history is not currently in the schema/sqlite worker so we default to empty
                aiSummary: aiSummary || undefined
            }
        };

        const jsonString = JSON.stringify(sessionState, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }

    async importSession(file: File): Promise<string> {
        const text = await file.text();
        let sessionData: any;
        try {
            sessionData = JSON.parse(text);
        } catch (e) {
            throw new Error("SessionImportError: Invalid JSON file.");
        }

        if (sessionData.version !== "1.0") {
            throw new Error(`SessionImportError: Unsupported version '${sessionData.version}'.`);
        }

        if (!sessionData.name || !sessionData.state || !Array.isArray(sessionData.state.activeFiles)) {
            throw new Error("SessionImportError: Invalid session schema.");
        }

        const sqliteWorker = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

        // 1. Recreate workspace
        const workspace = await sqliteWorker.createWorkspace(sessionData.name);

        if (sessionData.state.activeFiles) {
            for (const f of sessionData.state.activeFiles) {
                await sqliteWorker.registerFile(workspace.id, f.name, f.tableName, f.sizeBytes || 0);
            }
        }

        if (sessionData.state.queries) {
            for (const q of sessionData.state.queries) {
                await sqliteWorker.saveQuery(workspace.id, q.name || 'Imported Query', q.sql);
            }
        }

        // Save the pivotConfig / chartConfig to a dashboard panel for persistence
        if (sessionData.state.chartConfig) {
            await sqliteWorker.saveDashboardPanel(
                workspace.id,
                sessionData.state.chartConfig,
                { x: 0, y: 0, w: 12, h: 4 } // default grid position
            );
        }

        if (sessionData.state.aiSummary) {
             // Save AI summary to a preference related to the workspace
             await sqliteWorker.setPreference(`aiSummary_${workspace.id}`, sessionData.state.aiSummary);
        }

        return workspace.id;
    }

    async hydrate(workspaceId: string) {
        const sqliteWorker = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

        const activeFiles = await sqliteWorker.listFiles(workspaceId);
        if (activeFiles.length > 0) {
            const missingFiles = activeFiles.map(f => f.file_name);
            missingFilesStore.set(missingFiles);
        } else {
            missingFilesStore.set([]);
        }

        const dashboardPanels = await sqliteWorker.listDashboardPanels(workspaceId);
        const chartConfig = dashboardPanels.length > 0 ? JSON.parse(dashboardPanels[0].chart_config) : null;
        pivotConfigStore.set(chartConfig);

        const aiSummary = await sqliteWorker.getPreference<string>(`aiSummary_${workspaceId}`);
        aiSummaryStore.set(aiSummary);

        const workspaces = await sqliteWorker.listWorkspaces();
        const workspace = workspaces.find(w => w.id === workspaceId);

        if (workspace) {
            toastMessage.set({ message: `Session restored: ${workspace.name}`, type: 'success' });
        }
    }

    async saveActiveState(workspaceId: string, state: Partial<SessionState['state']>): Promise<void> {
        const sqliteWorker = (await WorkerManager.getSQLite()) as WaSQLiteWorkerContract;

        if (state.chartConfig) {
            // Check if one exists and replace, else insert
            const panels = await sqliteWorker.listDashboardPanels(workspaceId);
            if (panels.length > 0) {
                await sqliteWorker.deleteDashboardPanel(panels[0].id);
            }
            await sqliteWorker.saveDashboardPanel(workspaceId, state.chartConfig, { x: 0, y: 0, w: 12, h: 4 });
        }

        if (state.aiSummary !== undefined) {
             await sqliteWorker.setPreference(`aiSummary_${workspaceId}`, state.aiSummary);
        }
    }
}
