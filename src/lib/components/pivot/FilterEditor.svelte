<script lang="ts">
    import type { FilterRule } from './pivot.types';

    let {
        column,
        operator,
        value,
        onChange
    } = $props<{
        column: string;
        operator: string;
        value: string;
        onChange: (operator: string, value: string) => void;
    }>();

    const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN'];

    // Create local state so input typing is fast, then propagate changes on blur/enter or slight debounce
    let localOp = $state('');
    let localVal = $state('');

    // Sync from props if they change externally (e.g. initial load)
    $effect(() => {
        localOp = operator;
        localVal = value;
    });

    function handleOpChange(e: Event) {
        const val = (e.target as HTMLSelectElement).value;
        localOp = val;
        onChange(localOp, localVal);
    }

    function handleValChange(e: Event) {
        const val = (e.target as HTMLInputElement).value;
        localVal = val;
        // Depending on desired responsiveness, you might want to debounce this in the parent
        onChange(localOp, localVal);
    }

</script>

<div class="flex items-center gap-1 mt-1 flex-nowrap w-full">
    <select
        value={localOp}
        onchange={handleOpChange}
        class="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500 max-w-[60px]"
    >
        {#each operators as op}
            <option value={op}>{op}</option>
        {/each}
    </select>
    <input
        type="text"
        placeholder="Value..."
        value={localVal}
        oninput={handleValChange}
        class="text-xs px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 w-[80px]"
    />
</div>
