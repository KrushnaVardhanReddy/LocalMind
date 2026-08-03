import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import DiagramsPage from '../+page.svelte';
import '@testing-library/jest-dom/vitest';
import { WorkerManager } from '$lib/workers/WorkerManager';
import { tick } from 'svelte';

// Mock the WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getWebLLM: vi.fn()
    }
}));

// Mock mermaid so the child component doesn't crash
vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' })
    }
}));

// Mock Comlink's proxy to just return the function
vi.mock('comlink', () => ({
    proxy: vi.fn((fn) => fn),
    wrap: vi.fn(),
    expose: vi.fn()
}));

describe('Diagrams Plugin Page', () => {
    const mockWebLLMWorker = {
        getLoadedModel: vi.fn(),
        loadModel: vi.fn(),
        chat: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(WorkerManager.getWebLLM).mockResolvedValue(mockWebLLMWorker as any);
        mockWebLLMWorker.getLoadedModel.mockResolvedValue(null);
    });

    it('renders correctly', () => {
        render(DiagramsPage);
        expect(screen.getByText('AI Diagrams')).toBeInTheDocument();
        expect(screen.getByText('Generate Diagram')).toBeInTheDocument();
    });

    it('loads a model successfully', async () => {
        mockWebLLMWorker.getLoadedModel
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('Llama-3.2-1B-Instruct-q4f16_1-MLC');

        render(DiagramsPage);

        // Wait for onMount to finish
        await waitFor(() => {
            expect(mockWebLLMWorker.getLoadedModel).toHaveBeenCalledTimes(1);
        });

        const loadButton = screen.getByText('Load Model');
        await fireEvent.click(loadButton);

        expect(mockWebLLMWorker.loadModel).toHaveBeenCalled();

        // Let it update after the load is fully mocked (which uses awaited values)
        await tick();
        await tick();

        // Manually trigger the Svelte re-render by asserting something that gets updated
        await waitFor(() => {
            // Using queryByText instead of getByText to prevent error throws blocking the wait loop
            expect(screen.queryByText(/loaded/)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('calls generate on click and streams response', async () => {
        mockWebLLMWorker.getLoadedModel.mockResolvedValue('test-model');

        // Setup mock to simulate streaming a response
        mockWebLLMWorker.chat.mockImplementation(async (messages, systemPrompt, onToken) => {
            onToken('graph TD;\n');
            onToken('A-->B;');
            return Promise.resolve();
        });

        render(DiagramsPage);

        // Wait for onMount to finish
        await waitFor(() => {
            expect(screen.queryByText('Load Model')).not.toBeInTheDocument();
        });

        // Set prompt
        const textarea = screen.getByPlaceholderText(/Create an architecture diagram/);
        await fireEvent.input(textarea, { target: { value: 'Make a simple graph' } });

        // Click generate
        const generateButton = screen.getByText('Generate Diagram');
        await fireEvent.click(generateButton);

        // Verify webllm worker was called properly
        expect(mockWebLLMWorker.chat).toHaveBeenCalledWith(
            [{ role: 'user', content: 'Make a simple graph' }],
            expect.stringContaining('expert at creating mermaid.js diagrams'),
            expect.any(Function)
        );

        // Verify the code text area updated with the streamed tokens
        const codeTextarea = screen.getByLabelText('Mermaid Code') as HTMLTextAreaElement;
        await waitFor(() => {
            expect(codeTextarea.value).toBe('graph TD;\nA-->B;');
        });
    });
});
