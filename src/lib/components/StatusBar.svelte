<script lang="ts">
    import { onMount } from 'svelte';

    let isOffline = $state(false);

    onMount(() => {
        if (typeof window !== 'undefined') {
            isOffline = !navigator.onLine;

            const handleOffline = () => {
                isOffline = true;
            };

            const handleOnline = () => {
                isOffline = false;
            };

            window.addEventListener('offline', handleOffline);
            window.addEventListener('online', handleOnline);

            return () => {
                window.removeEventListener('offline', handleOffline);
                window.removeEventListener('online', handleOnline);
            };
        }
    });
</script>

{#if isOffline}
    <div class="fixed bottom-4 left-4 z-50">
        <div class="bg-gray-800 text-yellow-300 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 border border-yellow-900/50">
            <span>⚡ Offline Mode</span>
        </div>
    </div>
{/if}
