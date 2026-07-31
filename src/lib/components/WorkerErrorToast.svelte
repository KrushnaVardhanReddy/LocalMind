<script lang="ts">
    import { workerCrashes } from '$lib/stores/workerHealth.store';
    import { WorkerManager } from '$lib/workers/WorkerManager';

    async function handleRestart(workerName: string, id: string) {
        await WorkerManager.restartWorker(workerName);
        workerCrashes.update(crashes => crashes.filter(c => c.id !== id));
    }

    function dismiss(id: string) {
        workerCrashes.update(crashes => crashes.filter(c => c.id !== id));
    }
</script>

{#if $workerCrashes.length > 0}
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {#each $workerCrashes as crash (crash.id)}
            <div class="bg-red-900 text-white px-4 py-3 rounded shadow-lg flex items-center gap-4 max-w-md">
                <div class="flex-1">
                    <span class="text-sm">
                        <strong>Worker Error ({crash.workerName}):</strong> {crash.error}
                    </span>
                    {#if crash.type === 'oom'}
                        <p class="text-xs text-red-200 mt-1">Operation timed out (possible Out-Of-Memory). Try reducing dataset size.</p>
                    {/if}
                </div>
                <div class="flex flex-col gap-1">
                    <button
                        class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold transition whitespace-nowrap"
                        onclick={() => handleRestart(crash.workerName, crash.id)}
                    >
                        Restart Worker
                    </button>
                    <button
                        class="text-red-300 hover:text-white text-xs transition"
                        onclick={() => dismiss(crash.id)}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        {/each}
    </div>
{/if}
