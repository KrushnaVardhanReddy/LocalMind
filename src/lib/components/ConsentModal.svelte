<script lang="ts">
    let {
        schema,
        sampleData,
        onaccept,
        onclose
    }: {
        schema: Record<string, string>;
        sampleData: any[];
        onaccept: () => void;
        onclose: () => void;
    } = $props();

</script>

<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Processing Consent
            </h2>
            <button onclick={onclose} class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div class="bg-purple-50 p-4 rounded-lg text-sm text-purple-900 border border-purple-100">
                You are about to send data to the AI model for analysis. Please review what will be shared.
            </div>

            <!-- Schema Section -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Table Schema
                </h3>
                <div class="text-sm text-gray-600 bg-white p-3 rounded border font-mono">
                    {#each Object.entries(schema) as [col, type]}
                        <div class="flex justify-between border-b last:border-0 border-gray-50 py-1">
                            <span class="font-medium text-gray-700">{col}</span>
                            <span class="text-gray-400 text-xs mt-0.5">{type}</span>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Sample Data Section -->
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h3 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Sample Data (First {sampleData.length} Rows)
                </h3>
                <div class="overflow-x-auto bg-white rounded border">
                    <table class="min-w-full text-xs">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                {#each Object.keys(schema) as col}
                                    <th class="px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">{col}</th>
                                {/each}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each sampleData as row}
                                <tr class="hover:bg-gray-50">
                                    {#each Object.keys(schema) as col}
                                        <td class="px-3 py-2 text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                                            {row[col] !== null ? row[col] : 'null'}
                                        </td>
                                    {/each}
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="mt-8 flex justify-end gap-3 pt-4 border-t">
            <button
                onclick={onclose}
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
                Cancel
            </button>
            <button
                onclick={onaccept}
                class="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors font-medium flex items-center gap-2"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                I Consent, Send to AI
            </button>
        </div>
    </div>
</div>
