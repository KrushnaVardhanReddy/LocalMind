<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        label,
        color,
        removable = true,
        onRemove,
        onDragStart,
        extras
    } = $props<{
        label: string;
        color: 'blue' | 'purple' | 'green' | 'orange';
        removable?: boolean;
        onRemove?: () => void;
        onDragStart?: (e: DragEvent) => void;
        extras?: Snippet;
    }>();

    const colorClasses = {
        blue: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200",
        purple: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200",
        green: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200",
        orange: "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-200"
    };

    const btnClasses = {
        blue: "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200",
        purple: "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200",
        green: "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200",
        orange: "text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200"
    };

    let isRemoving = $state(false);

    function handleRemove() {
        isRemoving = true;
        setTimeout(() => {
            if (onRemove) onRemove();
        }, 150); // Match fade-out animation duration
    }

    function customDragStart(e: DragEvent) {
        if (onDragStart) {
            onDragStart(e);

            // Custom drag ghost
            if (e.dataTransfer) {
                const ghost = document.createElement('div');
                ghost.textContent = label;
                ghost.className = `px-3 py-1 rounded-full font-medium text-sm shadow-xl ${colorClasses[color as keyof typeof colorClasses]} opacity-90 border-2`;
                ghost.style.position = 'absolute';
                ghost.style.top = '-1000px';
                document.body.appendChild(ghost);

                e.dataTransfer.setDragImage(ghost, 0, 0);

                // Clean up ghost after drag starts
                setTimeout(() => document.body.removeChild(ghost), 0);
            }
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    draggable={!!onDragStart}
    ondragstart={customDragStart}
    class="px-2 py-1 border rounded-md shadow-sm text-sm flex items-center gap-2 animate-[scaleIn_150ms_ease-out] transition-opacity duration-150 {colorClasses[color as keyof typeof colorClasses]} {!!onDragStart ? 'cursor-grab active:cursor-grabbing' : ''} {isRemoving ? 'opacity-0' : 'opacity-100'}"
>
    {#if extras}
        {@render extras()}
    {/if}
    <span class="font-medium truncate max-w-[150px]">{label}</span>
    {#if removable}
        <button onclick={handleRemove} class="font-bold flex-shrink-0 {btnClasses[color as keyof typeof btnClasses]}" aria-label="Remove {label}">
            &times;
        </button>
    {/if}
</div>

<style>
    @keyframes scaleIn {
        from {
            transform: scale(0.9);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
