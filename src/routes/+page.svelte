<script lang="ts">
    import { onMount } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { deferredPrompt } from '$lib/stores/pwa.store';
    import {
        workspaces,
        currentWorkspace,
        savedQueries,
        loadWorkspaces,
        createWorkspace,
        setWorkspace,
        saveQuery
    } from '$lib/stores/workspace.store';

    let result: any = $state(null);
    let newWorkspaceName = $state('');
    let queryName = $state('');
    let querySql = $state('');

    onMount(async () => {
        await loadWorkspaces();
    });

    async function runQuery() {
        // Automatically lazy-loads and initializes if it's the first time
        const db = await WorkerManager.getDuckDB();
        result = await db.query("SELECT * FROM table");
        console.log('Query result:', result);
    }

    async function handleCreateWorkspace() {
        if (!newWorkspaceName.trim()) return;
        await createWorkspace(newWorkspaceName);
        newWorkspaceName = '';
    }

    async function handleSaveQuery() {
        if (!queryName.trim() || !querySql.trim()) return;
        await saveQuery(queryName, querySql);
        queryName = '';
        querySql = '';
    }

    async function installApp() {
        if (!$deferredPrompt) return;
        $deferredPrompt.prompt();
        const { outcome } = await $deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            deferredPrompt.set(null);
        }
    }
</script>

<main class="p-8 max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8 bg-white p-4 shadow rounded">
        <div class="flex items-center gap-4">
            <h1 class="text-2xl font-bold">LocalMind</h1>
            {#if $deferredPrompt}
                <button
                    onclick={installApp}
                    class="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded hover:bg-purple-200 transition"
                >
                    Install App
                </button>
            {/if}
        </div>

        <div class="flex items-center gap-4">
            <select
                class="border rounded p-2"
                value={$currentWorkspace?.id || ''}
                onchange={(e) => setWorkspace(e.currentTarget.value)}
            >
                <option value="" disabled>Select Workspace...</option>
                {#each $workspaces as ws}
                    <option value={ws.id}>{ws.name}</option>
                {/each}
            </select>

            <div class="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="New Workspace Name"
                    bind:value={newWorkspaceName}
                    class="border rounded p-2 text-sm"
                />
                <button
                    onclick={handleCreateWorkspace}
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition whitespace-nowrap"
                >
                    New Workspace
                </button>
            </div>
        </div>
    </div>

    {#if $currentWorkspace}
        <div class="mb-8 p-4 bg-gray-50 border rounded">
            <h2 class="text-xl font-semibold mb-4">Workspace: {$currentWorkspace.name}</h2>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h3 class="font-medium mb-2">Save a Query</h3>
                    <input type="text" placeholder="Query Name" bind:value={queryName} class="border p-2 rounded w-full mb-2" />
                    <textarea placeholder="SQL Query" bind:value={querySql} class="border p-2 rounded w-full mb-2" rows="3"></textarea>
                    <button
                        onclick={handleSaveQuery}
                        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Save Query
                    </button>
                </div>

                <div>
                    <h3 class="font-medium mb-2">Saved Queries ({$savedQueries.length})</h3>
                    <ul class="space-y-2 max-h-48 overflow-y-auto">
                        {#each $savedQueries as q}
                            <li class="p-2 bg-white border rounded text-sm">
                                <strong>{q.name}</strong><br/>
                                <span class="text-gray-500 font-mono">{q.sql}</span>
                            </li>
                        {/each}
                        {#if $savedQueries.length === 0}
                            <li class="text-gray-500 text-sm">No saved queries yet.</li>
                        {/if}
                    </ul>
                </div>
            </div>
        </div>
    {:else}
        <div class="mb-8 p-8 bg-gray-50 border rounded text-center text-gray-500">
            Please create or select a workspace to continue.
        </div>
    {/if}

    <div class="p-4 border rounded">
        <h2 class="text-xl font-bold mb-4">DuckDB Test</h2>
        <button
            onclick={runQuery}
            class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
        >
            Run Stub Query
        </button>

        {#if result}
            <div class="mt-4 p-4 bg-gray-100 rounded">
                <h2 class="font-semibold">Result:</h2>
                <pre class="text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
            </div>
        {/if}
    </div>
</main>
