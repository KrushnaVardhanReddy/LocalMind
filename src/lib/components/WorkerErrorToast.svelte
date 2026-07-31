<script lang="ts">
    import { workerCrashes } from '$lib/stores/workerHealth.store';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import { onMount, onDestroy } from 'svelte';

    let timeoutId: ReturnType<typeof setTimeout>;

    function dismiss(timestamp: number) {
        workerCrashes.update(crashes => crashes.filter(c => c.timestamp !== timestamp));
    }

    async function restartWorker(workerName: string, timestamp: number) {
        dismiss(timestamp);
        try {
            await WorkerManager.restart(workerName);
        } catch (e) {
            console.error('Failed to restart worker:', e);
        }
    }

    $effect(() => {
        if ($workerCrashes.length > 0) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Auto dismiss the oldest crash after 10s
                if ($workerCrashes.length > 0) {
                    dismiss($workerCrashes[0].timestamp);
                }
            }, 10000);
        }
    });

    onDestroy(() => {
        clearTimeout(timeoutId);
    });
</script>

{#if $workerCrashes.length > 0}
    {@const crash = $workerCrashes[0]}
    <div class="fixed bottom-4 right-4 bg-red-900 text-white px-4 py-3 rounded shadow-lg flex flex-col gap-2 z-50 max-w-sm">
        <div class="flex items-start gap-2">
            <span class="text-xl">⚠️</span>
            <div>
                <strong class="block text-sm mb-1">{crash.worker.toUpperCase()} worker crashed</strong>
                <p class="text-xs text-red-200">
                    {#if !crash.recoverable}
                        The file may be too large for available memory. Try a smaller file or use the Desktop version for unlimited memory.
                    {:else}
                        Your query could not complete. {crash.error}
                    {/if}
                </p>
            </div>
        </div>
        <div class="flex justify-end gap-3 mt-1">
            <button
                class="text-red-300 hover:text-white text-xs transition"
                onclick={() => dismiss(crash.timestamp)}
            >
                Dismiss
            </button>
            <button
                class="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-xs font-semibold transition"
                onclick={() => restartWorker(crash.worker, crash.timestamp)}
            >
                Restart Worker
            </button>
        </div>
    </div>
{/if}
