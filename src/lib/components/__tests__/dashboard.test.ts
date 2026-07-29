import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import DashboardPage from '../../../routes/dashboard/+page.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getDuckDB: vi.fn()
    }
}));

// Mock echarts to fix canvas issues in tests
vi.mock('echarts', () => ({
    init: vi.fn().mockReturnValue({
        setOption: vi.fn(),
        resize: vi.fn(),
        dispose: vi.fn(),
        clear: vi.fn()
    })
}));

// Mock $app/environment
vi.mock('$app/environment', () => ({
    browser: true
}));

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
        const store: Record<string, string> = {};
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => { store[key] = value; },
            removeItem: (key: string) => { delete store[key]; },
            clear: () => {}
        });

        // Mock ResizeObserver
        vi.stubGlobal('ResizeObserver', class ResizeObserver {
            observe() {}
            unobserve() {}
            disconnect() {}
        });
    });

    it('shows empty state when no items in localStorage', () => {
        render(DashboardPage);
        expect(screen.getByText('Your dashboard is empty.')).toBeDefined();
    });

    it('renders items from localStorage and executes queries', async () => {
        // Setup mock data
        const mockItems = [
            {
                id: '1',
                title: 'Test Chart 1',
                sql: 'SELECT 1 as val',
                customOption: null
            },
            {
                id: '2',
                title: 'Test Chart 2',
                sql: 'SELECT 2 as val',
                customOption: null
            }
        ];
        localStorage.setItem('localmind_dashboard', JSON.stringify(mockItems));

        // Setup mock worker response
        const mockQuery = vi.fn().mockResolvedValue({
            columns: ['val'],
            rows: [{val: 1}],
            executionTimeMs: 10
        });

        vi.mocked(WorkerManager.getDuckDB).mockResolvedValue({
            query: mockQuery
        } as any);

        render(DashboardPage);

        // Items render with titles
        expect(screen.getByText('Test Chart 1')).toBeDefined();
        expect(screen.getByText('Test Chart 2')).toBeDefined();

        // Query function should be called
        // Since it's async in onMount, we use setImmediate/setTimeout or vitest waitFor
        await new Promise(r => setTimeout(r, 0));

        expect(mockQuery).toHaveBeenCalledTimes(2);
        expect(mockQuery).toHaveBeenCalledWith('SELECT 1 as val');
        expect(mockQuery).toHaveBeenCalledWith('SELECT 2 as val');
    });
});
