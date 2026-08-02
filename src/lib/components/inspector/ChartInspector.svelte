<script lang="ts">
    import { inspectorState } from '$lib/stores/workspace.store';

    let jsonInput = $state($inspectorState.rawJsonOverride || '{\n  \n}');
    let isValidJson = $state(true);

    function handleClose() {
        $inspectorState.isOpen = false;
    }

    function setTab(tab: 'Data' | 'Format') {
        $inspectorState.activeTab = tab;
    }

    // Reactive JSON validation
    $effect(() => {
        try {
            if (jsonInput.trim() === '' || jsonInput.trim() === '{\n  \n}') {
                $inspectorState.parsedOverride = null;
                $inspectorState.rawJsonOverride = jsonInput;
                isValidJson = true;
            } else {
                const parsed = JSON.parse(jsonInput);
                $inspectorState.parsedOverride = parsed;
                $inspectorState.rawJsonOverride = jsonInput;
                isValidJson = true;
            }
        } catch (e) {
            isValidJson = false;
            // Do not update parsedOverride to prevent crashing the chart
        }
    });

    function resetJson() {
        jsonInput = '{\n  \n}';
    }
</script>

<aside class="w-[320px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full flex-shrink-0 z-30 shadow-[-4px_0_24px_rgba(0,0,0,0.1)]">
    <!-- Inspector Header -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div class="flex items-center space-x-2">
            <span class="text-gray-500 text-[20px]">🛠️</span>
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Chart Inspector</h2>
        </div>
        <button 
            onclick={handleClose}
            class="w-8 h-8 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors" 
            title="Close Inspector"
        >
            ✕
        </button>
    </div>

    <!-- Inspector Tabs -->
    <div class="flex px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50">
        <button 
            onclick={() => setTab('Data')}
            class="flex-1 py-3 text-sm font-medium transition-colors border-b-2 { $inspectorState.activeTab === 'Data' ? 'text-blue-600 border-blue-600' : 'text-gray-500 hover:text-gray-700 border-transparent' }"
        >
            Data
        </button>
        <button 
            onclick={() => setTab('Format')}
            class="flex-1 py-3 text-sm font-medium transition-colors border-b-2 { $inspectorState.activeTab === 'Format' ? 'text-blue-600 border-blue-600' : 'text-gray-500 hover:text-gray-700 border-transparent' }"
        >
            Format
        </button>
    </div>

    <!-- Inspector Scrollable Content (Data Tab Active) -->
    <div class="flex-1 overflow-y-auto">
        {#if $inspectorState.activeTab === 'Data'}
            <!-- Section: Series Configuration -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Series Configuration</h3>
                </div>
                <div class="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-sm text-gray-500 dark:text-gray-400">
                    UI configuration maps directly to the ECharts JSON. Use the JSON override below for deep customization.
                </div>
            </div>
        {:else}
            <!-- Section: Format -->
            <div class="p-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">Format options coming soon.</p>
            </div>
        {/if}
    </div>

    <!-- Bottom Section: Raw JSON Override -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <span class="text-[16px] mr-1 text-blue-600">{"{ }"}</span>
                Raw JSON Override
            </h3>
            {#if !isValidJson}
                <span class="text-[10px] text-red-500 font-mono flex items-center animate-pulse">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span> Invalid JSON
                </span>
            {:else}
                <span class="text-[10px] text-green-500 font-mono flex items-center">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span> Valid
                </span>
            {/if}
        </div>
        <div class="relative rounded-md overflow-hidden border {isValidJson ? 'border-gray-300 dark:border-gray-600' : 'border-red-500'}">
            <div class="absolute top-0 right-0 bg-gray-200 dark:bg-gray-700 px-2 py-1 text-[9px] text-gray-500 dark:text-gray-400 font-mono rounded-bl z-10">echarts.json</div>
            <textarea 
                bind:value={jsonInput}
                class="w-full h-40 bg-white dark:bg-[#020617] text-gray-900 dark:text-gray-100 text-xs p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono leading-relaxed" 
                spellcheck="false"
                placeholder={`{\n  "legend": {\n    "show": false\n  }\n}`}
            ></textarea>
        </div>
        <div class="mt-3 flex space-x-2">
            <button 
                onclick={resetJson}
                class="flex-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm py-1.5 rounded border border-gray-300 dark:border-gray-600 transition-colors"
            >
                Reset
            </button>
        </div>
    </div>
</aside>
