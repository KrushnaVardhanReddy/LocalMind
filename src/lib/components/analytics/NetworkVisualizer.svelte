<script lang="ts">
    import { onMount } from 'svelte';
    import { uploadedTables } from '$lib/stores/analytics.store';
    import { WorkerManager } from '$lib/workers/WorkerManager';
    import * as echarts from 'echarts';

    let selectedTable = $state('');
    let columns = $state<string[]>([]);
    let sourceCol = $state('');
    let targetCol = $state('');
    let weightCol = $state('');

    let isLoadingSchema = $state(false);
    let isGenerating = $state(false);
    let errorMessage = $state('');

    let chartContainer = $state<HTMLDivElement | null>(null);
    let chartInstance: echarts.ECharts | null = null;
    let resizeObserver: ResizeObserver | null = null;

    let nodes = $state<{id: string, name: string, symbolSize: number}[]>([]);
    let edges = $state<{source: string, target: string, value?: number}[]>([]);

    let minWeightFilter = $state(0);
    let maxWeightValue = $state(100);

    let tables: string[] = $state([]);

    onMount(() => {
        const unsub = uploadedTables.subscribe(val => {
            tables = val;
        });

        // As a fallback, check what tables are in DuckDB if store is empty
        if (tables.length === 0) {
            WorkerManager.getDuckDB().then(db => {
                db.query("SHOW TABLES", 1000).then((res: any) => {
                    if (res && res.rows) {
                        const dbTables = res.rows.map((r: any) => r.name);
                        uploadedTables.set(dbTables);
                    }
                }).catch((e: any) => console.error(e));
            });
        }

        return () => {
            unsub();
            if (resizeObserver) resizeObserver.disconnect();
            if (chartInstance) chartInstance.dispose();
        };
    });

    async function handleTableSelect() {
        if (!selectedTable) return;
        isLoadingSchema = true;
        errorMessage = '';
        try {
            const db = await WorkerManager.getDuckDB();
            const schema = await db.getSchema(selectedTable);
            columns = Object.keys(schema);
            sourceCol = '';
            targetCol = '';
            weightCol = '';
        } catch (e: any) {
            errorMessage = e.message || 'Failed to load schema';
        } finally {
            isLoadingSchema = false;
        }
    }

    async function generateGraph() {
        if (!selectedTable || !sourceCol || !targetCol) {
            errorMessage = 'Please select a table, source, and target columns.';
            return;
        }
        isGenerating = true;
        errorMessage = '';

        try {
            const db = await WorkerManager.getDuckDB();

            const limit = 10000;

            const nodeQuery = `
                SELECT DISTINCT "${sourceCol}" AS id FROM "${selectedTable}" WHERE "${sourceCol}" IS NOT NULL
                UNION
                SELECT DISTINCT "${targetCol}" AS id FROM "${selectedTable}" WHERE "${targetCol}" IS NOT NULL
                LIMIT ${limit}
            `;
            const nodeResult = await db.query(nodeQuery, limit);

            const edgeQuery = `
                SELECT "${sourceCol}" AS source, "${targetCol}" AS target ${weightCol ? `, "${weightCol}" AS weight` : ''}
                FROM "${selectedTable}"
                WHERE "${sourceCol}" IS NOT NULL AND "${targetCol}" IS NOT NULL
                LIMIT ${limit}
            `;

            const edgeResult = await db.query(edgeQuery, limit);

            nodes = nodeResult.rows.map((r: any) => ({
                id: String(r.id),
                name: String(r.id),
                symbolSize: 10
            }));

            let maxW = 0;
            let minW = Number.MAX_VALUE;
            edges = edgeResult.rows.map((r: any) => {
                const w = weightCol ? parseFloat(r.weight) : 1;
                if (!isNaN(w)) {
                    if (w > maxW) maxW = w;
                    if (w < minW) minW = w;
                }
                return {
                    source: String(r.source),
                    target: String(r.target),
                    value: isNaN(w) ? 1 : w
                };
            });

            if (weightCol && edges.length > 0) {
                maxWeightValue = maxW;
                minWeightFilter = minW === Number.MAX_VALUE ? 0 : minW;
            } else {
                maxWeightValue = 100;
                minWeightFilter = 0;
            }

            renderChart();

        } catch (e: any) {
            errorMessage = e.message || 'Failed to generate graph';
        } finally {
            isGenerating = false;
        }
    }

    function renderChart() {
        if (!chartContainer) return;

        if (!chartInstance) {
            chartInstance = echarts.init(chartContainer);
            resizeObserver = new ResizeObserver(() => {
                if (chartInstance) chartInstance.resize();
            });
            resizeObserver.observe(chartContainer);
        }

        const degreeMap = new Map<string, number>();
        const filteredEdges = weightCol ? edges.filter(e => (e.value || 0) >= minWeightFilter) : edges;

        for (const edge of filteredEdges) {
            degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
            degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
        }

        const chartNodes = nodes.filter(n => degreeMap.has(n.id)).map(n => {
            const degree = degreeMap.get(n.id) || 1;
            return {
                ...n,
                symbolSize: Math.max(10, Math.min(50, Math.sqrt(degree) * 5))
            };
        });

        const option: echarts.EChartsOption = {
            tooltip: {
                formatter: (params: any) => {
                    if (params.dataType === 'node') {
                        return `Node: ${params.data.name}<br/>Connections: ${degreeMap.get(params.data.id) || 0}`;
                    } else if (params.dataType === 'edge') {
                        return `${params.data.source} > ${params.data.target}${weightCol ? `<br/>Weight: ${params.data.value}` : ''}`;
                    }
                    return '';
                }
            },
            series: [{
                type: 'graph',
                layout: 'force',
                nodes: chartNodes,
                edges: filteredEdges,
                roam: true,
                label: {
                    show: chartNodes.length < 100,
                    position: 'right'
                },
                force: {
                    repulsion: 100,
                    edgeLength: 50
                },
                lineStyle: {
                    color: 'source',
                    curveness: 0.3
                },
                emphasis: {
                    focus: 'adjacency',
                    lineStyle: {
                        width: 4
                    }
                }
            }]
        };

        chartInstance.setOption(option, true);
    }

    $effect(() => {
        // Re-render chart when minWeightFilter changes
        if (minWeightFilter !== undefined && edges.length > 0) {
            renderChart();
        }
    });

