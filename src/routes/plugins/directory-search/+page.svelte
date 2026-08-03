<script lang="ts">
    import DirectoryScanner from '$lib/components/plugins/directory-search/ui/DirectoryScanner.svelte';
    import SearchResults from '$lib/components/plugins/directory-search/ui/SearchResults.svelte';

    let scanComplete = $state(false);
</script>

<div class="h-full w-full bg-slate-900 text-slate-100 p-6 flex flex-col">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold mb-2">Local Directory Semantic Search</h1>
        <p class="text-slate-400">Scan your local folder, embed documents securely in DuckDB, and semantic search them offline.</p>
    </div>

    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        <div class="flex flex-col bg-slate-800 rounded-xl border border-slate-700/50 p-6 shadow-xl overflow-y-auto">
            <DirectoryScanner onScanComplete={() => scanComplete = true} />
        </div>
        <div class="flex flex-col bg-slate-800 rounded-xl border border-slate-700/50 p-6 shadow-xl overflow-y-auto relative">
            {#if scanComplete}
                <SearchResults />
            {:else}
                <div class="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-800/80 rounded-xl z-10 backdrop-blur-[2px]">
                    <p>Index a directory to enable search</p>
                </div>
                <SearchResults />
            {/if}
        </div>
    </div>
</div>
