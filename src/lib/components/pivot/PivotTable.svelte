<script lang="ts">
    import { computeGrandTotals, sortRows } from '../pivotUtils';

    let {
        result,
        rowsConfig,
        valuesConfig,
        pageSize = 100
    } = $props<{
        result: any;
        rowsConfig: any[];
        valuesConfig: any[];
        pageSize?: number;
    }>();

    let currentPage = $state(1);
    let sortCol = $state<string | null>(null);
    let sortAsc = $state(true);

    let sortedRows = $derived(result && result.rows ? sortRows(result.rows, sortCol, sortAsc) : []);
    let paginatedRows = $derived(sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize));

    // We compute grand totals using the provided utility
    let grandTotals = $derived(result && result.rows && result.columns ? computeGrandTotals(result.rows, result.columns, rowsConfig, valuesConfig) : {});

    function toggleSort(col: string) {
        if (sortCol === col) {
            sortAsc = !sortAsc;
        } else {
            sortCol = col;
            sortAsc = true;
        }
    }

    // Reset pagination when data changes
    $effect(() => {
        if (result) {
            currentPage = 1;
        }
    });

</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
    {#if result && result.rows.length > 0}
        <div class="flex-1 overflow-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative">
                <thead class="bg-gray-50 dark:bg-gray-800/80 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                        {#each result.columns as col}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                            <th
                                class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 select-none group transition-colors"
                                onclick={() => toggleSort(col)}
                            >
                                <div class="flex items-center justify-between gap-1">
                                    <span class="truncate">{col}</span>
                                    <span class="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {#if sortCol === col}
                                            <span class="text-blue-500 opacity-100 font-bold">{sortAsc ? '↑' : '↓'}</span>
                                        {:else}
                                            ↕
                                        {/if}
                                    </span>
                                </div>
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {#each paginatedRows as row}
                        <tr class="even:bg-gray-50/50 dark:even:bg-gray-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            {#each result.columns as col}
                                <td class="px-4 py-2.5 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                                    {#if row[col] !== null}
                                        {typeof row[col] === 'number' ? row[col].toLocaleString(undefined, {maximumFractionDigits: 2}) : row[col]}
                                    {:else}
                                        <span class="text-gray-400 dark:text-gray-500 italic">NULL</span>
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>
                <tfoot class="bg-gray-100 dark:bg-gray-800 sticky bottom-0 z-10 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                    <tr>
                        {#each result.columns as col}
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {grandTotals[col] !== undefined && grandTotals[col] !== null ? (typeof grandTotals[col] === 'number' ? grandTotals[col].toLocaleString(undefined, {maximumFractionDigits: 2}) : grandTotals[col]) : ''}
                            </td>
                        {/each}
                    </tr>
                </tfoot>
            </table>
        </div>

        <div class="flex items-center justify-between p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <div class="text-xs text-gray-500 dark:text-gray-400">
                Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedRows.length)} of {sortedRows.length} rows • <span class="font-mono">{result.executionTimeMs.toFixed(1)}ms</span>
            </div>
            {#if sortedRows.length > pageSize}
                <div class="flex gap-1">
                    <button
                        class="px-2 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded text-xs shadow-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                        disabled={currentPage === 1}
                        onclick={() => currentPage -= 1}
                    >
                        &lt; Prev
                    </button>
                    <span class="px-3 py-1 text-xs text-gray-600 dark:text-gray-300 flex items-center font-medium">
                        {currentPage} / {Math.ceil(sortedRows.length / pageSize)}
                    </span>
                    <button
                        class="px-2 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded text-xs shadow-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-200"
                        disabled={currentPage === Math.ceil(sortedRows.length / pageSize)}
                        onclick={() => currentPage += 1}
                    >
                        Next &gt;
                    </button>
                </div>
            {/if}
        </div>

    {:else}
        <div class="flex-1 flex items-center justify-center p-8 text-gray-400 dark:text-gray-500 text-sm">
            <div class="text-center">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                No data to display. Drop columns into rows or values to build your pivot.
            </div>
        </div>
    {/if}
</div>