</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
    <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-end">
        <div>
            <label for="table-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Table</label>
            <select
                id="table-select"
                bind:value={selectedTable}
                onchange={handleTableSelect}
                class="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
            >
                <option value="">Select a table...</option>
                {#each tables as table}
                    <option value={table}>{table}</option>
                {/each}
            </select>
        </div>

        {#if columns.length > 0}
            <div>
                <label for="source-col" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Column</label>
                <select
                    id="source-col"
                    bind:value={sourceCol}
                    class="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                    <option value="">Select...</option>
                    {#each columns as col}
                        <option value={col}>{col}</option>
                    {/each}
                </select>
            </div>

            <div>
                <label for="target-col" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Column</label>
                <select
                    id="target-col"
                    bind:value={targetCol}
                    class="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                    <option value="">Select...</option>
                    {#each columns as col}
                        <option value={col}>{col}</option>
                    {/each}
                </select>
            </div>

            <div>
                <label for="weight-col" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight Column (Optional)</label>
                <select
                    id="weight-col"
                    bind:value={weightCol}
                    class="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                    <option value="">None</option>
                    {#each columns as col}
                        <option value={col}>{col}</option>
                    {/each}
                </select>
            </div>

            <button
                onclick={generateGraph}
                disabled={isGenerating || !sourceCol || !targetCol}
                class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition disabled:opacity-50"
            >
                {isGenerating ? 'Generating...' : 'Generate Graph'}
            </button>
        {/if}
    </div>

    {#if errorMessage}
        <div class="p-4 bg-red-50 text-red-700 border-b border-red-200">
            {errorMessage}
        </div>
    {/if}

    {#if edges.length > 0 && weightCol}
        <div class="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center gap-4">
            <label for="weight-filter" class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Min Weight Filter: {minWeightFilter.toFixed(2)}
            </label>
            <input
                id="weight-filter"
                type="range"
                min="0"
                max={maxWeightValue}
                step={(maxWeightValue) / 100 || 1}
                bind:value={minWeightFilter}
                class="w-full max-w-md"
            />
        </div>
    {/if}

    <div class="flex-1 relative min-h-[500px]">
        {#if isLoadingSchema}
            <div class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10">
                <span class="text-gray-500">Loading schema...</span>
            </div>
        {/if}
        <div bind:this={chartContainer} class="w-full h-full"></div>
        {#if nodes.length === 0 && !isGenerating && !isLoadingSchema}
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span class="text-gray-400">Select a table and columns to visualize the network graph.</span>
            </div>
        {/if}
    </div>
</div>
