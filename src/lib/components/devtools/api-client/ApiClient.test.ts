import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import ApiClient from './ApiClient.svelte';
import { WorkerManager } from '$lib/workers/WorkerManager';
import '@testing-library/jest-dom/vitest';

vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getSQLite: vi.fn().mockResolvedValue({
            listApiRequests: vi.fn().mockResolvedValue([]),
            saveApiRequest: vi.fn().mockResolvedValue({})
        })
    }
}));

describe('ApiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'content-type': 'application/json' }),
            text: vi.fn().mockResolvedValue(JSON.stringify({ data: 'test' }))
        });
    });

    it('renders the api client interface', () => {
        render(ApiClient);
        expect(screen.getByText('API Client')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('can add and remove parameters', async () => {
        render(ApiClient);

        const paramsTab = screen.getByText('Params');
        await fireEvent.click(paramsTab);

        // Initial state has one empty param
        let keys = screen.getAllByPlaceholderText('Key');
        expect(keys.length).toBe(1);

        // Typing in the last key adds a new one
        await fireEvent.input(keys[0], { target: { value: 'testKey' } });
        keys = screen.getAllByPlaceholderText('Key');
        expect(keys.length).toBe(2);

        // Removing the first param
        const removeButtons = screen.getAllByLabelText('Remove parameter');
        await fireEvent.click(removeButtons[0]);

        keys = screen.getAllByPlaceholderText('Key');
        expect(keys.length).toBe(1);
    });

    it('executes a fetch request when clicking send', async () => {
        render(ApiClient);

        const sendBtn = screen.getByText('Send');
        await fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
            expect(screen.getByText(/Status: 200 OK/)).toBeInTheDocument();
        });
    });
});
