<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        id,
        label,
        color,
        emptyText,
        onDrop,
        children
    } = $props<{
        id: string;
        label: string;
        color: 'blue' | 'purple' | 'green' | 'orange';
        emptyText: string;
        onDrop: (e: DragEvent, zoneId: string) => void;
        children?: Snippet;
    }>();

    let isDragOver = $state(false);

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragOver = true;
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    function handleDragLeave(e: DragEvent) {
        isDragOver = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragOver = false;
        onDrop(e, id);
    }

    const baseClasses = "flex-1 min-w-[200px] border-2 border-dashed rounded p-3 transition-all duration-200 relative bg-white dark:bg-gray-800";

    // Color mapping based on theme
    let colorClasses = $derived({
        blue: {
            border: isDragOver ? "border-blue-500" : "border-blue-200 dark:border-blue-900/50",
            bgActive: "bg-blue-50 dark:bg-blue-900/20",
            glow: "ring-2 ring-blue-400 ring-opacity-50",
            title: "text-blue-700 dark:text-blue-300"
        },
        purple: {
            border: isDragOver ? "border-purple-500" : "border-purple-200 dark:border-purple-900/50",
            bgActive: "bg-purple-50 dark:bg-purple-900/20",
            glow: "ring-2 ring-purple-400 ring-opacity-50",
            title: "text-purple-700 dark:text-purple-300"
        },
        green: {
            border: isDragOver ? "border-green-500" : "border-green-200 dark:border-green-900/50",
            bgActive: "bg-green-50 dark:bg-green-900/20",
            glow: "ring-2 ring-green-400 ring-opacity-50",
            title: "text-green-700 dark:text-green-300"
        },
        orange: {
            border: isDragOver ? "border-orange-500" : "border-orange-200 dark:border-orange-900/50",
            bgActive: "bg-orange-50 dark:bg-orange-900/20",
            glow: "ring-2 ring-orange-400 ring-opacity-50",
            title: "text-orange-700 dark:text-orange-300"
        }
    });

    let currentTheme = $derived(colorClasses[color as keyof typeof colorClasses]);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="{baseClasses} {currentTheme.border} {isDragOver ? `${currentTheme.bgActive} ${currentTheme.glow} scale-[1.02]` : ''}"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
>
    <h4 class="font-semibold mb-2 text-sm {currentTheme.title}">{label}</h4>
    <div class="flex flex-wrap gap-2 min-h-[32px]">
        {#if children}
            {@render children()}
        {:else}
            <div class="text-gray-400 dark:text-gray-500 text-sm italic w-full text-center py-1 absolute inset-x-0 bottom-3 pointer-events-none">
                {emptyText}
            </div>
        {/if}
    </div>
</div>

<style>
    /* Custom animation for scale-in could go here or in tailwind.config, doing it locally for encapsulation if needed,
       but Tailwind's utility scale-[1.02] with transition-all is often sufficient for the drop zone itself */
</style>
