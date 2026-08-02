import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import AnalyticsWorkspace from './AnalyticsWorkspace.svelte';
import { writable } from 'svelte/store';

vi.mock('$lib/stores/workspace.store.svelte', () => ({
    workspaceStore: {
        activeWorkspace: {
            id: 'test-workspace',
            type: 'analytics',
            name: 'Test Analytics',
            state: {}
        }
    }
}));

vi.mock('$lib/stores/workspace.store', async () => {
    const svelteStore = await import('svelte/store');
    return {
        workspaces: svelteStore.writable([]),
        currentWorkspace: svelteStore.writable({ id: 'test-workspace', name: 'Test Analytics' }),
        savedQueries: svelteStore.writable([]),
        loadWorkspaces: vi.fn(),
        createWorkspace: vi.fn(),
        setWorkspace: vi.fn(),
        saveQuery: vi.fn()
    };
});

vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getDuckDB: vi.fn(),
        getLLM: vi.fn()
    }
}));

vi.mock('$lib/stores/pwa.store', async () => {
    const svelteStore = await import('svelte/store');
    return {
        deferredPrompt: svelteStore.writable(null)
    };
});

vi.mock('$lib/stores/analytics.store', async () => {
    const svelteStore = await import('svelte/store');
    return {
        uploadedTables: svelteStore.writable([])
    };
});

describe('AnalyticsWorkspace', () => {
    let originalPrint: any;

    beforeEach(() => {
        originalPrint = window.print;
        window.print = vi.fn();
    });

    afterEach(() => {
        window.print = originalPrint;
        cleanup();
        vi.clearAllMocks();
    });

    it('renders Export PDF button and triggers window.print on click', async () => {
        render(AnalyticsWorkspace);

        const exportPdfButton = await screen.findByRole('button', { name: /Export PDF/i });
        expect(exportPdfButton).toBeTruthy();

        await fireEvent.click(exportPdfButton);
        expect(window.print).toHaveBeenCalledTimes(1);
    });
});
