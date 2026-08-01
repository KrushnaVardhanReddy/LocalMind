<script lang="ts">
    import type { ExportConfig } from '$lib/services/ReportExporter';

    let { onclose, onexport, defaultTitle = 'LocalMind Report' }: {
        onclose: () => void,
        onexport: (config: ExportConfig) => void,
        defaultTitle?: string
    } = $props();

    let title = $state(defaultTitle);
    let theme: 'light' | 'dark' = $state('light');
    let includePivot = $state(true);

    let modalElement = $state<HTMLElement | null>(null);

    function trapFocus(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            onclose();
            return;
        }

        if (e.key === 'Tab' && modalElement) {
            const focusableElements = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length === 0) return;
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }

    $effect(() => {
        if (modalElement) {
            modalElement.focus();
        }
    });

    let includeChart = $state(true);
    let includeAiInsight = $state(true);
    let includeSql = $state(true);
    let includeRawData = $state(false);

    function handleExport() {
        onexport({
            title,
            theme,
            includePivot,
            includeChart,
            includeAiInsight,
            includeSql,
            includeRawData
        });
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick={onclose}>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div role="dialog" aria-modal="true" bind:this={modalElement} onkeydown={trapFocus} tabindex="-1" class="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onclick={(e) => e.stopPropagation()}>
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold text-gray-900">Export Report</h2>
            <button aria-label="Close Modal" onclick={onclose} class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>

        <div class="space-y-4">
            <div>
                <label for="export-title" class="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input
                    id="export-title"
                    type="text"
                    bind:value={title}
                    class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter report title..."
                />
            </div>

            <div>
                <label for="export-theme" class="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                    id="export-theme"
                    bind:value={theme}
                    class="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>

            <div class="pt-2">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Sections to Include</h3>
                <div class="space-y-2">
                    <label class="flex items-center">
                        <input type="checkbox" bind:checked={includeChart} class="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span class="ml-2 text-sm text-gray-700">Main Chart</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" bind:checked={includePivot} class="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span class="ml-2 text-sm text-gray-700">Pivot Table (Includes Pivot Chart)</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" bind:checked={includeAiInsight} class="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span class="ml-2 text-sm text-gray-700">AI Insight</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" bind:checked={includeSql} class="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span class="ml-2 text-sm text-gray-700">Generated SQL</span>
                    </label>
                    <label class="flex items-center">
                        <input type="checkbox" bind:checked={includeRawData} class="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span class="ml-2 text-sm text-gray-700">Raw Data (First 100 rows)</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="mt-8 flex justify-end gap-3">
            <button
                onclick={onclose}
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
            >
                Cancel
            </button>
            <button
                onclick={handleExport}
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition flex items-center gap-2"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export HTML
            </button>
        </div>
    </div>
</div>
