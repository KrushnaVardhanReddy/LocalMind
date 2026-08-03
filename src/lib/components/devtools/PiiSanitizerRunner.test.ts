import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import PiiSanitizerRunner from './PiiSanitizerRunner.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';
import '@testing-library/jest-dom/vitest';

// Mock Web Animations API to prevent "element.animate is not a function"
if (!HTMLElement.prototype.animate) {
    HTMLElement.prototype.animate = vi.fn().mockReturnValue({
        finished: Promise.resolve(),
        cancel: vi.fn(),
        play: vi.fn(),
    });
}

// Polyfill file.stream for jsdom
if (!File.prototype.stream) {
    File.prototype.stream = function() {
        let position = 0;
        const file = this as any; // Allow indexing

        return {
            getReader() {
                return {
                    read: async () => {
                        if (position >= file.size) {
                            return { done: true, value: undefined };
                        }

                        // Fake chunking
                        const end = Math.min(position + 1024, file.size);
                        const slice = file.slice(position, end);
                        position = end;

                        const text = await slice.text();
                        const encoder = new TextEncoder();
                        const uint8Array = encoder.encode(text);

                        return { done: false, value: uint8Array };
                    }
                }
            }
        } as any;
    };
}

vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getNER: vi.fn()
    }
}));

// We must use a small trick: Svelte 5 $state changes inside onMount might take a tick,
// so we also just wait for the button to not be disabled (or the text to disappear).
describe('PiiSanitizerRunner', () => {
    let mockWorker: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockWorker = {
            init: vi.fn().mockResolvedValue(undefined),
            detectPII: vi.fn().mockResolvedValue([])
        };

        // Return mockWorker synchronously for test stability when possible,
        // but getNER is async, so we mock resolved value.
        (WorkerManager.getNER as any).mockResolvedValue(mockWorker);
    });

    it('renders the upload section', async () => {
        const { getByText, getByLabelText } = render(PiiSanitizerRunner);

        expect(getByText('Upload CSV or JSON File')).toBeInTheDocument();
        expect(getByLabelText('Upload CSV or JSON File')).toBeInTheDocument();
    });

    it('initializes NER worker on mount', async () => {
        render(PiiSanitizerRunner);

        await waitFor(() => {
            expect(WorkerManager.getNER).toHaveBeenCalled();
            expect(mockWorker.init).toHaveBeenCalled();
        });
    });

    it('processes a JSON file and downloads it', async () => {
        const { getByLabelText, getByText, queryByText } = render(PiiSanitizerRunner);

        // Mock NER to detect John Doe as PERSON
        mockWorker.detectPII.mockImplementation(async (text: string) => {
            if (text === 'John Doe') {
                return [{
                    type: 'PERSON',
                    text: 'John Doe',
                    startChar: 0,
                    endChar: 8,
                    confidence: 0.99
                }];
            }
            return [];
        });

        const input = getByLabelText('Upload CSV or JSON File');

        const jsonContent = JSON.stringify([{ name: 'John Doe', age: 30 }]);
        const file = new File([jsonContent], 'test.json', { type: 'application/json' });

        await fireEvent.change(input, { target: { files: [file] } });

        // Wait for the worker to be assigned to the component state
        await waitFor(() => {
            const button = queryByText('Sanitize Data') as HTMLButtonElement;
            expect(button).not.toBeNull();
            expect(button.disabled).toBe(false);
        });

        const button = getByText('Sanitize Data');
        await fireEvent.click(button);

        await waitFor(() => {
            expect(getByText('Processing Complete')).toBeInTheDocument();
            expect(getByText('Download Sanitized File')).toBeInTheDocument();
        });

        expect(mockWorker.detectPII).toHaveBeenCalledWith('John Doe');
    });

    it('shows error message if NER worker fails to initialize', async () => {
        (WorkerManager.getNER as any).mockRejectedValue(new Error('NER Init Failed'));

        const { getByText } = render(PiiSanitizerRunner);

        await waitFor(() => {
            expect(getByText('Failed to initialize NER worker: NER Init Failed')).toBeInTheDocument();
        });
    });
});
