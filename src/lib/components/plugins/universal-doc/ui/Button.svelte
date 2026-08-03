<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        onclick?: (event: MouseEvent) => void;
        type?: 'button' | 'submit' | 'reset';
        variant?: 'primary' | 'secondary' | 'ghost';
        disabled?: boolean;
        class?: string;
    }

    let {
        children,
        onclick,
        type = 'button',
        variant = 'primary',
        disabled = false,
        class: className = ''
    }: Props = $props();

    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";

    let variantStyles = $derived.by(() => {
        switch (variant) {
            case 'primary':
                return "bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90";
            case 'secondary':
                return "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80";
            case 'ghost':
                return "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";
            default:
                return "";
        }
    });

</script>

<button
    {type}
    {onclick}
    {disabled}
    class="{baseStyles} {variantStyles} {className}"
>
    {@render children()}
</button>
