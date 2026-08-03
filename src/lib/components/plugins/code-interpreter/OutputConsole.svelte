<script lang="ts">
    let { stdout = [], stderr = [], plots = [] } = $props<{ stdout: string[]; stderr: string[]; plots: string[] }>();

    let activeTab = $state<'console' | 'plots'>('console');
</script>

<div class="flex flex-col h-full bg-slate-950">
    <div class="flex items-center border-b border-slate-800">
        <button
            class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'console' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}"
            onclick={() => activeTab = 'console'}
        >
            Console
        </button>
        <button
            class="px-4 py-2 text-sm font-medium border-b-2 {activeTab === 'plots' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-slate-300'}"
            onclick={() => activeTab = 'plots'}
        >
            Plots ({plots.length})
        </button>
    </div>

    <div class="flex-1 overflow-auto p-4 font-mono text-sm">
        {#if activeTab === 'console'}
            {#if stdout.length === 0 && stderr.length === 0}
                <div class="text-slate-600 italic">No output</div>
            {:else}
                {#each stdout as line}
                    <div class="text-slate-300 break-all">{line}</div>
                {/each}
                {#each stderr as line}
                    <div class="text-red-400 break-all">{line}</div>
                {/each}
            {/if}
        {:else if activeTab === 'plots'}
            {#if plots.length === 0}
                <div class="text-slate-600 italic">No plots generated</div>
            {:else}
                <div class="flex flex-col gap-4">
                    {#each plots as plotData}
                        <img src="data:image/png;base64,{plotData}" alt="Generated plot" class="max-w-full rounded-md border border-slate-800 bg-white" />
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
</div>
