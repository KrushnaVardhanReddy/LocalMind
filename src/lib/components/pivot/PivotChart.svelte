<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
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
    let fullscreenChartRef: HTMLElement = $state() as unknown as HTMLElement;
    let chartInstance: echarts.ECharts | null = null;
    let fullscreenChartInstance: echarts.ECharts | null = $state(null);
    let resizeObserver: ResizeObserver | null = null;
    let isFullscreen = $state(false);

    const chartIcons: Record<ChartType, string> = {
        'auto': '📊',
        'bar': '📊',
        'line': '📈',
        'pie': '🥧',
        'scatter': '⬡',
        'area': '📉'
    };

    const chartLabels: Record<ChartType, string> = {
        'auto': 'Auto',
        'bar': 'Bar',
        'line': 'Line',
        'pie': 'Pie',
        'scatter': 'Scatter',
        'area': 'Area'
    };

    onMount(() => {
        if (chartRef) {
            chartInstance = echarts.init(chartRef, null, { renderer: 'canvas' });
            resizeObserver = new ResizeObserver(() => {
                chartInstance?.resize();
            });
            resizeObserver.observe(chartRef);
        }
    });

    onDestroy(() => {
        if (resizeObserver) resizeObserver.disconnect();
        if (chartInstance) chartInstance.dispose();
        if (fullscreenChartInstance) fullscreenChartInstance.dispose();
    });

    // Render inline chart — inline reactive reads so Svelte tracks all deps
    $effect(() => {
        if (!chartInstance || !chartRef) return;
        const rowCols = rows.map(r => r.column);
        if (result && result.rows.length > 0 && values.length > 0) {
            const option = buildEchartsOption(result, chartType as any, rowCols, values);
            chartInstance.setOption(option, true);
        } else {
            chartInstance.clear();
        }
    });

    // Render fullscreen chart — same inline pattern so chartType changes re-trigger it
    $effect(() => {
        if (!isFullscreen || !fullscreenChartInstance) return;
        const rowCols = rows.map(r => r.column);
        if (result && result.rows.length > 0 && values.length > 0) {
            const option = buildEchartsOption(result, chartType as any, rowCols, values);
            fullscreenChartInstance.setOption(option, true);
        } else {
            fullscreenChartInstance.clear();
        }
    });

    async function openFullscreen() {
        isFullscreen = true;
        await tick();
        if (fullscreenChartRef && !fullscreenChartInstance) {
            fullscreenChartInstance = echarts.init(fullscreenChartRef, null, { renderer: 'canvas' });
        }
        setTimeout(() => fullscreenChartInstance?.resize(), 80);
    }

    function closeFullscreen() {
        isFullscreen = false;
        if (fullscreenChartInstance) {
            fullscreenChartInstance.dispose();
            fullscreenChartInstance = null;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape' && isFullscreen) closeFullscreen();
    }


    const hasData = $derived(result && result.rows && result.rows.length > 0 && values.length > 0);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Inline Chart Panel -->
<div class="flex flex-col h-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 rounded-t-xl">
        <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-300 tracking-wide uppercase">Visualization</h4>
        <div class="flex items-center gap-2">
            <!-- Chart type selector -->
            <div class="flex items-center gap-0.5 bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm border dark:border-gray-600">
                {#each (['auto', 'bar', 'line', 'pie', 'scatter', 'area'] as ChartType[]) as type}
                    <button
                        class="px-2 py-1 rounded-md text-xs font-medium transition-all duration-150
                            {chartType === type
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600'}"
                        title={chartLabels[type]}
                        onclick={() => onChartTypeChange(type)}
                    >
                        {chartIcons[type]}
                    </button>
                {/each}
            </div>
            <!-- Fullscreen button -->
            <button
                class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-150"
                title="Expand to fullscreen"
                onclick={openFullscreen}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 0l-5 5" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Chart Canvas -->
    <div class="relative flex-1 p-3 min-h-[300px]">
        <div bind:this={chartRef} class="w-full h-full absolute inset-0"></div>
        {#if !hasData}
            <div class="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 z-10">
                <div class="text-center text-gray-400 dark:text-gray-500 select-none">
                    <div class="text-5xl mb-3 opacity-30">📊</div>
                    <p class="text-sm font-medium">Add rows and values to see visualization</p>
                </div>
            </div>
        {/if}
    </div>
</div>

<!-- Fullscreen Modal Overlay -->
{#if isFullscreen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-6"
        style="background: rgba(10, 10, 20, 0.75); backdrop-filter: blur(6px);"
        onclick={(e) => { if (e.target === e.currentTarget) closeFullscreen(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Chart fullscreen view"
    >
        <!-- Modal card -->
        <div class="relative w-full h-full max-w-[95vw] max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
             style="box-shadow: 0 32px 80px rgba(0,0,0,0.4);">

            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 shrink-0">
                <div class="flex items-center gap-3">
                    <span class="text-lg">📊</span>
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100">Chart Explorer</h3>
                    {#if result?.rows}
                        <span class="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {result.rows.length.toLocaleString()} rows
                        </span>
                    {/if}
                </div>
                <div class="flex items-center gap-2">
                    <!-- Chart type selector inside modal -->
                    <div class="flex items-center gap-0.5 bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm border dark:border-gray-600">
                        {#each (['auto', 'bar', 'line', 'pie', 'scatter', 'area'] as ChartType[]) as type}
                            <button
                                class="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                                    {chartType === type
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600'}"
                                title={chartLabels[type]}
                                onclick={() => onChartTypeChange(type)}
                            >
                                {chartIcons[type]} {chartLabels[type]}
                            </button>
                        {/each}
                    </div>
                    <!-- Close button -->
                    <button
                        class="ml-2 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-150"
                        title="Close fullscreen (Esc)"
                        onclick={closeFullscreen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Chart Canvas in modal -->
            <div class="relative flex-1 p-4">
                <div bind:this={fullscreenChartRef} class="w-full h-full absolute inset-0 p-4"></div>
            </div>

            <!-- ESC hint -->
            <div class="shrink-0 px-6 py-2 text-center text-xs text-gray-400 dark:text-gray-600">
                Press <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> to close
            </div>
        </div>
    </div>
{/if}
