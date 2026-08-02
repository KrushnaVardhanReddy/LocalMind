<svelte:head>
  <title>LocalMind Analytics - HTML Extractor</title>
</svelte:head>

<script lang="ts">
    import HtmlExtractor from '$lib/components/analytics/extractor/HtmlExtractor.svelte';
    import StatusBar from '$lib/components/StatusBar.svelte';
    import { goto } from '$app/navigation';
</script>

<div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100">
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center z-10 shrink-0">
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">LocalMind HTML Extractor</h1>
            <span class="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full border border-indigo-200">
                Data Extraction
            </span>
        </div>
        <div class="flex items-center gap-4">
            <button
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                onclick={() => { goto('/analytics'); }}
            >
                Back to Analytics
            </button>
        </div>
    </header>

    <main class="flex-1 overflow-auto p-6 relative z-0">
        <div class="max-w-6xl mx-auto h-full">
            <HtmlExtractor />
        </div>
    </main>

    <div class="shrink-0 z-10 relative bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <StatusBar />
    </div>
</div>
