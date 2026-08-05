import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import RegexTester from './RegexTester.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';
import '@testing-library/jest-dom/vitest';

vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getRegex: vi.fn()
    }
}));

describe('RegexTester', () => {
    let mockWorker: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockWorker = {
            evaluate: vi.fn().mockResolvedValue({
                matches: [],
                executionTimeMs: 1
            })
        };

        (WorkerManager.getRegex as any).mockResolvedValue(mockWorker);
    });

    it('renders the regex tester shell', async () => {
        const { getByText, getByPlaceholderText } = render(RegexTester);

        expect(getByText('Regular Expression')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter regex pattern')).toBeInTheDocument();
        expect(getByPlaceholderText('Enter test string here...')).toBeInTheDocument();
    });

    it('initializes Regex worker on mount', async () => {
        render(RegexTester);

        await waitFor(() => {
            expect(WorkerManager.getRegex).toHaveBeenCalled();
        });
    });

    it('displays error if worker fails to initialize', async () => {
        (WorkerManager.getRegex as any).mockRejectedValue(new Error('Init failed'));
        const { getByText } = render(RegexTester);

        await waitFor(() => {
            expect(getByText('Failed to initialize Regex worker: Init failed')).toBeInTheDocument();
        });
    });

    it('evaluates regex when inputs change', async () => {
        const { getByPlaceholderText } = render(RegexTester);

        const patternInput = getByPlaceholderText('Enter regex pattern');
        const testStringInput = getByPlaceholderText('Enter test string here...');

        await fireEvent.input(patternInput, { target: { value: 'test' } });
        await fireEvent.input(testStringInput, { target: { value: 'this is a test' } });

        await waitFor(() => {
            expect(mockWorker.evaluate).toHaveBeenCalledWith('test', 'g', 'this is a test');
        });
    });

    it('shows matches correctly', async () => {
        mockWorker.evaluate.mockResolvedValue({
            matches: [
                {
                    match: 'test',
                    start: 10,
                    end: 14,
                    groups: {},
                    groupIndices: {}
                }
            ],
            executionTimeMs: 2
        });

        const { getByPlaceholderText, getByText } = render(RegexTester);

        const patternInput = getByPlaceholderText('Enter regex pattern');
        const testStringInput = getByPlaceholderText('Enter test string here...');

        await fireEvent.input(patternInput, { target: { value: 'test' } });
        await fireEvent.input(testStringInput, { target: { value: 'this is a test' } });

        await waitFor(() => {
            expect(getByText('1 match')).toBeInTheDocument();
        });
    });

    it('shows group captures correctly', async () => {
        mockWorker.evaluate.mockResolvedValue({
            matches: [
                {
                    match: 'test',
                    start: 10,
                    end: 14,
                    groups: { name: 'test' },
                    groupIndices: { 1: 'test' }
                }
            ],
            executionTimeMs: 2
        });

        const { getByPlaceholderText, getByText, findAllByText } = render(RegexTester);

        const patternInput = getByPlaceholderText('Enter regex pattern');
        const testStringInput = getByPlaceholderText('Enter test string here...');

        await fireEvent.input(patternInput, { target: { value: '(test)' } });
        await fireEvent.input(testStringInput, { target: { value: 'this is a test' } });

        await waitFor(async () => {
            expect(getByText('1 match')).toBeInTheDocument();
            const groupText = await findAllByText('Group 1:');
            expect(groupText.length).toBeGreaterThan(0);
        });
    });
});
