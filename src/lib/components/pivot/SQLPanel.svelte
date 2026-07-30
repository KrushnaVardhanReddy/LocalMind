<script lang="ts">
    import hljs from 'highlight.js/lib/core';
    import sql from 'highlight.js/lib/languages/sql';
    import 'highlight.js/styles/github-dark.css';

    hljs.registerLanguage('sql', sql);

    let { sql: sqlQuery } = $props<{ sql: string }>();

    let showSQL = $state(false);
    let copyText = $state('Copy SQL');

    function handleCopy(e: MouseEvent) {
        navigator.clipboard.writeText(sqlQuery);
        copyText = 'Copied!';
        setTimeout(() => copyText = 'Copy SQL', 2000);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="mt-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
    <div
        class="flex items-center justify-between p-3 cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/80 dark:hover:bg-gray-700/80 {showSQL ? 'border-b dark:border-gray-700' : ''}"
        onclick={() => showSQL = !showSQL}
    >
        <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2 select-none">
            <svg class="w-4 h-4 transition-transform duration-200 {showSQL ? 'rotate-90 text-blue-500' : 'text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            Generated SQL
        </h4>
        {#if showSQL}
            <span class="text-xs text-gray-400 dark:text-gray-500 font-mono hidden sm:inline-block">Auto-generated DuckDB dialect</span>
        {/if}
    </div>

    <div
        class="overflow-hidden transition-all duration-300 ease-in-out origin-top"
        style="max-height: {showSQL ? '500px' : '0'}; opacity: {showSQL ? '1' : '0'};"
    >
        {#if sqlQuery}
            <div class="p-4 relative bg-gray-900 text-gray-100">
                <button
                    class="absolute top-2 right-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs text-gray-300 z-10 transition-colors flex items-center gap-1 shadow-sm"
                    onclick={handleCopy}
                >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    {copyText}
                </button>
                <pre class="overflow-x-auto text-sm font-mono m-0 p-2 pt-6">{@html hljs.highlight(sqlQuery, {language: 'sql'}).value}</pre>
            </div>
        {:else}
            <div class="p-4 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800">No SQL generated yet.</div>
        {/if}
    </div>
</div>
