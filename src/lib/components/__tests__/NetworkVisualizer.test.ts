import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import NetworkVisualizer from '../analytics/NetworkVisualizer.svelte';
import { uploadedTables } from '$lib/stores/analytics.store';
import { WorkerManager } from '$lib/workers/WorkerManager';

// Mock ECharts
vi.mock('echarts', () => ({
    init: vi.fn().mockReturnValue({
        setOption: vi.fn(),
        resize: vi.fn(),
        dispose: vi.fn(),
        clear: vi.fn()
    })
}));

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getDuckDB: vi.fn().mockResolvedValue({
            getSchema: vi.fn().mockResolvedValue({}),
            query: vi.fn().mockResolvedValue({ rows: [] })
        })
    }
}));

describe('NetworkVisualizer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear stores
        uploadedTables.set([]);
        (WorkerManager.getDuckDB as any).mockResolvedValue({
            getSchema: vi.fn().mockResolvedValue({}),
            query: vi.fn().mockResolvedValue({ rows: [] })
        });
    });

    it('renders initial state with empty tables', () => {
        render(NetworkVisualizer);
        expect(screen.getByText('Select a table and columns to visualize the network graph.')).toBeInTheDocument();
        expect(screen.getByLabelText('Source Table')).toBeInTheDocument();
        expect(screen.queryByLabelText('Source Column')).not.toBeInTheDocument();
    });

    it('updates tables from store', async () => {
        uploadedTables.set(['test_table_1', 'test_table_2']);
        render(NetworkVisualizer);

        const select = screen.getByLabelText('Source Table');
        expect(select).toHaveTextContent('test_table_1');
        expect(select).toHaveTextContent('test_table_2');
    });

    it('loads schema when a table is selected', async () => {
        const mockGetSchema = vi.fn().mockResolvedValue({
            col1: 'VARCHAR',
            col2: 'VARCHAR',
            col3: 'INTEGER'
        });
        (WorkerManager.getDuckDB as any).mockResolvedValue({
            getSchema: mockGetSchema
        });

        uploadedTables.set(['test_table']);
        render(NetworkVisualizer);

        const tableSelect = screen.getByLabelText('Source Table');
        await fireEvent.change(tableSelect, { target: { value: 'test_table' } });

        await waitFor(() => {
            expect(mockGetSchema).toHaveBeenCalledWith('test_table');
        });

        // Ensure columns appear
        expect(screen.getByLabelText('Source Column')).toBeInTheDocument();
        expect(screen.getByLabelText('Target Column')).toBeInTheDocument();
        expect(screen.getByLabelText('Weight Column (Optional)')).toBeInTheDocument();

        const sourceSelect = screen.getByLabelText('Source Column');
        expect(sourceSelect).toHaveTextContent('col1');
        expect(sourceSelect).toHaveTextContent('col2');
        expect(sourceSelect).toHaveTextContent('col3');
    });
});
