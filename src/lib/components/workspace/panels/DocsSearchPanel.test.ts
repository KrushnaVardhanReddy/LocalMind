import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import DocsSearchPanel from './DocsSearchPanel.svelte';

describe('DocsSearchPanel.svelte', () => {
    it('renders the search panel correctly', () => {
        render(DocsSearchPanel, {
            embeddingsWorker: null,
            sqliteWorker: null,
            isIndexing: false
        });

        expect(screen.getByText('Semantic Search')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search docs...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Search button' })).toBeInTheDocument();
    });

    it('disables input and button when indexing', () => {
        render(DocsSearchPanel, {
            embeddingsWorker: null,
            sqliteWorker: null,
            isIndexing: true
        });

        const input = screen.getByPlaceholderText('Search docs...');
        const button = screen.getByRole('button', { name: 'Search button' });

        expect(input).toBeDisabled();
        expect(button).toBeDisabled();
    });

    it('performs search and displays results', async () => {
        const mockEmbeddingsWorker = {
            embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            computeSimilarity: vi.fn().mockResolvedValue([0.95, 0.85]),
        };

        const mockSqliteWorker = {
            getAllDocumentChunks: vi.fn().mockResolvedValue([
                { file_name: 'doc1.pdf', chunk_text: 'This is the first document chunk.', embedding: new ArrayBuffer(12) },
                { file_name: 'doc2.pdf', chunk_text: 'Another interesting document piece.', embedding: new ArrayBuffer(12) }
            ])
        };

        render(DocsSearchPanel, {
            embeddingsWorker: mockEmbeddingsWorker as any,
            sqliteWorker: mockSqliteWorker as any,
            isIndexing: false
        });

        const input = screen.getByPlaceholderText('Search docs...');
        const button = screen.getByRole('button', { name: 'Search button' });

        await fireEvent.input(input, { target: { value: 'test query' } });
        expect(button).not.toBeDisabled();

        await fireEvent.click(button);

        expect(mockEmbeddingsWorker.embed).toHaveBeenCalledWith('test query');
        expect(mockSqliteWorker.getAllDocumentChunks).toHaveBeenCalledWith('default-workspace');
        expect(mockEmbeddingsWorker.computeSimilarity).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
            expect(screen.getByText('This is the first document chunk.')).toBeInTheDocument();
            expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
            expect(screen.getByText('Another interesting document piece.')).toBeInTheDocument();
        });

        // Check clear button appears
        const clearButton = screen.getByRole('button', { name: 'Clear results' });
        expect(clearButton).toBeInTheDocument();

        // Clear results
        await fireEvent.click(clearButton);
        await waitFor(() => {
            expect(screen.queryByText('doc1.pdf')).not.toBeInTheDocument();
        });
    });
});
