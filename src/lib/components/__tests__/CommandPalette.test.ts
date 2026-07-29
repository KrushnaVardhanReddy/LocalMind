import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CommandPalette from '../CommandPalette.svelte';

vi.mock('$app/navigation', () => ({
    goto: vi.fn().mockResolvedValue(undefined)
}));

// Mock workspace store
vi.mock('$lib/stores/workspace.store', () => {
    const { writable } = require('svelte/store');
    return {
        registeredFiles: writable([
            { id: '1', file_name: 'test.csv', table_name: 'test', file_size_bytes: 100 }
        ]),
        savedQueries: writable([
            { id: '1', name: 'My Query', sql: 'SELECT * FROM test' }
        ])
    };
});

describe('CommandPalette Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('opens on Ctrl+K and closes on Escape', async () => {
        const { queryByPlaceholderText } = render(CommandPalette);

        // Should not be visible initially
        expect(queryByPlaceholderText('Type a command or search...')).toBeNull();

        // Trigger Ctrl+K
        await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

        const input = queryByPlaceholderText('Type a command or search...');
        expect(input).not.toBeNull();

        // Press Escape
        await fireEvent.keyDown(window, { key: 'Escape' });

        // Use vitest to await the change
        await new Promise(r => setTimeout(r, 100));
        expect(queryByPlaceholderText('Type a command or search...')).toBeNull();
    });

    it('filters commands when typing', async () => {
        const { getByPlaceholderText, queryByText, findByText } = render(CommandPalette);

        await fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

        const input = getByPlaceholderText('Type a command or search...');

        // Both Analytics and Docs should be visible initially
        expect(await findByText(/Go to Analytics/i)).toBeDefined();
        expect(await findByText(/Go to Docs/i)).toBeDefined();

        // Search for 'Analytics'
        await fireEvent.input(input, { target: { value: 'Analytics' } });

        // Due to the strong tag, testing-library might have trouble with findByText.
        // We look for part of it or by role/html. Wait a bit for svelte reactivity
        await new Promise(r => setTimeout(r, 100));

        // The Docs command should definitely be removed from the DOM
        expect(queryByText(/Go to Docs/i)).toBeNull();

        // The Analytics command should still be there, maybe just 'Go to ' + 'Analytics'
        const container = input.closest('div.bg-white')?.parentElement;
        expect(container?.innerHTML).toContain('Analytics');
    });
});
