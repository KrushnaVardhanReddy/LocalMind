<script lang="ts">
    import { onMount, tick, onDestroy } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import type { ColumnInfo, ShelfItem, ValueShelfItem, FilterRule, ChartType, ColumnType } from './pivot.types';
    import type { PivotTemplate } from '$lib/templates/template.types';

    // Child Components
    import ColumnPanel from './ColumnPanel.svelte';
    import ShelfZone from './ShelfZone.svelte';
    import ShelfPill from './ShelfPill.svelte';
    import PivotChart from './PivotChart.svelte';
    import PivotTable from './PivotTable.svelte';
    import SQLPanel from './SQLPanel.svelte';
    import FilterEditor from './FilterEditor.svelte';

    let { tableName } = $props<{ tableName: string }>();

    // State
    export function getPivotData() {
        return {
            result: result,
            chartBase64: null
        };
    }

    export function applyTemplate(template: PivotTemplate) {
        rows = (template.pivotConfig.rows || []).map(col => ({ column: col, type: allColumns.find(c => c.name === col)?.type || 'unknown' }));
        columns = (template.pivotConfig.columns || []).map(col => ({ column: col, type: allColumns.find(c => c.name === col)?.type || 'unknown' }));
        values = (template.pivotConfig.values || []).map(v => ({ column: v.column, type: allColumns.find(c => c.name === v.column)?.type || 'numeric', agg: v.agg as any }));
        filters = (template.pivotConfig.filters || []).map(f => ({ column: f.column, operator: f.operator as any, value: f.value }));
        if (template.pivotConfig.chartType) {
            chartType = template.pivotConfig.chartType;
        }
        triggerQuery();
    }
    let allColumns = $state<ColumnInfo[]>([]);
    let rows = $state<ShelfItem[]>([]);
    let columns = $state<ShelfItem[]>([]);
    let values = $state<ValueShelfItem[]>([]);
    let filters = $state<FilterRule[]>([]);
    let usedColumnNames = $derived([...rows.map(r => r.column), ...columns.map(c => c.column), ...values.map(v => v.column), ...filters.map(f => f.column)]);

    let chartType = $state<ChartType>('auto');
    let result = $state<any>(null);
    let isExecuting = $state(false);
    let queryError = $state<string | null>(null);
    let generatedSQL = $state('');

    let dragItem = $state<{ type: string, column: string, index?: number } | null>(null);
    let layoutStacked = $state(false); // true: stacked (chart top, table bottom), false: side-by-side

    // Aggregation Popover state
    let activeAggPopoverIndex = $state<number | null>(null);

    const PAGE_SIZE = 1000;
    const aggregations = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'] as const;

    // Load columns with types
    onMount(async () => {
        await fetchSchema();
    });

    $effect(() => {
        if (tableName) {
            allColumns = [];
            rows = [];
            columns = [];
            values = [];
            filters = [];
            result = null;
            queryError = null;
            generatedSQL = '';
            fetchSchema();
        }
    });

    async function fetchSchema() {
        if (!tableName) return;
        try {
            const db = await WorkerManager.getDuckDB();

            const schema = await db.getSchema(tableName);
            const cols = Object.entries(schema).map(([name, type]) => {
                let colType: ColumnType = 'unknown';
                const typeStr = (String(type) || '').toUpperCase();
                if (typeStr.includes('INT') || typeStr.includes('FLOAT') || typeStr.includes('DOUBLE') || typeStr.includes('DECIMAL')) {
                    colType = 'numeric';
                } else if (typeStr.includes('CHAR') || typeStr.includes('TEXT') || typeStr.includes('VARCHAR')) {
                    colType = 'text';
                } else if (typeStr.includes('DATE') || typeStr.includes('TIME')) {
                    colType = 'date';
                } else if (typeStr.includes('BOOL')) {
                    colType = 'boolean';
                }
                
                return { name, type: colType };
            });
            allColumns = cols;
        } catch (error: any) {
            console.error("Failed to fetch schema", error);
        }
    }

    // Drag & Drop Orchestration
    function handleDragStartFromPanel(e: DragEvent, column: string) {
        if (e.dataTransfer) {
            dragItem = { type: 'new', column };
            e.dataTransfer.effectAllowed = 'copyMove';
            e.dataTransfer.setData('text/plain', column);

            // Custom ghost
            const ghost = document.createElement('div');
            ghost.textContent = column;
            ghost.className = 'px-3 py-1 bg-white border rounded shadow-lg font-medium text-sm';
            ghost.style.position = 'absolute';
            ghost.style.top = '-1000px';
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 0, 0);
            setTimeout(() => document.body.removeChild(ghost), 0);
        }
    }

    function handleDragStartFromShelf(e: DragEvent, type: string, column: string, index: number) {
        if (e.dataTransfer) {
            dragItem = { type, column, index };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', column);
        }
    }

    async function handleDropOnZone(e: DragEvent, targetZone: string) {
        if (!dragItem) return;
        const { type, column, index } = dragItem;

        // Ensure distinct count limits for columns
        if (targetZone === 'columns' && !columns.find(c => c.column === column)) {
            try {
                const db = await WorkerManager.getDuckDB();
                const countResult = await db.query(`SELECT COUNT(DISTINCT "${column}") as count FROM "${tableName}"`);
                const distinctCount = Number(countResult.rows[0].count);
                if (distinctCount > 50) {
                    alert('This column has too many distinct values (>50) for a pivot. Consider using it as a Row instead.');
                    dragItem = null;
                    return;
                }
            } catch (error) {
                console.error("Failed to check distinct count", error);
            }
        }

        // Remove from old zone if moving
        if (type !== 'new') {
            if (type === 'rows') rows.splice(index!, 1);
            else if (type === 'columns') columns.splice(index!, 1);
            else if (type === 'values') values.splice(index!, 1);
            else if (type === 'filters') filters.splice(index!, 1);
        }

        const colInfo = allColumns.find(c => c.name === column);
        const colType = colInfo?.type;

        // Add to new zone
        if (targetZone === 'rows') {
            if (!rows.find(r => r.column === column)) rows.push({ column, type: colType });
        } else if (targetZone === 'columns') {
            if (!columns.find(c => c.column === column)) columns.push({ column, type: colType });
        } else if (targetZone === 'values') {
            // Pick default agg
            let agg: ValueShelfItem['agg'] = 'SUM';
            if (colType === 'text' || colType === 'date' || colType === 'boolean') {
                agg = 'COUNT';
            }
            values.push({ column, type: colType, agg });
        } else if (targetZone === 'filters') {
            if (!filters.find(f => f.column === column)) {
                filters.push({ column, operator: '=', value: '' });
            }
        }

        dragItem = null;
        triggerQuery();
    }

    function handleRemove(zone: string, index: number) {
        if (zone === 'rows') rows.splice(index, 1);
        else if (zone === 'columns') columns.splice(index, 1);
        else if (zone === 'values') values.splice(index, 1);
        else if (zone === 'filters') filters.splice(index, 1);
        triggerQuery();
    }

    function handleValueAggChange(index: number, newAgg: string) {
        if (values[index]) {
            values[index].agg = newAgg as any;
            activeAggPopoverIndex = null;
            triggerQuery();
        }
    }

    function handleChartClick(rowData: any) {
        let changed = false;
        for (const row of rows) {
            const val = rowData[row.column];
            if (val !== undefined && val !== null) {
                const exists = filters.find(f => f.column === row.column && f.value === String(val) && f.operator === '=');
                if (!exists) {
                    filters.push({ column: row.column, operator: '=', value: String(val) });
                    changed = true;
                }
            }
        }
        if (changed) {
            triggerQuery();
        }
    }

    function handleFilterChange(index: number, operator: string, value: string) {
        if (filters[index]) {
            filters[index].operator = operator as any;
            filters[index].value = value;
            triggerQuery();
        }
    }

    async function triggerQuery() {
        if (!tableName) return;
        if (rows.length === 0 && columns.length === 0 && values.length === 0) {
            result = null;
            generatedSQL = '';
            return;
        }

        isExecuting = true;
        queryError = null;

        try {
            const db = await WorkerManager.getDuckDB();

            // Validate shelf columns against actual schema — removes any stale
            // pills that don't exist in the current table (e.g. after table switch
            // or applying a template for a different schema).
            const validColNames = new Set(allColumns.map(c => c.name.toLowerCase()));
            const isValidCol = (col: string) => col === '*' || validColNames.has(col.toLowerCase());

            const invalidRows    = rows.filter(r => !isValidCol(r.column));
            const invalidValues  = values.filter(v => !isValidCol(v.column));
            const invalidFilters = filters.filter(f => !isValidCol(f.column));

            if (invalidRows.length || invalidValues.length || invalidFilters.length) {
                const bad = [...invalidRows.map(r => r.column), ...invalidValues.map(v => v.column), ...invalidFilters.map(f => f.column)];
                queryError = `Column(s) not found in "${tableName}": ${[...new Set(bad)].map(c => `"${c}"`).join(', ')}.\nPlease remove or replace these fields from the shelves.`;
                rows    = rows.filter(r => isValidCol(r.column));
                values  = values.filter(v => isValidCol(v.column));
                filters = filters.filter(f => isValidCol(f.column));
                isExecuting = false;
                return;
            }

            // Build Base Select
            let selectCols: string[] = [];
            let groupByCols: string[] = [];

            if (columns.length === 0) {
                // Normal Group By
                rows.forEach(r => {
                    selectCols.push(`"${r.column}"`);
                    groupByCols.push(`"${r.column}"`);
                });
                values.forEach(v => {
                    const colStr = v.column === '*' ? '*' : `"${v.column}"`;
                    selectCols.push(`${v.agg}(${colStr}) AS "${v.agg}_${v.column}"`);
                });

                if (selectCols.length === 0) selectCols.push('*');

                let sql = `SELECT ${selectCols.join(', ')} FROM "${tableName}"`;

                // Add WHERE
                let whereClauses: string[] = [];
                filters.forEach(f => {
                    if (f.value) {
                        whereClauses.push(`"${f.column}" ${f.operator} '${f.value.replace(/'/g, "''")}'`);
                    }
                });
                if (whereClauses.length > 0) {
                    sql += ` WHERE ${whereClauses.join(' AND ')}`;
                }

                if (groupByCols.length > 0) {
                    sql += ` GROUP BY ${groupByCols.join(', ')}`;
                }

                generatedSQL = sql;
                result = await db.query(sql);

            } else {
                // PIVOT logic
                const pivotCol = columns[0].column;

                let sql = `PIVOT "${tableName}" ON "${pivotCol}"`;

                const usingAggs = values.map(v => {
                    const colStr = v.column === '*' ? '*' : `"${v.column}"`;
                    return `${v.agg}(${colStr}) AS "${v.agg}_${v.column}"`;
                });
                if (usingAggs.length > 0) {
                    sql += ` USING ${usingAggs.join(', ')}`;
                } else {
                    sql += ` USING count(*)`
                }

                if (rows.length > 0) {
                    sql += ` GROUP BY ${rows.map(r => `"${r.column}"`).join(', ')}`;
                }

                let whereClauses: string[] = [];
                filters.forEach(f => {
                    if (f.value) {
                        whereClauses.push(`"${f.column}" ${f.operator} '${f.value.replace(/'/g, "''")}'`);
                    }
                });
                if (whereClauses.length > 0) {
                    // PIVOT doesn't easily support WHERE directly in standard syntax without a subquery
                    // DuckDB allows it but safer to do a subquery
                    sql = `PIVOT (SELECT * FROM "${tableName}" WHERE ${whereClauses.join(' AND ')}) ON "${pivotCol}"`;
                    if (usingAggs.length > 0) {
                        sql += ` USING ${usingAggs.join(', ')}`;
                    } else {
                        sql += ` USING count(*)`
                    }
                    if (rows.length > 0) {
                        sql += ` GROUP BY ${rows.map(r => `"${r.column}"`).join(', ')}`;
                    }
                }

                generatedSQL = sql;
                result = await db.query(sql);
            }

        } catch (error: any) {
            queryError = error.message;
            console.error("Pivot query failed", error);
        } finally {
            isExecuting = false;
        }
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- Mobile responsiveness: stack on small screens -->
<div class="flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden rounded-xl border dark:border-gray-700 shadow-sm p-4" onclick={(e) => {
    // Close agg popover if click is outside any pill
    if (!(e.target as HTMLElement).closest('.agg-popover-container')) {
        activeAggPopoverIndex = null;
    }
}}>

    <!-- Left Sidebar: Columns -->
    <div class="w-full md:w-64 flex-shrink-0 h-48 md:h-full rounded-lg overflow-hidden shadow-sm">
        <ColumnPanel
            {tableName}
            {allColumns}
            usedColumns={usedColumnNames}
            onDragStart={handleDragStartFromPanel}
        />
    </div>

    <!-- Main Workspace -->
    <div class="flex-1 flex flex-col min-w-0 overflow-y-auto pr-2 custom-scrollbar">

        <!-- Header & Shelves -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-4">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span class="text-2xl">🔀</span> Pivot Builder
                </h2>
                <div class="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 p-1 rounded-md border dark:border-gray-600">
                    <button class="px-2 py-1 rounded {layoutStacked ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}" onclick={() => layoutStacked = true} title="Stacked Layout">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <button class="px-2 py-1 rounded {!layoutStacked ? 'bg-white dark:bg-gray-600 shadow' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'}" onclick={() => layoutStacked = false} title="Side-by-Side Layout">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4v16M15 4v16M4 4h16v16H4V4z"></path></svg>
                    </button>
                </div>
            </div>

            <!-- Shelf Grid -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <!-- Rows -->
                <ShelfZone id="rows" label="Rows / Dimensions" color="blue" emptyText="Drop columns here" onDrop={handleDropOnZone}>
                    {#each rows as row, i}
                        <ShelfPill
                            label={row.column}
                            color="blue"
                            onRemove={() => handleRemove('rows', i)}
                            onDragStart={(e) => handleDragStartFromShelf(e, 'rows', row.column, i)}
                        />
                    {/each}
                </ShelfZone>

                <!-- Columns -->
                <ShelfZone id="columns" label="Columns / Pivot Headers" color="purple" emptyText="Drop columns here" onDrop={handleDropOnZone}>
                    {#each columns as col, i}
                        <ShelfPill
                            label={col.column}
                            color="purple"
                            onRemove={() => handleRemove('columns', i)}
                            onDragStart={(e) => handleDragStartFromShelf(e, 'columns', col.column, i)}
                        />
                    {/each}
                </ShelfZone>

                <!-- Values -->
                <ShelfZone id="values" label="Values / Metrics" color="green" emptyText="Drop columns here" onDrop={handleDropOnZone}>
                    {#each values as val, i}
                        <div class="relative agg-popover-container inline-block">
                            <ShelfPill
                                label={val.column}
                                color="green"
                                onRemove={() => handleRemove('values', i)}
                                onDragStart={(e) => handleDragStartFromShelf(e, 'values', val.column, i)}
                            >
                                {#snippet extras()}
                                    <button
                                        class="text-xs bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded px-1.5 py-0.5 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-700 focus:outline-none"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            activeAggPopoverIndex = activeAggPopoverIndex === i ? null : i;
                                        }}
                                    >
                                        {val.agg} <span class="text-[10px] ml-0.5">▼</span>
                                    </button>
                                {/snippet}
                            </ShelfPill>
                            {#if activeAggPopoverIndex === i}
                                <div class="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 w-24">
                                    {#each aggregations as agg}
                                        <button
                                            class="w-full text-left px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 {val.agg === agg ? 'font-bold text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}"
                                            onclick={(e) => { e.stopPropagation(); handleValueAggChange(i, agg); }}
                                        >
                                            {agg}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </ShelfZone>

                <!-- Filters -->
                <ShelfZone id="filters" label="Filters" color="orange" emptyText="Drop columns here" onDrop={handleDropOnZone}>
                    {#each filters as filter, i}
                        <ShelfPill
                            label={filter.column}
                            color="orange"
                            onRemove={() => handleRemove('filters', i)}
                            onDragStart={(e) => handleDragStartFromShelf(e, 'filters', filter.column, i)}
                        >
                            {#snippet extras()}
                                <FilterEditor
                                    column={filter.column}
                                    operator={filter.operator}
                                    value={filter.value}
                                    onChange={(op, val) => handleFilterChange(i, op, val)}
                                />
                            {/snippet}
                        </ShelfPill>
                    {/each}
                </ShelfZone>
            </div>
        </div>

        <!-- SQL Panel -->
        <SQLPanel sql={generatedSQL} />

        <!-- Visualization & Data Split Pane -->
        <div class="mt-4 flex-1 flex flex-col {layoutStacked ? '' : 'xl:flex-row'} gap-4 min-h-[500px]">
            <div class="{layoutStacked ? 'h-[400px]' : 'xl:w-1/2'} flex flex-col">
                <PivotChart
                    {result}
                    {chartType}
                    {rows}
                    {values}
                    onChartTypeChange={(t) => chartType = t}
                    onChartClick={handleChartClick}
                />
            </div>

            <div class="{layoutStacked ? 'flex-1' : 'xl:w-1/2'} flex flex-col min-h-[300px]">
                {#if isExecuting}
                    <div class="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
                        <div class="flex flex-col items-center gap-3">
                            <span class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></span>
                            <span class="text-sm text-gray-500 font-medium">Executing Query...</span>
                        </div>
                    </div>
                {:else if queryError}
                    <div class="flex-1 p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg shadow-sm overflow-auto">
                        <h4 class="font-bold mb-2">Query Error</h4>
                        <pre class="text-xs font-mono whitespace-pre-wrap">{queryError}</pre>
                    </div>
                {:else}
                    <PivotTable
                        {result}
                        rowsConfig={rows}
                        valuesConfig={values}
                        pageSize={PAGE_SIZE}
                    />
                {/if}
            </div>
        </div>

        <!-- Bottom padding for scrollability -->
        <div class="h-8"></div>
    </div>
</div>

<style>
    /* Custom Scrollbar for better aesthetics */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(156, 163, 175, 0.5);
        border-radius: 20px;
    }
    :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: rgba(75, 85, 99, 0.5);
    }
</style>
