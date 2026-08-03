import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import TransactionTable from './TransactionTable.svelte';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getDuckDB: vi.fn(),
        getWebLLM: vi.fn(),
    }
}));

import { WorkerManager } from '$lib/workers/WorkerManager';

describe('TransactionTable', () => {
    let mockDuckDB: any;
    let mockLLM: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockDuckDB = {
            init: vi.fn().mockResolvedValue(undefined),
            registerFile: vi.fn().mockResolvedValue(undefined),
            getSchema: vi.fn().mockResolvedValue({ Date: 'VARCHAR', Description: 'VARCHAR', Amount: 'DOUBLE', Category: 'VARCHAR' }),
            query: vi.fn().mockResolvedValue({
                columns: ['Date', 'Description', 'Amount', 'Category'],
                rows: [
                    { Date: '2023-10-01', Description: 'GROCERY STORE', Amount: 50.00, Category: null }
                ]
            })
        };

        mockLLM = {
            getLoadedModel: vi.fn().mockResolvedValue('Mock-Model'),
            loadModel: vi.fn().mockResolvedValue(undefined),
            complete: vi.fn().mockResolvedValue('["Groceries"]')
        };

        (WorkerManager.getDuckDB as any).mockResolvedValue(mockDuckDB);
        (WorkerManager.getWebLLM as any).mockResolvedValue(mockLLM);
    });

    it('renders the initial UI correctly', () => {
        const { getByText } = render(TransactionTable);
        expect(getByText('Upload a CSV bank statement to get started.')).toBeInTheDocument();
    });

    it('initializes correctly without errors', () => {
        const { container } = render(TransactionTable);
        expect(container).toBeTruthy();
    });
});
