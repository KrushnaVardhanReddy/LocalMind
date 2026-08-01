<script lang="ts">
    let { title = 'Default Title', message = 'Default message' } = $props<{
        title?: string;
        message?: string;
    }>();
</script>

<div class="p-4 flex flex-col gap-4">
    <div>
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Demo Panel</h4>
        <p class="text-xs text-gray-500 dark:text-gray-400">This is a dynamic inspector component.</p>
    </div>

    <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
        <p class="font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p class="text-gray-600 dark:text-gray-400 mt-1">{message}</p>
    </div>
</div>
