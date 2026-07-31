import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FileExplorer from './FileExplorer.svelte';
import { workspaceStore } from '$lib/stores/workspace.store.svelte';

// Mock the Lucide icons
vi.mock('lucide-svelte', () => ({
    Folder: vi.fn(),
    File: vi.fn(),
    ChevronRight: vi.fn(),
    ChevronDown: vi.fn()
}));

// Mock the workspace store
vi.mock('$lib/stores/workspace.store.svelte', () => ({
    workspaceStore: {
        activeWorkspace: {
            id: 'test-ws',
            title: 'Test Workspace',
            type: 'custom',
            activeFileId: null
        }
    }
}));

describe('FileExplorer Component', () => {
    let mockRootHandle: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Create a fake file system structure
        const fakeFileSystem = [
            ['test.txt', { kind: 'file', name: 'test.txt' }],
            ['docs', {
                kind: 'directory',
                name: 'docs',
                entries: () => (async function* () {
                    yield ['readme.md', { kind: 'file', name: 'readme.md' }];
                })()
            }]
        ];

        mockRootHandle = {
            kind: 'directory',
            entries: () => (async function* () {
                for (const item of fakeFileSystem) {
                    yield item;
                }
            })(),
            getDirectoryHandle: vi.fn().mockResolvedValue({
                kind: 'directory',
                entries: () => (async function* () {
                    yield ['readme.md', { kind: 'file', name: 'readme.md' }];
                })()
            })
        };

        // Mock navigator.storage
        Object.defineProperty(global.navigator, 'storage', {
            value: {
                getDirectory: vi.fn().mockResolvedValue(mockRootHandle)
            },
            writable: true,
            configurable: true
        });

        workspaceStore.activeWorkspace = {
            id: 'test-ws',
            title: 'Test Workspace',
            type: 'custom',
            activeFileId: undefined
        };
    });

    it('renders the initial file tree from OPFS', async () => {
        render(FileExplorer);

        // Wait for async initOpfs to complete
        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeTruthy();
            expect(screen.getByText('docs')).toBeTruthy();
        });

        // Sorting check (docs before test.txt)
        const buttons = screen.getAllByRole('button');
        expect(buttons[0].textContent).toContain('docs');
        expect(buttons[1].textContent).toContain('test.txt');
    });

    it('expands a directory and lazy loads children on click', async () => {
        render(FileExplorer);

        await waitFor(() => {
            expect(screen.getByText('docs')).toBeTruthy();
        });

        const docsDir = screen.getByText('docs');
        await fireEvent.click(docsDir);

        await waitFor(() => {
            expect(screen.getByText('readme.md')).toBeTruthy();
        });

        // Verify path resolution was called
        expect(mockRootHandle.getDirectoryHandle).toHaveBeenCalledWith('docs');
    });

    it('updates activeFileId in workspace store when a file is clicked', async () => {
        render(FileExplorer);

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeTruthy();
        });

        const testFile = screen.getByText('test.txt');
        await fireEvent.click(testFile);

        expect(workspaceStore.activeWorkspace?.activeFileId).toBe('test.txt');
    });
});
