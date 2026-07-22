<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import ChartViewer from '$lib/components/ChartViewer.svelte';

    type PinnedChart = {
        id: string;
        title: string;
        sql: string;
        customOption: any; // ECharts option
    };

    let items = $state<PinnedChart[]>([]);
    let results = $state<Record<string, any>>({});
    let loading = $state(true);

    onMount(async () => {
        if (!browser) return;
        loadDashboard();
        await executeQueries();
    });

    function loadDashboard() {
        const saved = localStorage.getItem('localmind_dashboard');
        if (saved) {
            try {
                items = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse dashboard items", e);
                items = [];
            }
        }
    }

    function saveDashboard() {
        localStorage.setItem('localmind_dashboard', JSON.stringify(items));
    }

    async function executeQueries() {
        if (items.length === 0) {
            loading = false;
            return;
        }
        loading = false; // Disable global loading so we can render incrementally
        try {
            const dbWorker = await WorkerManager.getDuckDB();

            const promises = items.map(async (item) => {
                try {
                    const result = await dbWorker.query(item.sql);
                    // Update state incrementally
                    results[item.id] = { id: item.id, result, error: null };
                    return { id: item.id, result, error: null };
                } catch (e: any) {
                    // Update state incrementally with error
                    results[item.id] = { id: item.id, result: null, error: e.message };
                    return { id: item.id, result: null, error: e.message };
                }
            });

            await Promise.all(promises);
        } catch (error) {
            console.error("Error executing queries", error);
        }
    }

    function handleRemove(id: string) {
        items = items.filter(i => i.id !== id);
        saveDashboard();
    }
</script>

<div class="p-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <div class="flex gap-2">
            <button onclick={executeQueries} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Refresh Data</button>
            <button onclick={() => { localStorage.removeItem('localmind_dashboard'); items = []; results = {}; }} class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Clear Dashboard</button>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-12">
            <span class="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></span>
        </div>
    {:else if items.length === 0}
        <div class="text-center py-12 text-gray-500 bg-gray-50 border rounded-lg">
            <p>Your dashboard is empty.</p>
            <p class="mt-2 text-sm">Go to the main query view to pin charts to your dashboard.</p>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {#each items as item (item.id)}
                <div class="w-full bg-white border rounded shadow-sm flex flex-col relative group overflow-hidden" style="min-height: 400px;">
                    <div class="p-2 border-b bg-gray-50 flex justify-between items-center">
                        <h3 class="font-medium text-sm truncate">{item.title}</h3>
                        <button aria-label="Remove Chart" onclick={() => handleRemove(item.id)} class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                    <div class="flex-grow p-2 relative h-full flex flex-col justify-center">
                        {#if results[item.id]}
                            {#if results[item.id].error}
                                <div class="text-red-500 p-2 text-sm text-center">
                                    Error: {results[item.id].error}
                                </div>
                            {:else if results[item.id].result}
                                <div class="w-full h-full flex-grow">
                                    <ChartViewer result={results[item.id].result} customOption={item.customOption} />
                                </div>
                            {/if}
                        {:else}
                             <div class="flex justify-center items-center h-full">
                                <span class="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>
