import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PivotBuilder from '../PivotBuilder.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';
import { tick } from 'svelte';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getDuckDB: vi.fn()
    }
}));

// Mock echarts since jsdom doesn't support canvas well
vi.mock('echarts', () => ({
    init: vi.fn().mockReturnValue({
        setOption: vi.fn(),
        resize: vi.fn(),
        dispose: vi.fn(),
        clear: vi.fn()
    })
}));

describe('PivotBuilder Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and displays schema on mount', async () => {
        const mockSchema = {
            id: 'INTEGER',
            country: 'VARCHAR',
            revenue: 'DOUBLE'
        };

        const mockGetSchema = vi.fn().mockResolvedValue(mockSchema);
        vi.mocked(WorkerManager.getDuckDB).mockResolvedValue({
            getSchema: mockGetSchema
        } as any);

        render(PivotBuilder, { tableName: 'sales' });

        // Wait for schema to be fetched
        await tick();
        // and Svelte to update
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockGetSchema).toHaveBeenCalledWith('sales');

        expect(screen.getByText('id')).toBeDefined();
        expect(screen.getByText('country')).toBeDefined();
        expect(screen.getByText('revenue')).toBeDefined();
    });

    it('generates query when items are dropped', async () => {
        const mockSchema = {
            country: 'VARCHAR',
            revenue: 'DOUBLE'
        };

        const mockQuery = vi.fn().mockResolvedValue({
            columns: ['country', 'SUM_revenue'],
            rows: [{ country: 'USA', SUM_revenue: 100 }],
            executionTimeMs: 5
        });

        vi.mocked(WorkerManager.getDuckDB).mockResolvedValue({
            getSchema: vi.fn().mockResolvedValue(mockSchema),
            query: mockQuery
        } as any);

        const { component } = render(PivotBuilder, { tableName: 'sales' });

        // Wait for fetchSchema
        await new Promise(resolve => setTimeout(resolve, 0));

        // We can test drag events, or we can just access internal functions
        // to simulate the drop behavior for easier unit testing.
        // Since it's challenging to simulate full DragEvent in JSDOM flawlessly,
        // we'll trigger the handlers.

        // Find drop zones by some text or class
        const rowsZone = screen.getByText('Rows / Dimensions').parentElement!;
        const valuesZone = screen.getByText('Values / Metrics').parentElement!;

        // We'll mock the DragEvent properties
        const dragStartEventCountry = new Event('dragstart') as any;
        dragStartEventCountry.dataTransfer = {
            setData: vi.fn(),
            effectAllowed: 'uninitialized'
        };
        const countryCol = screen.getByText('country');
        fireEvent(countryCol, dragStartEventCountry);

        // Drop on rows
        const dropEventRows = new Event('drop') as any;
        dropEventRows.dataTransfer = {}; // Not used in component logic after dragItem set
        dropEventRows.preventDefault = vi.fn();
        fireEvent(rowsZone, dropEventRows);

        await new Promise(resolve => setTimeout(resolve, 0));

        // Drag revenue to values
        const dragStartEventRev = new Event('dragstart') as any;
        dragStartEventRev.dataTransfer = {
            setData: vi.fn(),
            effectAllowed: 'uninitialized'
        };
        const revCol = screen.getByText('revenue');
        fireEvent(revCol, dragStartEventRev);

        const dropEventVals = new Event('drop') as any;
        dropEventVals.dataTransfer = {};
        dropEventVals.preventDefault = vi.fn();
        fireEvent(valuesZone, dropEventVals);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockQuery).toHaveBeenCalled();
        const calledSql = mockQuery.mock.calls[0][0];
        // The first call was for country (no values)
        // The second call is for country + SUM(revenue)
        const calledSql2 = mockQuery.mock.calls[1][0];

        expect(calledSql2).toContain('SELECT "country", SUM("revenue") AS "SUM_revenue" FROM "sales" GROUP BY "country"');

        // Result table renders
        expect(screen.getByText('USA')).toBeDefined();
        expect(screen.getByText('100')).toBeDefined();
    });

    it('displays chart type selector and has default "auto" option', async () => {
        render(PivotBuilder, { tableName: 'sales' });

        await tick();

        const selector = screen.getByLabelText('Chart Type:') as HTMLSelectElement;
        expect(selector).toBeDefined();
        expect(selector.value).toBe('auto');
    });
});
