import re

with open('src/lib/components/PivotBuilder.svelte', 'r') as f:
    content = f.read()

# Make sorting function to bind to headers
toggle_sort = """    function toggleSort(col: string) {
        if (sortCol === col) {
            sortAsc = !sortAsc;
        } else {
            sortCol = col;
            sortAsc = true;
        }
    }"""
content = content.replace("    function handleResize() {", toggle_sort + "\n\n    function handleResize() {")

# Empty States & Results grid update
results_grid_old = """    <!-- Results Grid -->
    <div class="mt-4">
        {#if isExecuting}
            <div class="flex justify-center py-8">
                <span class="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
            </div>
        {:else if queryError}
            <div class="p-3 bg-red-100 text-red-800 rounded text-sm">
                Error: {queryError}
            </div>
        {:else if result && result.rows.length > 0}
            <div class="overflow-x-auto border rounded bg-white max-h-96">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            {#each result.columns as col}
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col}
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each result.rows as row}
                            <tr class="hover:bg-gray-50">
                                {#each result.columns as col}
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row[col] !== null ? (typeof row[col] === 'number' ? row[col].toLocaleString(undefined, {maximumFractionDigits: 2}) : row[col]) : 'NULL'}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div class="text-xs text-gray-500 mt-2 text-right">
                {result.rows.length} row{result.rows.length !== 1 ? 's' : ''} • {result.executionTimeMs.toFixed(2)}ms
            </div>
        {:else if result && result.rows.length === 0}
            <div class="p-4 text-center text-gray-500 bg-white border rounded">
                No data to display.
            </div>
        {/if}
    </div>"""

results_grid_new = """    <!-- Results Grid -->
    <div class="mt-4">
        {#if rows.length === 0 && columns.length === 0 && values.length === 0}
            <div class="p-8 text-center text-gray-500 bg-white border rounded flex flex-col items-center justify-center">
                <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Drag columns to Rows and Values to start building your pivot.
            </div>
        {:else if isExecuting}
            <div class="flex justify-center py-8">
                <span class="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
            </div>
        {:else if queryError}
            <div class="p-3 bg-red-100 text-red-800 rounded text-sm">
                Error: {queryError}
            </div>
        {:else if result && result.rows.length > 0}
            <div class="overflow-x-auto border rounded bg-white max-h-96">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            {#each result.columns as col}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200 select-none"
                                    onclick={() => toggleSort(col)}
                                >
                                    <div class="flex items-center gap-1">
                                        {col}
                                        {#if sortCol === col}
                                            <span class="text-indigo-500">{sortAsc ? '↑' : '↓'}</span>
                                        {/if}
                                    </div>
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each paginatedRows as row}
                            <tr class="even:bg-gray-50 hover:bg-gray-100">
                                {#each result.columns as col}
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row[col] !== null ? (typeof row[col] === 'number' ? row[col].toLocaleString(undefined, {maximumFractionDigits: 2}) : row[col]) : 'NULL'}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot class="bg-gray-100 sticky bottom-0 z-10 font-bold border-t-2 border-gray-300">
                        <tr>
                            {#each result.columns as col}
                                <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {grandTotals[col] !== undefined && grandTotals[col] !== null ? (typeof grandTotals[col] === 'number' ? grandTotals[col].toLocaleString(undefined, {maximumFractionDigits: 2}) : grandTotals[col]) : ''}
                                </td>
                            {/each}
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="flex items-center justify-between mt-4">
                <div class="text-xs text-gray-500">
                    Showing rows {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sortedRows.length)} of {sortedRows.length} • {result.executionTimeMs.toFixed(2)}ms
                </div>
                {#if sortedRows.length > PAGE_SIZE}
                    <div class="flex gap-2">
                        <button
                            class="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                            disabled={currentPage === 1}
                            onclick={() => currentPage -= 1}
                        >
                            &lt; Previous
                        </button>
                        <span class="px-3 py-1 text-sm text-gray-600 flex items-center">
                            Page {currentPage} of {Math.ceil(sortedRows.length / PAGE_SIZE)}
                        </span>
                        <button
                            class="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                            disabled={currentPage === Math.ceil(sortedRows.length / PAGE_SIZE)}
                            onclick={() => currentPage += 1}
                        >
                            Next &gt;
                        </button>
                    </div>
                {/if}
            </div>

        {:else if result && result.rows.length === 0}
            <div class="p-8 text-center text-gray-500 bg-white border rounded">
                No data matches your current configuration.
            </div>
        {/if}
    </div>"""

if results_grid_old in content:
    content = content.replace(results_grid_old, results_grid_new)
else:
    print("WARNING: Could not find old results grid. Manual check needed.")

with open('src/lib/components/PivotBuilder.svelte', 'w') as f:
    f.write(content)
