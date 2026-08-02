<script lang="ts">
    import { page } from '$app/stores';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';
    import { goto } from '$app/navigation';

    let currentPath = $derived($page.url.pathname);

    let isMenuOpen = $state(false);

    const workspaces = [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Analytics', path: '/analytics', id: 'analytics', icon: '📊' },
        { name: 'Docs', path: '/docs', icon: '📄' },
        { name: 'DevTools', path: '/devtools', id: 'devtools', icon: '🛠️' },
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
                    onclick={(e) => {
                        if (ws.id === 'analytics' || ws.id === 'devtools') {
                            e.preventDefault();
                            workspaceStore.setActiveWorkspace({ id: ws.id, type: ws.id, title: ws.name });
                            goto('/');
                        } else if (ws.path === '/') {
                            e.preventDefault();
                            workspaceStore.activeWorkspace = null;
                            goto('/');
                        }
                    }}
                    class="px-3 py-1.5 rounded transition font-medium flex items-center gap-2
                    {(currentPath === ws.path && !workspaceStore.activeWorkspace) || (workspaceStore.activeWorkspace?.type === ws.id) || (ws.path !== '/' && currentPath.startsWith(ws.path) && ws.path !== '/analytics' && ws.path !== '/devtools')
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

    </div>
</nav>

<!-- Mobile Bottom Navigation Bar (replaces hamburger menu) -->
<div class="md:hidden fixed bottom-0 left-0 right-0 bg-indigo-900 border-t border-indigo-800 flex justify-around items-center z-50 pb-safe">
    {#each workspaces.filter(w => ['Home', 'Analytics', 'Docs', 'DevTools'].includes(w.name)) as ws}
        <a
            href={ws.path}
            class="flex flex-col items-center justify-center py-2 w-full transition
            {(currentPath === ws.path && !workspaceStore.activeWorkspace) || (workspaceStore.activeWorkspace?.type === ws.id) || (ws.path !== '/' && currentPath.startsWith(ws.path) && ws.path !== '/analytics' && ws.path !== '/devtools')
                ? 'text-white'
                : 'text-indigo-400 hover:text-indigo-200'}"
            onclick={(e) => {
                if (ws.id === 'analytics' || ws.id === 'devtools') {
                    e.preventDefault();
                    workspaceStore.setActiveWorkspace({ id: ws.id, type: ws.id, title: ws.name });
                    goto('/');
                } else if (ws.path === '/') {
                    e.preventDefault();
                    workspaceStore.activeWorkspace = null;
                    goto('/');
                }
            }}
        >
            <span class="text-xl mb-1">{ws.icon}</span>
            <span class="text-[10px] font-medium">{ws.name}</span>
        </a>
    {/each}
</div>
