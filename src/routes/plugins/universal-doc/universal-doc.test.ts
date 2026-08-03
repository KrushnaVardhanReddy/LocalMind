import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import UniversalDocPage from './+page.svelte';

// Mock WorkerManager
vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getMuPDF: vi.fn().mockResolvedValue({
            loadPDF: vi.fn(),
            extractText: vi.fn().mockResolvedValue('Mocked PDF text content'),
            renderPage: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        }),
        getWebLLM: vi.fn().mockResolvedValue({
            loadModel: vi.fn().mockResolvedValue(true),
            chat: vi.fn().mockImplementation(async (messages, systemPrompt, onToken) => {
                onToken('Mocked AI response');
                return Promise.resolve();
            })
        })
    }
}));

describe('Universal Document Workspace', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the file uploader initially', () => {
        render(UniversalDocPage);
        expect(screen.getByText('Click to upload or drag and drop')).toBeInTheDocument();
        expect(screen.getByText('Upload a document to start chatting')).toBeInTheDocument();
    });

    it('should handle file input change and update UI', async () => {
        render(UniversalDocPage);

        // Wait for workers to initialize
        await new Promise(r => setTimeout(r, 0));

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['mock content'], 'test.txt', { type: 'text/plain' });

        await fireEvent.change(fileInput, { target: { files: [file] } });

        // Let state update
        await new Promise(r => setTimeout(r, 100));

        // The DocumentViewer should show the text
        expect(screen.getByText('Text View')).toBeInTheDocument();
        expect(screen.getByText('mock content')).toBeInTheDocument();
    });

    it('should handle chat messages', async () => {
        render(UniversalDocPage);

        // Initialize file to activate chat interface
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['mock content'], 'test.txt', { type: 'text/plain' });
        await fireEvent.change(fileInput, { target: { files: [file] } });

        await new Promise(r => setTimeout(r, 100));

        // Send a message
        const chatInput = screen.getByPlaceholderText('Ask about the document...');
        await fireEvent.input(chatInput, { target: { value: 'Hello' } });

        const form = chatInput.closest('form');
        await fireEvent.submit(form!);

        // Wait for mock chat to resolve
        await new Promise(r => setTimeout(r, 100));

        // Assert user message and AI response appear
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Mocked AI response')).toBeInTheDocument();
    });
});
