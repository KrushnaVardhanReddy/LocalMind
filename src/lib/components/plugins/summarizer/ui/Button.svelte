<script lang="ts">
    interface Props {
        variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        class?: string;
        children?: import('svelte').Snippet;
        [key: string]: any;
    }

    let {
        variant = 'primary',
        size = 'md',
        disabled = false,
        class: className = '',
        children,
        ...rest
    }: Props = $props();

    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
        outline: 'border border-gray-200 bg-transparent hover:bg-gray-100 text-gray-900 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-800',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
        danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-8 text-base'
    };
</script>

<button
    class="{baseClasses} {variants[variant]} {sizes[size]} {className}"
    {disabled}
    {...rest}
>
    {@render children?.()}
</button>
