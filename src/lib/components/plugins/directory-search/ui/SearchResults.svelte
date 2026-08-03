<script lang="ts">
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let query = $state('');
    let isSearching = $state(false);
    let results: Array<{path: string, content: string, score: number}> = $state([]);

    async function handleSearch(e: KeyboardEvent | null) {
        if (e && e.key !== 'Enter') return;
        if (!query.trim()) return;

        isSearching = true;
        try {
            const embeddings = await WorkerManager.getEmbeddings();
            const duckdb = await WorkerManager.getDuckDB();

            // Check if AI is enabled, if not enable it
            const aiEnabled = await embeddings.isAIEnabled();
            if (!aiEnabled) {
                await embeddings.enableAI();
            } else {
                await embeddings.init();
            }

            const queryVector = await embeddings.embed(query);
            const vecStr = `[${queryVector.join(',')}]`;

            // array_cosine_similarity is available in DuckDB VSS
            const sql = `
                SELECT path, content, array_cosine_similarity(vec, ${vecStr}::FLOAT[${queryVector.length}]) AS score
                FROM docs
                ORDER BY score DESC
                LIMIT 5;
            `;

            const res = await duckdb.query(sql);
            results = res.rows as Array<{path: string, content: string, score: number}>;
        } catch (error) {
            console.error('Search failed:', error);
            // It could fail if table doesn't exist, etc.
        } finally {
            isSearching = false;
        }
    }

    function highlightQueryMatch(text: string) {
        // Highlighting exact matches isn't perfect for semantic search since it's concept based,
        // but let's just display the chunk.
        return text;
    }
</script>

<div class="flex flex-col h-full">
    <h2 class="text-lg font-medium text-slate-200 mb-4 flex items-center">
        <svg class="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        Semantic Search
    </h2>

    <div class="mb-4">
        <div class="relative">
            <input
                type="text"
                bind:value={query}
                onkeydown={handleSearch}
                placeholder="Search for concepts, not just keywords..."
                class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 transition-all"
            />
            <button class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-indigo-400" onclick={() => handleSearch(null)}>
                {#if isSearching}
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {:else}
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                {/if}
            </button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto space-y-4 pr-2">
        {#if results.length > 0}
            {#each results as result}
                <div class="bg-slate-900/50 border border-slate-700 rounded-lg p-4 hover:border-indigo-500/50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-medium text-slate-200 truncate pr-4">{result.path}</h3>
                        <span class="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 shrink-0">
                            {(result.score * 100).toFixed(1)}% Match
                        </span>
                    </div>
                    <p class="text-sm text-slate-400 line-clamp-4 leading-relaxed">
                        {highlightQueryMatch(result.content)}
                    </p>
                </div>
            {/each}
        {:else if !isSearching && query.length > 0}
            <div class="text-center text-slate-500 mt-8">
                <p>No results found for your query.</p>
            </div>
        {/if}
    </div>
</div>
