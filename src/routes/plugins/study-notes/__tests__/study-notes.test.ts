import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import StudyNotesPage from '../+page.svelte';
import '@testing-library/jest-dom/vitest';
import { WorkerManager } from '$lib/workers/WorkerManager';

// Mock the WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getWebLLM: vi.fn(),
        getWhisper: vi.fn()
    }
}));

// Mock Comlink's proxy
vi.mock('comlink', () => ({
    proxy: vi.fn((fn) => fn),
    wrap: vi.fn(),
    expose: vi.fn()
}));

// Mock window.URL.createObjectURL for the export test
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');

describe('Study Notes Plugin Page', () => {
    const mockWebLLMWorker = {
        getLoadedModel: vi.fn(),
        loadModel: vi.fn(),
        chat: vi.fn()
    };

    const mockWhisperWorker = {
        init: vi.fn(),
        transcribe: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(WorkerManager.getWebLLM).mockResolvedValue(mockWebLLMWorker as any);
        vi.mocked(WorkerManager.getWhisper).mockResolvedValue(mockWhisperWorker as any);

        mockWebLLMWorker.getLoadedModel.mockResolvedValue(null);
        mockWhisperWorker.init.mockResolvedValue(undefined);
    });

    it('renders correctly', () => {
        render(StudyNotesPage);
        expect(screen.getByText('Study Notes & Flashcards')).toBeInTheDocument();
        expect(screen.getByText('Load Model')).toBeInTheDocument();
    });

    it('loads the LLM model successfully', async () => {
        mockWebLLMWorker.getLoadedModel
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('Phi-3-mini-4k-instruct-q4f16_1-MLC');

        render(StudyNotesPage);

        await waitFor(() => {
            expect(mockWebLLMWorker.getLoadedModel).toHaveBeenCalledTimes(1);
        });

        const loadButton = screen.getByText('Load Model');
        await fireEvent.click(loadButton);

        expect(mockWebLLMWorker.loadModel).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.queryByText(/loaded/)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('generates flashcards from text', async () => {
        mockWebLLMWorker.getLoadedModel.mockResolvedValue('test-model');

        mockWebLLMWorker.chat.mockImplementation(async (messages, systemPrompt, onToken) => {
            const response = `[{"q": "Test Question", "a": "Test Answer"}]`;
            for (let i = 0; i < response.length; i++) {
                onToken(response[i]);
            }
            return Promise.resolve();
        });

        render(StudyNotesPage);

        // Wait for onMount
        await waitFor(() => {
            expect(screen.queryByText('Load Model')).not.toBeInTheDocument();
        });

        // Set text input
        const textarea = screen.getByPlaceholderText(/Paste your notes/);
        await fireEvent.input(textarea, { target: { value: 'This is a test note.' } });

        // Click generate
        const generateButton = screen.getByText('Generate Flashcards');
        await fireEvent.click(generateButton);

        expect(mockWebLLMWorker.chat).toHaveBeenCalledWith(
            [{ role: 'user', content: 'This is a test note.' }],
            expect.stringContaining('expert educational assistant'),
            expect.any(Function)
        );

        // Verify flashcard was generated and displayed
        await waitFor(() => {
            expect(screen.getByText('Test Question')).toBeInTheDocument();
            expect(screen.getByText('Test Answer')).toBeInTheDocument();
            expect(screen.getByText('Card 1 of 1')).toBeInTheDocument();
        });
    });

    it('can switch to audio tab and upload', async () => {
        mockWebLLMWorker.getLoadedModel.mockResolvedValue('test-model');
        mockWhisperWorker.transcribe.mockResolvedValue({ text: 'This is a transcribed lecture.' });

        render(StudyNotesPage);

        await waitFor(() => {
            expect(screen.queryByText('Load Model')).not.toBeInTheDocument();
        });

        // Switch tab
        const audioTab = screen.getByText('Upload Audio');
        await fireEvent.click(audioTab);

        expect(screen.getByText('Lecture Audio')).toBeInTheDocument();

        // Mock file upload
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['dummy audio'], 'lecture.mp3', { type: 'audio/mp3' });

        // Setup arrayBuffer for the mock file
        file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

        await fireEvent.change(fileInput, { target: { files: [file] } });

        expect(mockWhisperWorker.init).toHaveBeenCalledWith('tiny', expect.any(Function));

        await waitFor(() => {
            expect(mockWhisperWorker.transcribe).toHaveBeenCalled();
            const textarea = screen.getByLabelText('Transcribed Text') as HTMLTextAreaElement;
            expect(textarea.value).toBe('This is a transcribed lecture.');
        });
    });
});