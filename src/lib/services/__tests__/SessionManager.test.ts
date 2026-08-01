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
            listWorkspaces: vi.fn().mockResolvedValue([{ id: 'ws1', name: 'Test Workspace' }]),
            listFiles: vi.fn().mockResolvedValue([
                { id: 'f1', file_name: 'test.csv', table_name: 'test_csv', file_size_bytes: 100, registered_at: 1000 }
            ]),
            listSavedQueries: vi.fn().mockResolvedValue([
                { id: 'q1', name: 'Query 1', sql: 'SELECT * FROM test', created_at: 1000 }
            ]),
            listDashboardPanels: vi.fn().mockResolvedValue([
                { id: 'p1', chart_config: '{"type":"bar"}' }
            ])
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
        it('should throw "Not implemented" error', async () => {
            const file = new File([''], 'test.lm');
            await expect(sessionManager.importSession(file)).rejects.toThrow('Not implemented');
        });
    });

    describe('saveActiveState', () => {
        it('should throw "Not implemented" error', async () => {
            await expect(sessionManager.saveActiveState('ws1', {})).rejects.toThrow('Not implemented');
        });
    });
});
