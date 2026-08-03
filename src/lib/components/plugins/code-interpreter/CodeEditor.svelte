<script lang="ts">
    import { Play, Loader2 } from 'lucide-svelte';

    let { code = $bindable(), onRun, isRunning = false } = $props<{ code: string; onRun: () => void; isRunning?: boolean }>();

    function handleRun() {
        if (!isRunning) {
            onRun();
        }
    }
</script>

<div class="flex flex-col h-full bg-slate-900 border-r border-slate-700">
    <div class="flex items-center justify-between p-2 border-b border-slate-700 bg-slate-800">
        <span class="text-sm font-medium text-slate-300 ml-2">main.py</span>
        <button
            class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onclick={handleRun}
            disabled={isRunning}
        >
            {#if isRunning}
                <Loader2 class="w-4 h-4 animate-spin" />
                Running...
            {:else}
                <Play class="w-4 h-4" />
                Run
            {/if}
        </button>
    </div>
    <div class="flex-1 relative">
        <textarea
            bind:value={code}
            spellcheck="false"
            class="w-full h-full p-4 font-mono text-sm bg-slate-950 text-slate-200 outline-none resize-none"
        ></textarea>
    </div>
</div>
