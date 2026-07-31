<script lang="ts">
    import { onMount } from 'svelte';
    import { Folder, File as FileIcon, ChevronRight, ChevronDown } from 'lucide-svelte';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';

    type FileNode = {
        name: string;
        path: string;
        kind: 'file' | 'directory';
        children?: FileNode[];
    };

    let files = $state<FileNode[]>([]);
    let expandedDirs = $state<Record<string, boolean>>({});

    async function loadDirectory(dirHandle: FileSystemDirectoryHandle, path: string = ''): Promise<FileNode[]> {
        const nodes: FileNode[] = [];
        // @ts-ignore (TypeScript might not have full types for async iterators on FileSystemDirectoryHandle)
        for await (const [name, handle] of dirHandle.entries()) {
            const currentPath = path ? `${path}/${name}` : name;
            const node: FileNode = {
                name,
                path: currentPath,
                kind: handle.kind
            };

            if (handle.kind === 'directory') {
                // To keep it simple initially we might not recurse infinitely, or we can just load the first level
                // but for a recursive component, we can load everything, or load lazily.
                // Let's load deeply for this small example or at least setup the structure.
                // It's usually better to load lazily, but let's just do a full read for simplicity if it's small,
                // or lazy load on expand. We'll lazy load on expand.
                node.children = [];
            }

            nodes.push(node);
        }

        // Sort folders first, then files
        nodes.sort((a, b) => {
            if (a.kind === b.kind) return a.name.localeCompare(b.name);
            return a.kind === 'directory' ? -1 : 1;
        });

        return nodes;
    }

    async function initOpfs() {
        try {
            const root = await navigator.storage.getDirectory();
            files = await loadDirectory(root);
        } catch (error) {
            console.error('Failed to load OPFS directory', error);
        }
    }

    onMount(() => {
        initOpfs();
    });

    async function toggleDir(node: FileNode) {
        if (node.kind !== 'directory') return;

        const isExpanded = !!expandedDirs[node.path];

        if (!isExpanded && (!node.children || node.children.length === 0)) {
            // Lazy load children
            try {
                // We need to resolve the path
                const parts = node.path.split('/');
                let currentHandle = await navigator.storage.getDirectory();
                for (const part of parts) {
                    currentHandle = await currentHandle.getDirectoryHandle(part);
                }
                node.children = await loadDirectory(currentHandle, node.path);
            } catch (error) {
                console.error(`Failed to load directory ${node.path}`, error);
            }
        }

        expandedDirs[node.path] = !isExpanded;
        // Trigger reactivity for nested nodes if needed, though $state is deeply reactive in Svelte 5.
    }

    function selectFile(node: FileNode) {
        if (node.kind !== 'file') return;

        if (workspaceStore.activeWorkspace) {
            // Need to update the store's property
            workspaceStore.activeWorkspace = {
                ...workspaceStore.activeWorkspace,
                activeFileId: node.path
            };
        }
    }

    let activeFileId = $derived(workspaceStore.activeWorkspace?.activeFileId);
</script>

<div class="text-sm font-medium text-gray-700 dark:text-gray-300">
    {#snippet renderTree(nodes: FileNode[], level: number)}
        {#each nodes as node}
            <div class="flex flex-col">
                <button
                    class="flex items-center gap-1.5 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition-colors w-full cursor-pointer
                    {activeFileId === node.path ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : ''}"
                    style="padding-left: {level * 12 + 8}px"
                    onclick={() => node.kind === 'directory' ? toggleDir(node) : selectFile(node)}
                >
                    {#if node.kind === 'directory'}
                        <span class="w-4 h-4 flex-none flex items-center justify-center text-gray-500">
                            {#if expandedDirs[node.path]}
                                <ChevronDown size={14} />
                            {:else}
                                <ChevronRight size={14} />
                            {/if}
                        </span>
                        <Folder size={14} class="text-blue-500 flex-none" />
                    {:else}
                        <span class="w-4 h-4 flex-none"></span>
                        <FileIcon size={14} class="text-gray-400 flex-none" />
                    {/if}
                    <span class="truncate" title={node.name}>{node.name}</span>
                </button>

                {#if node.kind === 'directory' && expandedDirs[node.path] && node.children}
                    {@render renderTree(node.children, level + 1)}
                {/if}
            </div>
        {/each}
    {/snippet}

    {#if files.length === 0}
        <div class="px-4 py-2 text-gray-500 italic text-xs">
            No files found in workspace.
        </div>
    {:else}
        <div class="py-2">
            {@render renderTree(files, 0)}
        </div>
    {/if}
</div>
