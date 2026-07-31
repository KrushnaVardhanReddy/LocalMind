<script lang="ts">
    let {
        step = 0,
        onDismiss
    } = $props<{
        step: number;
        onDismiss: () => void;
    }>();

    let steps = [
        "Drop a file",
        "Add Rows",
        "Add Values",
        "View Chart",
        "Export"
    ];
</script>

<div class="bg-indigo-50 border border-indigo-200 rounded p-4 mb-4 flex justify-between items-center shadow-sm">
    <div>
        <h3 class="font-bold text-indigo-800 flex items-center gap-2">
            <span>👋</span> Welcome to LocalMind!
        </h3>
        <p class="text-indigo-600 text-sm mt-1">Let's build your first pivot chart. Complete the steps below:</p>
        <div class="flex gap-4 mt-3 flex-wrap">
            {#each steps as s, i}
                <div class="flex items-center gap-1.5 text-sm {step >= i ? 'text-indigo-800 font-semibold' : 'text-indigo-400'}">
                    <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors duration-300 {step > i ? 'bg-indigo-600 text-white' : (step === i ? 'border-2 border-indigo-600 text-indigo-600' : 'border border-indigo-300 text-indigo-300')}">
                        {step > i ? '✓' : i + 1}
                    </div>
                    {s}
                </div>
            {/each}
        </div>
    </div>
    <button onclick={onDismiss} class="text-indigo-500 hover:text-indigo-800 text-sm font-semibold px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">
        Dismiss
    </button>
</div>
