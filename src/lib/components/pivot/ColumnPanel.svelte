<script lang="ts">
    import type { ColumnInfo } from './pivot.types';
    import { WorkerManager } from '$lib/workers/WorkerManager';

    let {
        tableName,
        allColumns = [],
        usedColumns = [],
        onDragStart,
        isOnboardingMode = false,
        showRegionHotspot = false
    } = $props<{
        tableName: string;
        allColumns: ColumnInfo[];
        usedColumns: string[];
        onDragStart: (e: DragEvent, column: string) => void;
        isOnboardingMode?: boolean;
        showRegionHotspot?: boolean;
    }>();

    let searchQuery = $state('');

    let filteredColumns = $derived(
        allColumns.filter((c: ColumnInfo) => c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    let hoverPreviewData = $state<{ [col: string]: { sample: any[], distinctCount: number } }>({});
    let hoveredCol = $state<string | null>(null);

    async function handleMouseOver(col: string) {
        hoveredCol = col;
        if (!hoverPreviewData[col]) {
            try {
                const db = await WorkerManager.getDuckDB();
                const sampleResult = await db.query(`SELECT DISTINCT "${col}" FROM "${tableName}" LIMIT 5`);
                const countResult = await db.query(`SELECT COUNT(DISTINCT "${col}") as count FROM "${tableName}"`);

                hoverPreviewData[col] = {
                    sample: sampleResult.rows.map((r: any) => r[col]),
                    distinctCount: Number(countResult.rows[0].count)
                };
            } catch (error) {
                console.error("Failed to fetch column preview", error);
            }
        }
    }

    function handleMouseOut() {
        hoveredCol = null;
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case 'numeric': return '🔢';
            case 'text': return '🔤';
            case 'date': return '📅';
            case 'boolean': return '🔘';
            default: return '❓';
        }
    }
</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700">
    <div class="p-4 border-b dark:border-gray-700">
        <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Columns</h3>
        <input
            type="text"
            placeholder="Search columns..."
            bind:value={searchQuery}
            class="w-full px-3 py-2 border dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
    </div>

    <div class="flex-1 overflow-y-auto p-2">
        {#each filteredColumns as col}
            {@const isUsed = usedColumns.includes(col.name)}
            {@const isHotspot = isOnboardingMode && showRegionHotspot && col.name === 'region'}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="relative p-2 mb-1 rounded border dark:border-gray-700 cursor-grab hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 group {isUsed ? 'opacity-50' : 'opacity-100'} {isHotspot ? 'ring-2 ring-blue-500 ring-offset-2 bg-blue-50 relative z-10' : ''}"
                draggable="true"
                ondragstart={(e) => onDragStart(e, col.name)}
                onmouseover={() => handleMouseOver(col.name)}
                onmouseout={handleMouseOut}
                onfocus={() => handleMouseOver(col.name)}
                onblur={handleMouseOut}
            >
                <span class="text-sm">{getTypeIcon(col.type)}</span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{col.name}</span>

                {#if isHotspot}
                    <div class="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full animate-ping pointer-events-none"></div>
                    <div class="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none z-50">
                        Drag here to Rows &rarr;
                        <div class="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-blue-600"></div>
                    </div>
                {/if}

                {#if hoveredCol === col.name && hoverPreviewData[col.name]}
                    <div class="absolute left-full ml-2 top-0 z-50 w-48 p-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded shadow-lg text-xs pointer-events-none">
                        <div class="font-semibold mb-1 text-gray-800 dark:text-gray-100 border-b dark:border-gray-600 pb-1">
                            {col.name} <span class="text-gray-500 dark:text-gray-400 font-normal">({hoverPreviewData[col.name].distinctCount} distinct)</span>
                        </div>
                        <ul class="text-gray-600 dark:text-gray-300">
                            {#each hoverPreviewData[col.name].sample as val}
                                <li class="truncate">{val !== null ? val : 'NULL'}</li>
                            {/each}
                            {#if hoverPreviewData[col.name].distinctCount > 5}
                                <li class="text-gray-400 italic">...</li>
                            {/if}
                        </ul>
                    </div>
                {/if}
            </div>
        {/each}
        {#if filteredColumns.length === 0}
            <div class="text-gray-400 text-sm italic text-center py-4">No columns found</div>
        {/if}
    </div>
</div>
