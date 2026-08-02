<script lang="ts">
    import type { EmbeddingsWorkerContract } from '$lib/contracts/embeddings_worker_contract';
    import type { WaSQLiteWorkerContract } from '$lib/contracts/wa_sqlite_contract';

    let {
        embeddingsWorker,
        sqliteWorker,
        isIndexing = false
    }: {
        embeddingsWorker: EmbeddingsWorkerContract | null;
        sqliteWorker: WaSQLiteWorkerContract | null;
        isIndexing?: boolean;
    } = $props();

    let searchQuery = $state('');
    let isSearching = $state(false);
    let searchResults: { file_name: string; chunk_text: string; score: number }[] = $state([]);

    const defaultWorkspaceId = 'default-workspace';

    const handleSearch = async () => {
        if (!searchQuery.trim() || !embeddingsWorker || !sqliteWorker) return;

        isSearching = true;
        searchResults = [];

        try {
            const queryVector = await embeddingsWorker.embed(searchQuery);
            const chunks = await sqliteWorker.getAllDocumentChunks(defaultWorkspaceId);

            if (chunks.length === 0) {
                alert("No documents indexed for search.");
                return;
            }

            const chunkBlobs: Uint8Array[] = chunks.map(chunk => new Uint8Array(chunk.embedding));
            const scores = await embeddingsWorker.computeSimilarity(queryVector, chunkBlobs);

            const scoredChunks = chunks.map((chunk, i) => ({
                file_name: chunk.file_name,
                chunk_text: chunk.chunk_text,
                score: scores[i]
            }));

            scoredChunks.sort((a, b) => b.score - a.score);
            searchResults = scoredChunks.slice(0, 10);

        } catch (error) {
            console.error("Search error:", error);
            alert("Search failed.");
        } finally {
            isSearching = false;
        }
    };

    const handleSearchKeypress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearResults = () => {
        searchResults = [];
    };
</script>

<section class="flex flex-col gap-4 mt-4" data-testid="sidebar-search-panel">
    <h3 class="text-sm font-semibold uppercase tracking-wider text-surface-500">Semantic Search</h3>
    <div class="flex flex-col gap-2">
        <input
            type="text"
            bind:value={searchQuery}
            onkeypress={handleSearchKeypress}
            placeholder="Search docs..."
            class="w-full border border-surface-300 dark:border-surface-600 rounded px-3 py-2 text-sm bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-50"
            disabled={isSearching || isIndexing}
            aria-label="Semantic search query"
        />
        <div class="flex gap-2">
            <button
                onclick={handleSearch}
                disabled={isSearching || isIndexing || !searchQuery.trim()}
                class="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                aria-label="Search button"
            >
                {isSearching ? 'Searching...' : 'Search'}
            </button>
            {#if searchResults.length > 0}
                <button
                    class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    onclick={clearResults}
                    aria-label="Clear results"
                >
                    Clear
                </button>
            {/if}
        </div>
    </div>

    {#if searchResults.length > 0}
        <div class="flex flex-col gap-3 mt-2 max-h-[50vh] overflow-y-auto pr-1">
            {#each searchResults as result}
                <div class="bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded p-3 shadow-sm flex flex-col gap-2">
                    <div class="flex justify-between items-start gap-2">
                        <h4 class="font-semibold text-xs truncate text-primary-700 dark:text-primary-400" title={result.file_name}>{result.file_name}</h4>
                        <span class="text-[10px] font-mono bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 px-1.5 py-0.5 rounded flex-shrink-0">
                            {(result.score * 100).toFixed(1)}%
                        </span>
                    </div>
                    <p class="text-xs text-surface-700 dark:text-surface-300 line-clamp-4 leading-relaxed bg-surface-100 dark:bg-surface-800 p-2 rounded border border-surface-200 dark:border-surface-700">
                        {result.chunk_text}
                    </p>
                </div>
            {/each}
        </div>
    {/if}
</section>
