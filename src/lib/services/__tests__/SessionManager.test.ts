import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionManager } from '../SessionManager';
import { WorkerManager } from '$lib/workers/WorkerManager';

vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getSQLite: vi.fn()
    }
}));

describe('SessionManager', () => {
    let sessionManager: SessionManager;
    let mockSQLiteWorker: any;

    beforeEach(() => {
        sessionManager = new SessionManager();
        mockSQLiteWorker = {
            createWorkspace: vi.fn().mockResolvedValue({ id: 'wsnew' }),
            listWorkspaces: vi.fn().mockResolvedValue([{ id: 'ws1', name: 'Test Workspace' }]),
            listFiles: vi.fn().mockResolvedValue([
                { id: 'f1', file_name: 'test.csv', table_name: 'test_csv', file_size_bytes: 100, registered_at: 1000 }
            ]),
            listSavedQueries: vi.fn().mockResolvedValue([
                { id: 'q1', name: 'Query 1', sql: 'SELECT * FROM test', created_at: 1000 }
            ]),
            listDashboardPanels: vi.fn().mockResolvedValue([
                { id: 'p1', chart_config: '{"type":"bar"}' }
            ]),
            saveQuery: vi.fn(),
            registerFile: vi.fn(),
            saveDashboardPanel: vi.fn(),
            deleteDashboardPanel: vi.fn(),
            getPreference: vi.fn().mockResolvedValue(undefined),
            setPreference: vi.fn()
        };
        (WorkerManager.getSQLite as any).mockResolvedValue(mockSQLiteWorker);
    });

    describe('exportSession', () => {
        it('should correctly format and export session data', async () => {
            const blob = await sessionManager.exportSession('ws1');
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('application/json');

            const text = await blob.text();
            const data = JSON.parse(text);

            expect(data.version).toBe('1.0');
            expect(data.workspaceId).toBe('ws1');
            expect(data.name).toBe('Test Workspace');
            expect(data.state.activeFiles).toHaveLength(1);
            expect(data.state.activeFiles[0].name).toBe('test.csv');
            expect(data.state.queries).toHaveLength(1);
            expect(data.state.queries[0].sql).toBe('SELECT * FROM test');
            expect(data.state.chartConfig).toEqual({ type: 'bar' });
            expect(data.state.chatHistory).toEqual([]);
        });

        it('should throw an error if the workspace does not exist', async () => {
            await expect(sessionManager.exportSession('ws2')).rejects.toThrow('Workspace with id ws2 not found');
        });
    });

    describe('importSession', () => {
        it('should throw on invalid JSON', async () => {
            const file = new File(['invalid json'], 'test.lm');
            await expect(sessionManager.importSession(file)).rejects.toThrow('SessionImportError: Invalid JSON file.');
        });

        it('should throw on invalid version', async () => {
            const file = new File(['{"version": "2.0"}'], 'test.lm');
            await expect(sessionManager.importSession(file)).rejects.toThrow("SessionImportError: Unsupported version '2.0'.");
        });

        it('should parse valid session and populate SQLite', async () => {
            const validSession = {
                version: "1.0",
                name: "Test Import",
                state: {
                    activeFiles: [{ name: 'test.csv', tableName: 'test_csv' }],
                    queries: [{ name: 'Test Query', sql: 'SELECT * FROM test' }],
                    chartConfig: { type: 'bar' },
                    aiSummary: "AI Insight"
                }
            };
            const file = new File([JSON.stringify(validSession)], 'test.lm');
            const wsId = await sessionManager.importSession(file);

            expect(wsId).toBe('wsnew');
            expect(mockSQLiteWorker.createWorkspace).toHaveBeenCalledWith('Test Import');
            expect(mockSQLiteWorker.registerFile).toHaveBeenCalledWith('wsnew', 'test.csv', 'test_csv', 0);
            expect(mockSQLiteWorker.saveQuery).toHaveBeenCalledWith('wsnew', 'Test Query', 'SELECT * FROM test');
            expect(mockSQLiteWorker.saveDashboardPanel).toHaveBeenCalledWith('wsnew', { type: 'bar' }, { x: 0, y: 0, w: 12, h: 4 });
            expect(mockSQLiteWorker.setPreference).toHaveBeenCalledWith('aiSummary_wsnew', 'AI Insight');
        });
    });

    describe('saveActiveState', () => {
        it('should save chart config and AI summary', async () => {
            await sessionManager.saveActiveState('ws1', { chartConfig: { type: 'line' }, aiSummary: 'New Insight' });
            expect(mockSQLiteWorker.deleteDashboardPanel).toHaveBeenCalledWith('p1');
            expect(mockSQLiteWorker.saveDashboardPanel).toHaveBeenCalledWith('ws1', { type: 'line' }, { x: 0, y: 0, w: 12, h: 4 });
            expect(mockSQLiteWorker.setPreference).toHaveBeenCalledWith('aiSummary_ws1', 'New Insight');
        });
    });
});
