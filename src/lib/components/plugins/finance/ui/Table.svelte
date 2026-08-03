<script lang="ts">
    interface Props {
        columns: string[];
        data: any[];
        class?: string;
    }

    let { columns, data, class: className = '' }: Props = $props();
</script>

<div class="overflow-x-auto {className}">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                {#each columns as column}
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column}
                    </th>
                {/each}
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            {#each data as row}
                <tr class="hover:bg-gray-50">
                    {#each columns as column}
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row[column] !== undefined && row[column] !== null ? row[column] : ''}
                        </td>
                    {/each}
                </tr>
            {/each}
            {#if data.length === 0}
                <tr>
                    <td colspan={columns.length} class="px-6 py-4 text-center text-sm text-gray-500">
                        No data available
                    </td>
                </tr>
            {/if}
        </tbody>
    </table>
</div>