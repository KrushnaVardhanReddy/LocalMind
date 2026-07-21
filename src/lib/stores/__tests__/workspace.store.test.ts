import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
    currentWorkspace,
    workspaces,
    savedQueries,
    registeredFiles,
    dashboardPanels,
    loadWorkspaces,
    createWorkspace,
    setWorkspace,
    saveQuery,
    registerFile
} from '../workspace.store';
import { WorkerManager } from '../../workers/WorkerManager';

// Define the mock worker implementation logic
const mockListWorkspaces = vi.fn();
const mockCreateWorkspace = vi.fn();
const mockListSavedQueries = vi.fn();
const mockListFiles = vi.fn();
const mockListDashboardPanels = vi.fn();
const mockSaveQuery = vi.fn();
const mockRegisterFile = vi.fn();

// Mock the WorkerManager
vi.mock('../../workers/WorkerManager', () => {
    return {
        WorkerManager: {
            getSQLite: vi.fn().mockImplementation(() => Promise.resolve({
                listWorkspaces: mockListWorkspaces,
                createWorkspace: mockCreateWorkspace,
                listSavedQueries: mockListSavedQueries,
                listFiles: mockListFiles,
                listDashboardPanels: mockListDashboardPanels,
                saveQuery: mockSaveQuery,
                registerFile: mockRegisterFile
            }))
        }
    };
});

describe('workspace.store', () => {
    beforeEach(() => {
        // Reset stores
        currentWorkspace.set(null);
        workspaces.set([]);
        savedQueries.set([]);
        registeredFiles.set([]);
        dashboardPanels.set([]);

        // Reset mock states
        vi.clearAllMocks();

        mockListWorkspaces.mockResolvedValue([
            { id: '1', name: 'WS 1' },
            { id: '2', name: 'WS 2' },
            { id: '3', name: 'WS 3' }
        ]);
        mockCreateWorkspace.mockResolvedValue({ id: '3', name: 'WS 3' });
        mockListSavedQueries.mockResolvedValue([{ id: 'q1', name: 'Query 1' }]);
        mockListFiles.mockResolvedValue([]);
        mockListDashboardPanels.mockResolvedValue([]);
        mockSaveQuery.mockResolvedValue({ id: 'q2', name: 'Query 2' });
        mockRegisterFile.mockResolvedValue({ id: 'f1', file_name: 'test.csv' });
    });

    it('loads workspaces', async () => {
        await loadWorkspaces();
        expect(mockListWorkspaces).toHaveBeenCalled();
        expect(get(workspaces)).toEqual([
            { id: '1', name: 'WS 1' },
            { id: '2', name: 'WS 2' },
            { id: '3', name: 'WS 3' }
        ]);
    });

    it('creates a workspace and sets it active', async () => {
        await createWorkspace('WS 3');

        expect(mockCreateWorkspace).toHaveBeenCalledWith('WS 3');
        expect(get(currentWorkspace)).toEqual({ id: '3', name: 'WS 3' });
    });

    it('sets active workspace and loads its data', async () => {
        await setWorkspace('1');

        expect(get(currentWorkspace)).toEqual({ id: '1', name: 'WS 1' });
        expect(mockListSavedQueries).toHaveBeenCalledWith('1');
        expect(get(savedQueries)).toEqual([{ id: 'q1', name: 'Query 1' }]);
    });

    it('clears active workspace on null', async () => {
        currentWorkspace.set({ id: '1', name: 'WS 1', created_at: 0, updated_at: 0 });
        savedQueries.set([{ id: 'q1', workspace_id: '1', name: 'Q', sql: '', created_at: 0 }]);

        await setWorkspace(null);

        expect(get(currentWorkspace)).toBeNull();
        expect(get(savedQueries)).toEqual([]);
    });

    it('saves a query for the current workspace', async () => {
        await setWorkspace('1');
        await saveQuery('New Query', 'SELECT 1');

        expect(mockSaveQuery).toHaveBeenCalledWith('1', 'New Query', 'SELECT 1');
        const sq = get(savedQueries);
        expect(sq[0]).toEqual({ id: 'q2', name: 'Query 2' });
    });

    it('throws when saving query without active workspace', async () => {
        await expect(saveQuery('New Query', 'SELECT 1')).rejects.toThrow("No active workspace");
    });
});
