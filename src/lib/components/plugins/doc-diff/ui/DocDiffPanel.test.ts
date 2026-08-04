import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import DocDiffPanel from './DocDiffPanel.svelte';
import '@testing-library/jest-dom/vitest';
import diff_match_patch from 'diff-match-patch';

vi.mock('$lib/workers/WorkerManager', () => {
    return {
        WorkerManager: {
            getMuPDF: vi.fn().mockResolvedValue({
                loadPDF: vi.fn().mockResolvedValue(undefined),
                extractText: vi.fn().mockImplementation(async function() {
                    // This mock function can be modified in specific tests
                    return 'mocked text';
                })
            })
        }
    };
});

describe('DocDiffPanel Component', () => {
    let showOpenFilePickerMock: any;

    beforeEach(() => {
        showOpenFilePickerMock = vi.fn();
        (window as any).showOpenFilePicker = showOpenFilePickerMock;
        vi.clearAllMocks();
    });

    it('renders the initial state correctly', () => {
        render(DocDiffPanel);

        expect(screen.getByText('Document Comparison (Redline Diffing)')).toBeInTheDocument();
        expect(screen.getByText('Select Original PDF')).toBeInTheDocument();
        expect(screen.getByText('Select Modified PDF')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Compare Documents' })).toBeDisabled();
    });

    it('allows selecting original and modified files', async () => {
        showOpenFilePickerMock.mockResolvedValueOnce([{
            name: 'original.pdf',
            getFile: async () => new File([''], 'original.pdf')
        }]);
        showOpenFilePickerMock.mockResolvedValueOnce([{
            name: 'modified.pdf',
            getFile: async () => new File([''], 'modified.pdf')
        }]);

        render(DocDiffPanel);

        const selectOriginalBtn = screen.getByText('Select Original PDF');
        await fireEvent.click(selectOriginalBtn);

        await waitFor(() => {
            expect(screen.getByText('original.pdf')).toBeInTheDocument();
        });

        const selectModifiedBtn = screen.getByText('Select Modified PDF');
        await fireEvent.click(selectModifiedBtn);

        await waitFor(() => {
            expect(screen.getByText('modified.pdf')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Compare Documents' })).not.toBeDisabled();
        });
    });

    it('displays error if file selection fails', async () => {
        showOpenFilePickerMock.mockRejectedValue(new Error('Permission denied'));

        render(DocDiffPanel);

        const selectOriginalBtn = screen.getByText('Select Original PDF');
        await fireEvent.click(selectOriginalBtn);

        await waitFor(() => {
            expect(screen.getByText('Permission denied')).toBeInTheDocument();
        });
    });

    it('executes comparison and renders diffs', async () => {
        // Mock getMuPDF directly to return specific text for each file
        const getMuPDFMock = vi.fn().mockResolvedValueOnce({
            loadPDF: vi.fn().mockResolvedValue(undefined),
            extractText: vi.fn().mockResolvedValue('Hello World. This is the original text.')
        }).mockResolvedValueOnce({
            loadPDF: vi.fn().mockResolvedValue(undefined),
            extractText: vi.fn().mockResolvedValue('Hello Universe! This is the modified text.')
        });

        const WorkerManagerMock = await import('$lib/workers/WorkerManager');
        WorkerManagerMock.WorkerManager.getMuPDF = getMuPDFMock;

        showOpenFilePickerMock.mockResolvedValueOnce([{
            name: 'original.pdf',
            getFile: async () => new File([''], 'original.pdf', { type: 'application/pdf' }),
            arrayBuffer: async () => new ArrayBuffer(0)
        }]);
        showOpenFilePickerMock.mockResolvedValueOnce([{
            name: 'modified.pdf',
            getFile: async () => new File([''], 'modified.pdf', { type: 'application/pdf' }),
            arrayBuffer: async () => new ArrayBuffer(0)
        }]);

        render(DocDiffPanel);

        await fireEvent.click(screen.getByText('Select Original PDF'));
        await waitFor(() => expect(screen.getByText('original.pdf')).toBeInTheDocument());

        await fireEvent.click(screen.getByText('Select Modified PDF'));
        await waitFor(() => expect(screen.getByText('modified.pdf')).toBeInTheDocument());

        const compareBtn = screen.getByRole('button', { name: 'Compare Documents' });
        await fireEvent.click(compareBtn);

        await waitFor(() => {
            expect(screen.getByText('Comparison Result')).toBeInTheDocument();

            // Check that the <del> and <ins> tags are rendered
            const delElement = document.querySelector('del');
            const insElement = document.querySelector('ins');

            expect(delElement).toBeInTheDocument();
            expect(insElement).toBeInTheDocument();
        });
    });
});
