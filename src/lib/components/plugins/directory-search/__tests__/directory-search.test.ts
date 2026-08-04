import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import DirectoryScanner from '../ui/DirectoryScanner.svelte';
import SearchResults from '../ui/SearchResults.svelte';

vi.mock('$lib/workers/WorkerManager', () => {
    return {
        WorkerManager: {
            getMuPDF: vi.fn().mockResolvedValue({
                extractText: vi.fn().mockResolvedValue('pdf text content')
            }),
            getDuckDB: vi.fn().mockResolvedValue({
                init: vi.fn().mockResolvedValue(undefined),
                query: vi.fn().mockResolvedValue({
                    rows: [
                        { path: 'test.txt', content: 'test text chunk', score: 0.95 }
                    ]
                })
            }),
            getEmbeddings: vi.fn().mockResolvedValue({
                isAIEnabled: vi.fn().mockResolvedValue(true),
                init: vi.fn().mockResolvedValue(undefined),
                embedBatch: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
                embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3])
            })
        }
    };
});

describe('Directory Search Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global window object for showDirectoryPicker
        (global as any).window.showDirectoryPicker = vi.fn().mockResolvedValue({
            values: () => {
                return {
                    [Symbol.asyncIterator]() {
                        let i = 0;
                        const items = [
                            { kind: 'file', name: 'test.txt', getFile: vi.fn().mockResolvedValue({ name: 'test.txt', text: () => Promise.resolve('test text content') }) }
                        ];
                        return {
                            async next() {
                                if (i < items.length) {
                                    return { done: false, value: items[i++] };
                                }
                                return { done: true, value: undefined };
                            }
                        };
                    }
                };
            }
        });
    });

    it('should render DirectoryScanner and interact with showDirectoryPicker', async () => {
        render(DirectoryScanner);

        const btn = screen.getByRole('button', { name: /select directory to scan/i });
        expect(btn).toBeTruthy();

        await fireEvent.click(btn);

        expect((global as any).window.showDirectoryPicker).toHaveBeenCalled();

        // Wait for scanning states
        await waitFor(() => {
            expect(screen.getByText('Indexing complete!')).toBeTruthy();
        });
    });

    it('should render SearchResults and perform search', async () => {
        render(SearchResults);

        const input = screen.getByPlaceholderText(/Search for concepts/i);
        expect(input).toBeTruthy();

        await fireEvent.input(input, { target: { value: 'test query' } });
        await fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeTruthy();
            expect(screen.getByText('95.0% Match')).toBeTruthy();
            expect(screen.getByText('test text chunk')).toBeTruthy();
        });
    });
});
