<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        class?: string;
        children?: Snippet;
        title?: string;
    }

    let { class: className = '', children, title }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden {className}">
    {#if title}
        <div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 class="text-lg font-medium text-gray-900">{title}</h3>
        </div>
    {/if}
    <div class="p-4">
        {#if children}
            {@render children()}
        {/if}
    </div>
</div>