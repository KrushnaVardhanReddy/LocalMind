import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PolyglotPage from '../+page.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';

// Mock WorkerManager to prevent real Web Worker initialization during tests
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getWebLLM: vi.fn(),
        getWhisper: vi.fn(),
        getFFmpeg: vi.fn(),
        getDuckDB: vi.fn(),
    }
}));

describe('PolyglotPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock worker returns
        const mockWebLLMWorker = {
            getLoadedModel: vi.fn().mockResolvedValue(null),
            loadModel: vi.fn().mockResolvedValue(undefined),
            chat: vi.fn().mockResolvedValue(undefined),
        };
        const mockDuckDBWorker = {
            init: vi.fn().mockResolvedValue(undefined),
            query: vi.fn().mockResolvedValue({ rows: [] }),
        };

        vi.mocked(WorkerManager.getWebLLM).mockResolvedValue(mockWebLLMWorker as any);
        vi.mocked(WorkerManager.getDuckDB).mockResolvedValue(mockDuckDBWorker as any);
        vi.mocked(WorkerManager.getWhisper).mockResolvedValue({} as any);
        vi.mocked(WorkerManager.getFFmpeg).mockResolvedValue({} as any);
    });

    it('renders the main UI elements', () => {
        render(PolyglotPage as any);

        expect(screen.getByText('🌍 Polyglot AI Tutor')).toBeTruthy();
        expect(screen.getByLabelText('Language:')).toBeTruthy();
        expect(screen.getByPlaceholderText('Type a message or record audio...')).toBeTruthy();
        expect(screen.getByText('Vocabulary list')).toBeTruthy();
        expect(screen.getByLabelText('Save a new word:')).toBeTruthy();
    });

    it('allows changing the target language', async () => {
        render(PolyglotPage as any);

        const languageSelect = screen.getByLabelText('Language:') as HTMLSelectElement;
        expect(languageSelect.value).toBe('Spanish');

        await fireEvent.change(languageSelect, { target: { value: 'French' } });
        expect(languageSelect.value).toBe('French');
        expect(screen.getByText('Ready to practice French?')).toBeTruthy();
    });
});
