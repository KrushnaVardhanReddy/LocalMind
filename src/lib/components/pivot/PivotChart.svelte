<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as echarts from 'echarts';
    import { buildEchartsOption } from '$lib/utils/chartBuilder';
    import type { ChartType } from './pivot.types';

    let {
        result,
        chartType = 'auto',
        rows,
        values,
        onChartTypeChange
    } = $props<{
        result: any;
        chartType: ChartType;
        rows: any[];
        values: any[];
        onChartTypeChange: (type: ChartType) => void;
    }>();

    let chartRef: HTMLElement = $state() as unknown as HTMLElement;
    let chartInstance: echarts.ECharts | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const chartIcons: Record<ChartType, string> = {
        'auto': '📊',
        'bar': '📊',
        'line': '📈',
        'pie': '🥧',
        'scatter': '⬡',
        'area': '📉'
    };

    onMount(() => {
        if (chartRef) {
            chartInstance = echarts.init(chartRef);
            resizeObserver = new ResizeObserver(() => {
                chartInstance?.resize();
            });
            resizeObserver.observe(chartRef);
        }
    });

    onDestroy(() => {
        if (resizeObserver) resizeObserver.disconnect();
        if (chartInstance) chartInstance.dispose();
    });

    $effect(() => {
        if (chartInstance) {
            if (result && result.rows.length > 0 && values.length > 0) {
                // If we don't have rows (only values), we can still chart it (e.g., single bar)
                const rowCols = rows.map(r => r.column);
                const option = buildEchartsOption(result, chartType as any, rowCols, values);
                chartInstance.setOption(option, true);
            } else {
                chartInstance.clear();
            }
        }
    });

    const hasData = $derived(result && result.rows && result.rows.length > 0 && values.length > 0);
</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
    <div class="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
        <h4 class="font-semibold text-sm text-gray-700 dark:text-gray-300">Visualization</h4>
        <div class="flex items-center gap-1 bg-white dark:bg-gray-700 p-1 rounded-md shadow-sm border dark:border-gray-600">
            {#each ['auto', 'bar', 'line', 'pie', 'scatter', 'area'] as type}
                <button
                    class="p-1.5 rounded transition-all hover:scale-110 {chartType === type ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 shadow-inner' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600'}"
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                    onclick={() => onChartTypeChange(type as ChartType)}
                >
                    <span class="text-lg leading-none">{chartIcons[type as ChartType]}</span>
                </button>
            {/each}
        </div>
    </div>

    <div class="relative flex-1 p-2 min-h-[300px]">
        <div bind:this={chartRef} class="w-full h-full absolute inset-0 p-2"></div>
        {#if !hasData}
            <div class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
                <div class="text-center text-gray-400 dark:text-gray-500">
                    <div class="text-4xl mb-2 opacity-50">📊</div>
                    <p class="text-sm">Add rows and values to see visualization</p>
                </div>
            </div>
        {/if}
    </div>
</div>
