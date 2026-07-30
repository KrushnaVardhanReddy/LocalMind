<script lang="ts">
    import { onMount, tick, onDestroy } from 'svelte';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import * as echarts from 'echarts';
    import { buildEchartsOption, type ChartType } from '$lib/utils/chartBuilder';
    import hljs from 'highlight.js';
    import 'highlight.js/styles/github.css'; // ensure some style is loaded, we can just use default

    let { tableName } = $props<{ tableName: string }>();

    let allColumns = $state<string[]>([]);
    let rows = $state<string[]>([]);
    let columns = $state<string[]>([]);
    let values = $state<{ column: string, agg: string }[]>([]);
    let filters = $state<{ column: string, operator: string, value: string }[]>([]);

    let chartType = $state<ChartType>('auto');
    let chartRef = $state<HTMLElement | null>(null);
    let chartInstance: echarts.ECharts | null = null;

    let dragItem = $state<{ type: string, column: string, index?: number } | null>(null);

    let result = $state<any>(null);
    let isExecuting = $state(false);
    let queryError = $state<string | null>(null);
    let generatedSQL = $state('');
    let showSQL = $state(false);

    const aggregations = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'];

    onMount(async () => {
        await fetchSchema();
    });

    // If tableName changes, reset and fetch schema
    $effect(() => {
        if (tableName) {
            allColumns = [];
            rows = [];
            columns = [];
            values = [];
            filters = [];
            result = null;
            queryError = null;
            fetchSchema();
        }
    });

    async function fetchSchema() {
        if (!tableName) return;
        try {
            const db = await WorkerManager.getDuckDB();
            const schema = await db.getSchema(tableName);
            allColumns = Object.keys(schema);
        } catch (error: any) {
            console.error("Failed to fetch schema", error);
        }
    }

    function handleDragStart(e: DragEvent, type: string, column: string, index?: number) {
        if (e.dataTransfer) {
            dragItem = { type, column, index };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', column);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    async function handleDrop(e: DragEvent, targetZone: string) {
        e.preventDefault();
        if (!dragItem) return;

        const { type, column, index } = dragItem;

        // Check column limits for Columns zone
        if (targetZone === 'columns' && !columns.includes(column)) {
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

        // Remove from original source if it was already in a zone
        if (type === 'rows' && index !== undefined) {
            rows.splice(index, 1);
        } else if (type === 'columns' && index !== undefined) {
            columns.splice(index, 1);
        } else if (type === 'values' && index !== undefined) {
            values.splice(index, 1);
        } else if (type === 'filters' && index !== undefined) {
            filters.splice(index, 1);
        }

        // Add to new zone
        if (targetZone === 'rows') {
            if (!rows.includes(column)) {
                rows.push(column);
            }
        } else if (targetZone === 'columns') {
            if (!columns.includes(column)) {
                columns.push(column);
            }
        } else if (targetZone === 'values') {
            values.push({ column, agg: 'SUM' });
        } else if (targetZone === 'filters') {
            filters.push({ column, operator: '=', value: '' });
        }

        dragItem = null;
        await tick();
        await generateAndExecuteSQL();
    }

    function handleRemoveRow(index: number) {
        rows.splice(index, 1);
        generateAndExecuteSQL();
    }

    function handleRemoveColumn(index: number) {
        columns.splice(index, 1);
        generateAndExecuteSQL();
    }

    function handleRemoveValue(index: number) {
        values.splice(index, 1);
        generateAndExecuteSQL();
    }

    function handleRemoveFilter(index: number) {
        filters.splice(index, 1);
        generateAndExecuteSQL();
    }

    function handleAggChange(index: number, newAgg: string) {
        values[index].agg = newAgg;
        generateAndExecuteSQL();
    }

    async function generateAndExecuteSQL() {
        if (rows.length === 0 && values.length === 0 && columns.length === 0) {
            result = null;
            return;
        }

        let sql = '';
        const whereClauses: string[] = [];
        for (const filter of filters) {
            if (filter.value || filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
                if (filter.operator === 'IN') {
                    // split by comma for IN operator
                    const parts = filter.value.split(',').map(v => `'${v.trim().replace(/'/g, "''")}'`);
                    whereClauses.push(`"${filter.column}" ${filter.operator} (${parts.join(', ')})`);
                } else if (filter.operator.includes('LIKE')) {
                    whereClauses.push(`"${filter.column}" ${filter.operator} '%${filter.value.replace(/'/g, "''")}%'`);
                } else {
                    whereClauses.push(`"${filter.column}" ${filter.operator} '${filter.value.replace(/'/g, "''")}'`);
                }
            }
        }
        const whereClauseStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Mode 1: Values only
        if (rows.length === 0 && columns.length === 0) {
            const selectParts = values.map(v => `${v.agg}("${v.column}") AS "${v.agg}_${v.column}"`);
            sql = `SELECT ${selectParts.join(', ')} FROM "${tableName}" ${whereClauseStr}`;
        }
        // Mode 3: Full PIVOT
        else if (columns.length > 0) {
            // DuckDB PIVOT syntax:
            // PIVOT (SELECT dim1, pivot_col, measure FROM table [WHERE]) ON pivot_col USING sum(measure) GROUP BY dim1
            const selectParts = [...rows.map(r => `"${r}"`), ...columns.map(c => `"${c}"`), ...values.map(v => `"${v.column}"`)];
            // If there are no rows, we can still pivot, just group by nothing (DuckDB supports PIVOT without GROUP BY if rows are absent)
            // But standard PIVOT usually requires an inner query.
            const innerQuery = `SELECT ${selectParts.join(', ')} FROM "${tableName}" ${whereClauseStr}`;

            const onClause = `ON ${columns.map(c => `"${c}"`).join(', ')}`;
            const usingClause = `USING ${values.map(v => `${v.agg}("${v.column}")`).join(', ')}`;
            const groupByClause = rows.length > 0 ? `GROUP BY ${rows.map(r => `"${r}"`).join(', ')}` : '';

            sql = `PIVOT (\n    ${innerQuery}\n) ${onClause} ${usingClause}`;
            if (groupByClause) {
                sql += ` ${groupByClause}`;
            }
        }
        // Mode 2: Rows + Values (no columns)
        else {
            const selectParts = [...rows.map(r => `"${r}"`), ...values.map(v => `${v.agg}("${v.column}") AS "${v.agg}_${v.column}"`)];
            const groupByParts = rows.map(r => `"${r}"`);
            sql = `SELECT ${selectParts.join(', ')} FROM "${tableName}" ${whereClauseStr}`;
            if (groupByParts.length > 0) {
                sql += ` GROUP BY ${groupByParts.join(', ')}`;
            }
        }

        isExecuting = true;
        queryError = null;

        generatedSQL = sql;

        try {
            const db = await WorkerManager.getDuckDB();
            result = await db.query(sql);
        } catch (error: any) {
            console.error("Query Error:", error);
            queryError = error.message;
        } finally {
            isExecuting = false;
        }
    }

    $effect(() => {
        if (chartRef) {
            if (!chartInstance) {
                chartInstance = echarts.init(chartRef);
            }
            const option = buildEchartsOption(result, chartType, rows, values);
            chartInstance.setOption(option, true);
        }
    });

    export function getPivotData() {
        let chartBase64: string | null = null;
        if (chartInstance) {
            chartBase64 = chartInstance.getDataURL({
                type: 'png',
                backgroundColor: '#ffffff'
            });
        }
        return {
            result,
            chartBase64
        };
    }

    // Also resize chart on window resize
    function handleResize() {
        if (chartInstance) {
            chartInstance.resize();
        }
    }

    onMount(() => {
        window.addEventListener('resize', handleResize);
    });

    onDestroy(() => {
        window.removeEventListener('resize', handleResize);
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
    });
</script>

<div class="p-4 bg-gray-50 border rounded-lg">
    <h3 class="text-lg font-bold mb-4">Pivot Builder - {tableName}</h3>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <!-- Columns List -->
        <div class="col-span-1 border rounded p-2 bg-white">
            <h4 class="font-semibold mb-2 text-sm text-gray-700">Columns</h4>
            <div class="flex flex-col gap-1 max-h-64 overflow-y-auto">
                {#each allColumns as col}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, 'source', col)}
                        class="px-2 py-1 bg-gray-100 border rounded text-sm cursor-grab hover:bg-gray-200"
                    >
                        {col}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Drop Zones -->
        <div class="col-span-1 md:col-span-3 flex flex-col gap-4">
            <!-- Rows Zone -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="border-2 border-dashed rounded p-4 bg-white min-h-[100px] transition-colors"
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, 'rows')}
            >
                <h4 class="font-semibold mb-2 text-sm text-gray-700">Rows / Dimensions</h4>
                <div class="flex flex-wrap gap-2">
                    {#each rows as row, i}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, 'rows', row, i)}
                            class="px-2 py-1 bg-blue-100 border border-blue-300 rounded text-sm cursor-grab flex items-center gap-1"
                        >
                            {row}
                            <button onclick={() => handleRemoveRow(i)} class="text-blue-500 hover:text-blue-700">&times;</button>
                        </div>
                    {/each}
                    {#if rows.length === 0}
                        <div class="text-gray-400 text-sm italic w-full text-center py-2">Drop columns here</div>
                    {/if}
                </div>
            </div>

            <!-- Columns Zone -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="border-2 border-dashed rounded p-4 bg-white min-h-[100px] transition-colors"
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, 'columns')}
            >
                <h4 class="font-semibold mb-2 text-sm text-gray-700">Columns / Pivot Headers</h4>
                <div class="flex flex-wrap gap-2">
                    {#each columns as col, i}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, 'columns', col, i)}
                            class="px-2 py-1 bg-purple-100 border border-purple-300 rounded text-sm cursor-grab flex items-center gap-1"
                        >
                            {col}
                            <button onclick={() => handleRemoveColumn(i)} class="text-purple-500 hover:text-purple-700">&times;</button>
                        </div>
                    {/each}
                    {#if columns.length === 0}
                        <div class="text-gray-400 text-sm italic w-full text-center py-2">Drop columns here</div>
                    {/if}
                </div>
            </div>

            <!-- Filters Zone -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="border-2 border-dashed rounded p-4 bg-white min-h-[100px] transition-colors"
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, 'filters')}
            >
                <h4 class="font-semibold mb-2 text-sm text-gray-700">Filters</h4>
                <div class="flex flex-col gap-2">
                    {#each filters as filter, i}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, 'filters', filter.column, i)}
                            class="px-2 py-1 bg-yellow-100 border border-yellow-300 rounded text-sm cursor-grab flex items-center gap-2"
                        >
                            <span class="font-semibold">{filter.column}</span>
                            <select
                                bind:value={filter.operator}
                                onchange={generateAndExecuteSQL}
                                class="text-xs bg-white border rounded px-1 cursor-pointer"
                            >
                                <option value="=">=</option>
                                <option value="!=">!=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value=">=">&gt;=</option>
                                <option value="<=">&lt;=</option>
                                <option value="LIKE">LIKE</option>
                                <option value="IN">IN</option>
                            </select>
                            <input
                                type="text"
                                bind:value={filter.value}
                                onchange={generateAndExecuteSQL}
                                class="text-xs bg-white border rounded px-1 w-24"
                                placeholder="Value..."
                            />
                            <button onclick={() => handleRemoveFilter(i)} class="text-yellow-600 hover:text-yellow-800 ml-auto">&times;</button>
                        </div>
                    {/each}
                    {#if filters.length === 0}
                        <div class="text-gray-400 text-sm italic w-full text-center py-2">Drop columns here</div>
                    {/if}
                </div>
            </div>

            <!-- Values Zone -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="border-2 border-dashed rounded p-4 bg-white min-h-[100px] transition-colors"
                ondragover={handleDragOver}
                ondrop={(e) => handleDrop(e, 'values')}
            >
                <h4 class="font-semibold mb-2 text-sm text-gray-700">Values / Metrics</h4>
                <div class="flex flex-wrap gap-2">
                    {#each values as val, i}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            draggable="true"
                            ondragstart={(e) => handleDragStart(e, 'values', val.column, i)}
                            class="px-2 py-1 bg-green-100 border border-green-300 rounded text-sm cursor-grab flex items-center gap-2"
                        >
                            <select
                                value={val.agg}
                                onchange={(e) => handleAggChange(i, (e.target as HTMLSelectElement).value)}
                                class="text-xs bg-white border rounded px-1 cursor-pointer"
                            >
                                {#each aggregations as agg}
                                    <option value={agg}>{agg}</option>
                                {/each}
                            </select>
                            <span>{val.column}</span>
                            <button onclick={() => handleRemoveValue(i)} class="text-green-600 hover:text-green-800">&times;</button>
                        </div>
                    {/each}
                    {#if values.length === 0}
                        <div class="text-gray-400 text-sm italic w-full text-center py-2">Drop columns here</div>
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- ECharts Container and Controls -->
    <div class="mt-4 bg-white border rounded p-4">
        <div class="flex items-center gap-4 mb-4">
            <h4 class="font-semibold text-sm text-gray-700">Visualization</h4>
            <div class="flex items-center gap-2 text-sm">
                <label for="chartType" class="text-gray-600">Chart Type:</label>
                <select id="chartType" bind:value={chartType} class="border rounded px-2 py-1 bg-white">
                    <option value="auto">Auto</option>
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="scatter">Scatter</option>
                    <option value="area">Area</option>
                </select>
            </div>
        </div>
        <div bind:this={chartRef} class="w-full min-h-[400px]"></div>
    </div>

    <!-- Generated SQL Panel -->
    <div class="mt-4 bg-white border rounded">
        <div class="flex items-center justify-between p-3 cursor-pointer bg-gray-50 border-b" onclick={() => showSQL = !showSQL}>
            <h4 class="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <svg class={`w-4 h-4 transition-transform ${showSQL ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                Generated SQL
            </h4>
        </div>
        {#if showSQL && generatedSQL}
            <div class="p-4 relative">
                <button
                    class="absolute top-2 right-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs text-gray-700 z-10"
                    onclick={() => {
                        navigator.clipboard.writeText(generatedSQL);
                        const btn = event?.currentTarget as HTMLButtonElement;
                        if (btn) {
                            const original = btn.innerText;
                            btn.innerText = 'Copied!';
                            setTimeout(() => btn.innerText = original, 2000);
                        }
                    }}
                >
                    Copy SQL
                </button>
                <pre class="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-sm font-mono m-0">{@html hljs.highlight(generatedSQL, {language: 'sql'}).value}</pre>
            </div>
        {/if}
    </div>

    <!-- Results Grid -->
    <div class="mt-4">
        {#if isExecuting}
            <div class="flex justify-center py-8">
                <span class="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
            </div>
        {:else if queryError}
            <div class="p-3 bg-red-100 text-red-800 rounded text-sm">
                Error: {queryError}
            </div>
        {:else if result && result.rows.length > 0}
            <div class="overflow-x-auto border rounded bg-white max-h-96">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50 sticky top-0">
                        <tr>
                            {#each result.columns as col}
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {col}
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        {#each result.rows as row}
                            <tr class="hover:bg-gray-50">
                                {#each result.columns as col}
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row[col] !== null ? (typeof row[col] === 'number' ? row[col].toLocaleString(undefined, {maximumFractionDigits: 2}) : row[col]) : 'NULL'}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <div class="text-xs text-gray-500 mt-2 text-right">
                {result.rows.length} row{result.rows.length !== 1 ? 's' : ''} • {result.executionTimeMs.toFixed(2)}ms
            </div>
        {:else if result && result.rows.length === 0}
            <div class="p-4 text-center text-gray-500 bg-white border rounded">
                No data to display.
            </div>
        {/if}
    </div>
</div>
