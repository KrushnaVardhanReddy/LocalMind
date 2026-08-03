<script lang="ts">
    interface Props {
        class?: string;
        children?: import('svelte').Snippet;
    }
    let { class: className = '', children }: Props = $props();
</script>

<div class="rounded-xl border border-gray-200 bg-white text-gray-950 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 {className}">
    {@render children?.()}
</div>
