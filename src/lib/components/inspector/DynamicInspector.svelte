<script lang="ts">
    import { workspaceStore } from '$lib/stores/workspace.store.svelte';
    import { InspectorRegistry } from './InspectorRegistry';

    let { state = workspaceStore.inspectorState } = $props<{
        state?: typeof workspaceStore.inspectorState
    }>();

    let SelectedComponent = $derived(state.componentName ? InspectorRegistry[state.componentName] : null);
</script>

{#if state.isOpen}
    <aside class="w-72 flex-none border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col h-full" data-testid="inspector-aside">
        <!-- Header -->
        <div class="p-4 flex-none border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <div class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Inspector</div>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" onclick={() => workspaceStore.closeInspector()} aria-label="Close Inspector">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <!-- Dynamic Content -->
        <div class="flex-1 overflow-y-auto">
            {#if SelectedComponent}
                <SelectedComponent {...state.props} />
            {:else if state.componentName}
                <div class="p-4 text-center">
                    <p class="text-sm text-red-500 dark:text-red-400">Component not found:</p>
                    <code class="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded mt-2 block">{state.componentName}</code>
                </div>
            {:else}
                <div class="p-4 flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400" data-testid="inspector-empty">
                    <svg class="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="text-sm font-medium">No details to show</p>
                    <p class="text-xs mt-1">Select an item to view its properties.</p>
                </div>
            {/if}
        </div>
    </aside>
{/if}
