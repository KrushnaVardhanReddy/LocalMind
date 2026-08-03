<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        onclick?: (event: MouseEvent) => void;
        type?: 'button' | 'submit' | 'reset';
        disabled?: boolean;
        class?: string;
        children?: Snippet;
        variant?: 'primary' | 'secondary' | 'danger';
    }

    let {
        onclick,
        type = 'button',
        disabled = false,
        class: className = '',
        children,
        variant = 'primary'
    }: Props = $props();

    const baseClass = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
    };
</script>

<button
    {type}
    {disabled}
    class="{baseClass} {variants[variant]} {className}"
    {onclick}
>
    {#if children}
        {@render children()}
    {/if}
</button>