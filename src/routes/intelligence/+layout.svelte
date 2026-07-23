<script lang="ts">
    import { checkWebGPUSupport } from '$lib/utils/webgpu-check';
    import { onMount, type Snippet } from 'svelte';

    let { children }: { children?: Snippet } = $props();

    let isSupported = $state(true);
    let unsupportedReason = $state('');

    onMount(() => {
        const support = checkWebGPUSupport();
        isSupported = support.supported;
        if (support.reason) {
            unsupportedReason = support.reason;
        }
    });
</script>

<div class="h-full w-full flex flex-col relative">
    {#if !isSupported}
        <div class="w-full bg-red-100 text-red-800 p-4 text-center border-b border-red-200">
            {unsupportedReason}
        </div>
    {/if}

    <div class="flex-1 {isSupported ? '' : 'opacity-50 pointer-events-none'}">
        {@render children?.()}
    </div>
</div>

<style>
    /* Scoped styles */
</style>