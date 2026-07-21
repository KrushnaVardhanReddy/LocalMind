import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import StatusBar from '../StatusBar.svelte';

describe('StatusBar.svelte', () => {
    let originalNavigatorOnLine: boolean;

    beforeEach(() => {
        // Save the original value
        originalNavigatorOnLine = navigator.onLine;

        // Setup JSDOM to mimic being online initially
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            get: () => true
        });
    });

    afterEach(() => {
        cleanup();
        // Restore original navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            get: () => originalNavigatorOnLine
        });
    });

    it('should not render anything when online', () => {
        render(StatusBar);
        expect(screen.queryByText('⚡ Offline Mode')).toBeNull();
    });

    it('should render offline indicator when navigator.onLine is false on mount', () => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            get: () => false
        });

        render(StatusBar);
        expect(screen.getByText('⚡ Offline Mode')).toBeDefined();
    });

    it('should show and hide the offline indicator when offline/online events are dispatched', async () => {
        render(StatusBar);
        expect(screen.queryByText('⚡ Offline Mode')).toBeNull();

        // Dispatch offline event
        window.dispatchEvent(new Event('offline'));

        // Wait for Svelte to process reactivity
        await Promise.resolve();

        expect(screen.getByText('⚡ Offline Mode')).toBeDefined();

        // Dispatch online event
        window.dispatchEvent(new Event('online'));

        // Wait for Svelte to process reactivity
        await Promise.resolve();

        expect(screen.queryByText('⚡ Offline Mode')).toBeNull();
    });
});
