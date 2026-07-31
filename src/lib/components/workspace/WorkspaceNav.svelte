<script lang="ts">
    import { page } from '$app/stores';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';

    let currentPath = $derived($page.url.pathname);

    let isMenuOpen = $state(false);

    const workspaces = [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Analytics', path: '/analytics', icon: '📊' },
        { name: 'Docs', path: '/docs', icon: '📄' },
        { name: 'DevTools', path: '/devtools', icon: '🛠️' },
        { name: 'Media', path: '/media', icon: '🎬' },
        { name: 'Intelligence', path: '/intelligence/chat', icon: '🧠' },
        { name: 'Dashboard', path: '/dashboard', icon: '📈' }
    ];
</script>

<nav class="bg-indigo-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-40">
    <div class="flex items-center gap-4">
        <a href="/" class="font-bold text-xl flex items-center gap-2 hover:text-indigo-200 transition">
            <span>🧠 LocalMind</span>
        </a>
        <div class="hidden md:flex gap-2 ml-4">
            {#each workspaces as ws}
                <a
                    href={ws.path}
                    class="px-3 py-1.5 rounded transition font-medium flex items-center gap-2
                    {currentPath === ws.path || (ws.path !== '/' && currentPath.startsWith(ws.path))
                        ? 'bg-indigo-800 text-white shadow-inner'
                        : 'text-indigo-200 hover:text-white hover:bg-indigo-800'}"
                >
                    <span>{ws.icon}</span> {ws.name}
                </a>
            {/each}
        </div>
    </div>

    <div class="flex items-center gap-4">
        {#if workspaceStore.activeWorkspace}
            <div class="hidden lg:flex items-center gap-2 text-sm text-indigo-200">
                <span class="font-medium text-white">{workspaceStore.activeWorkspace.title}</span>
                {#if workspaceStore.activeWorkspace.activeFileId}
                    <span class="text-indigo-400">/</span>
                    <span class="truncate max-w-[200px]" title={workspaceStore.activeWorkspace.activeFileId}>
                        {workspaceStore.activeWorkspace.activeFileId.split('/').pop()}
                    </span>
                {/if}
            </div>
        {/if}

        <span class="text-sm font-semibold text-emerald-300 bg-indigo-950 px-3 py-1 rounded-full border border-emerald-800 flex items-center gap-1">
            🔒 <span class="hidden sm:inline">Zero data leaves your browser</span>
        </span>

        <!-- Mobile menu button -->
        <button
            class="md:hidden text-white focus:outline-none p-1"
            onclick={() => isMenuOpen = !isMenuOpen}
        >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
            </svg>
        </button>
    </div>
</nav>

<!-- Mobile menu -->
{#if isMenuOpen}
    <div class="md:hidden bg-indigo-800 shadow-xl absolute w-full z-30">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            {#each workspaces as ws}
                <a
                    href={ws.path}
                    class="px-3 py-2 rounded transition font-medium flex items-center gap-2
                    {currentPath === ws.path || (ws.path !== '/' && currentPath.startsWith(ws.path))
                        ? 'bg-indigo-900 text-white'
                        : 'text-indigo-200 hover:text-white hover:bg-indigo-700'}"
                    onclick={() => isMenuOpen = false}
                >
                    <span>{ws.icon}</span> {ws.name}
                </a>
            {/each}
        </div>
    </div>
{/if}
