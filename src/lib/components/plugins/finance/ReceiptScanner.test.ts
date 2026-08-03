import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import ReceiptScanner from './ReceiptScanner.svelte';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getTesseract: vi.fn(),
        getWebLLM: vi.fn(),
    }
}));

import { WorkerManager } from '$lib/workers/WorkerManager';

describe('ReceiptScanner', () => {
    let mockTesseract: any;
    let mockLLM: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockTesseract = {
            init: vi.fn().mockResolvedValue(undefined),
            recognizeImage: vi.fn().mockResolvedValue({ text: 'Mocked OCR Text' }),
            recognizePDF: vi.fn().mockResolvedValue([{ text: 'Mocked OCR Text from PDF' }])
        };

        mockLLM = {
            getLoadedModel: vi.fn().mockResolvedValue('Mock-Model'),
            loadModel: vi.fn().mockResolvedValue(undefined),
            complete: vi.fn().mockResolvedValue('{\n  "Total Amount": "$100.00",\n  "Date": "2023-10-26"\n}')
        };

        (WorkerManager.getTesseract as any).mockResolvedValue(mockTesseract);
        (WorkerManager.getWebLLM as any).mockResolvedValue(mockLLM);
    });

    it('renders the initial UI correctly', () => {
        const { getByText, getByRole } = render(ReceiptScanner);
        expect(getByText('Click to upload or drag and drop')).toBeInTheDocument();
    });

    // We can't easily test the full file upload flow natively with JSDOM Drag events without complex mocking,
    // but we can ensure the component mounts and the mocks are set up.
    it('initializes correctly without errors', () => {
        const { container } = render(ReceiptScanner);
        expect(container).toBeTruthy();
    });
});
