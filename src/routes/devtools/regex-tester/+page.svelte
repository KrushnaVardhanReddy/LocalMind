<script lang="ts">
    import { onMount } from 'svelte';
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';
    import RegexTester from '$lib/components/devtools/regex-tester/RegexTester.svelte';

    onMount(() => {
        workspaceStore.setActiveWorkspace({
            id: 'devtools',
            type: 'devtools',
            title: 'DevTools'
        });
    });
</script>

<div class="h-full w-full flex flex-col p-6 bg-slate-900 overflow-hidden text-slate-200">
    <div class="flex items-center justify-between mb-4">
        <div>
            <h1 class="text-2xl font-bold text-white mb-2">Regex Tester & Debugger</h1>
            <p class="text-slate-400 text-sm mt-1">
                Fully offline regular expression testing to ensure proprietary data never leaves your browser.
            </p>
        </div>
        <a href="/devtools" class="text-blue-400 hover:text-blue-300 text-sm flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back to Hub
        </a>
    </div>

    <div class="flex-1 overflow-auto">
        <RegexTester />
    </div>
</div>
