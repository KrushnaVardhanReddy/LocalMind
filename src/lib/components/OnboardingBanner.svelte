<script lang="ts">
    import { onMount } from 'svelte';

    export let step: number = 0;
    export let onDismiss: () => void;

    let steps = [
        "Drop a file",
        "Add Rows",
        "Add Values",
        "View Chart",
        "Export"
    ];
</script>

<div class="bg-indigo-50 border border-indigo-200 rounded p-4 mb-4 flex justify-between items-center">
    <div>
        <h3 class="font-bold text-indigo-800">Welcome to LocalMind!</h3>
        <p class="text-indigo-600 text-sm">Let's build your first pivot table. Complete the steps below:</p>
        <div class="flex gap-4 mt-2">
            {#each steps as s, i}
                <div class="flex items-center gap-1 text-sm {step >= i ? 'text-indigo-800 font-semibold' : 'text-indigo-400'}">
                    <div class="w-4 h-4 rounded-full flex items-center justify-center {step > i ? 'bg-indigo-600 text-white' : (step === i ? 'border-2 border-indigo-600 text-indigo-600' : 'border border-indigo-300 text-indigo-300')}">
                        {step > i ? '✓' : i + 1}
                    </div>
                    {s}
                </div>
            {/each}
        </div>
    </div>
    <button on:click={onDismiss} class="text-indigo-500 hover:text-indigo-800 text-sm font-semibold">Dismiss</button>
</div>
