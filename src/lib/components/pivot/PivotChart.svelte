<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import * as echarts from 'echarts';
    import { buildEchartsOption, PALETTES, DEFAULT_PALETTE } from '$lib/utils/chartBuilder';
    import type { ChartType } from './pivot.types';
    import { inspectorState } from '$lib/stores/workspace.store';

    // Dark mode detection (Tailwind class-based)
    let darkMode = $state(false);
    function checkDark() {
        darkMode = document.documentElement.classList.contains('dark');
    }

    let {
        result,
        chartType = 'auto',
        rows,
        values,
        overrides,
        onChartTypeChange,
        onChartClick
    } = $props<{
        result: any;
        chartType: ChartType;
        rows: any[];
        values: any[];
        overrides?: any;
        onChartTypeChange: (type: ChartType) => void;
        onChartClick?: (rowData: any) => void;
    }>();

    let chartRef: HTMLElement = $state() as unknown as HTMLElement;
    let fullscreenChartRef: HTMLElement = $state() as unknown as HTMLElement;
    let chartInstance: echarts.ECharts | null = null;
    let fullscreenChartInstance: echarts.ECharts | null = $state(null);
    let resizeObserver: ResizeObserver | null = null;
    let isFullscreen = $state(false);

    // Palette state
    let selectedPalette = $state(DEFAULT_PALETTE);
    let showPalettePicker = $state(false);
    const paletteNames = Object.keys(PALETTES);

    const chartIcons: Record<ChartType, string> = {
        'auto': '📊', 'bar': '📊', 'line': '📈',
        'pie': '🥧', 'scatter': '⬡', 'area': '📉',
        'treemap': '🔲', 'heatmap': '🌡️'
    };
    const chartLabels: Record<ChartType, string> = {
        'auto': 'Auto', 'bar': 'Bar', 'line': 'Line',
        'pie': 'Pie', 'scatter': 'Scatter', 'area': 'Area',
        'treemap': 'Treemap', 'heatmap': 'Heatmap'
    };

    function attachClickListeners(instance: echarts.ECharts | null) {
        if (!instance) return;
        instance.off('click');
        instance.on('click', (params: any) => {
            if (onChartClick && params.data && params.data.rowData) {
                onChartClick(params.data.rowData);
            }
        });
    }

    onMount(() => {
        checkDark();
        // Watch for class changes on <html> (dark mode toggle)
        const observer = new MutationObserver(checkDark);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        if (chartRef) {
            chartInstance = echarts.init(chartRef, null, { renderer: 'canvas' });
            attachClickListeners(chartInstance);
            resizeObserver = new ResizeObserver(() => chartInstance?.resize());
            resizeObserver.observe(chartRef);
        }

        return () => observer.disconnect();
    });

    onDestroy(() => {
        if (resizeObserver) resizeObserver.disconnect();
        if (chartInstance) chartInstance.dispose();
        if (fullscreenChartInstance) fullscreenChartInstance.dispose();
    });

    function getColors() {
        return PALETTES[selectedPalette] ?? PALETTES[DEFAULT_PALETTE];
    }

    // Inline chart effect
    $effect(() => {
        if (!chartInstance || !chartRef) return;
        const rowCols = rows.map((r: any) => r.column);
        const colors = getColors();
        const _p = selectedPalette;
        const _d = darkMode;
        const _o = overrides;
        if (result && result.rows.length > 0 && values.length > 0) {
            chartInstance.setOption(buildEchartsOption(result, chartType as any, rowCols, values, colors, darkMode, overrides), true);
        } else {
            chartInstance.clear();
        }
    });

    // Fullscreen chart effect
    $effect(() => {
        if (!isFullscreen || !fullscreenChartInstance) return;
        const rowCols = rows.map((r: any) => r.column);
        const colors = getColors();
        const _p = selectedPalette;
        const _d = darkMode;
        const _o = overrides;
        if (result && result.rows.length > 0 && values.length > 0) {
            fullscreenChartInstance.setOption(buildEchartsOption(result, chartType as any, rowCols, values, colors, darkMode, overrides), true);
        } else {
            fullscreenChartInstance.clear();
        }
    });

    async function openFullscreen() {
        isFullscreen = true;
        showPalettePicker = false;
        await tick();
        if (fullscreenChartRef && !fullscreenChartInstance) {
            fullscreenChartInstance = echarts.init(fullscreenChartRef, null, { renderer: 'canvas' });
            attachClickListeners(fullscreenChartInstance);
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

    function selectPalette(name: string) {
        selectedPalette = name;
        showPalettePicker = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            if (isFullscreen) closeFullscreen();
            else showPalettePicker = false;
        }
    }

    const hasData = $derived(result && result.rows && result.rows.length > 0 && values.length > 0);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Inline Chart Panel -->
<div class="flex flex-col h-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-visible">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 rounded-t-xl overflow-x-auto whitespace-nowrap hide-scrollbar">
        <h4 class="font-semibold text-sm text-gray-600 dark:text-gray-300 tracking-wide uppercase mr-4">Visualization</h4>
        <div class="flex items-center gap-2">
            <!-- Chart type selector -->
            <div class="flex items-center gap-0.5 bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm border dark:border-gray-600">
                {#each (['auto', 'bar', 'line', 'pie', 'scatter', 'area', 'treemap', 'heatmap'] as ChartType[]) as type}
                    <button
                        class="px-2 py-1 rounded-md text-xs font-medium transition-all duration-150
                            {chartType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600'}"
                        title={chartLabels[type]}
                        onclick={() => onChartTypeChange(type)}
                    >
                        {chartIcons[type]}
                    </button>
                {/each}
            </div>

            <!-- Palette picker trigger -->
            <div class="relative">
                <button
                    class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 transition-all duration-150 shadow-sm"
                    title="Change color palette"
                    onclick={() => showPalettePicker = !showPalettePicker}
                >
                    <!-- Live swatch preview of selected palette -->
                    <span class="flex gap-0.5">
                        {#each PALETTES[selectedPalette].slice(0, 5) as c}
                            <span class="w-3 h-3 rounded-full inline-block" style="background:{c}"></span>
                        {/each}
                    </span>
                    <span class="text-gray-600 dark:text-gray-300">{selectedPalette}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>

                {#if showPalettePicker}
                    <!-- Popover -->
                    <div class="absolute right-0 top-full mt-1 z-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl p-2 w-52"
                         style="box-shadow: 0 8px 32px rgba(0,0,0,0.18);">
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 pb-1.5">Color Palette</p>
                        {#each paletteNames as name}
                            <button
                                class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left
                                    {selectedPalette === name ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}"
                                onclick={() => selectPalette(name)}
                            >
                                <span class="flex gap-0.5 shrink-0">
                                    {#each PALETTES[name].slice(0, 8) as c}
                                        <span class="w-3 h-3 rounded-full" style="background:{c}"></span>
                                    {/each}
                                </span>
                                <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                {#if selectedPalette === name}
                                    <span class="ml-auto text-indigo-600 text-xs">✓</span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Inspect button -->
            <button
                class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-150 {$inspectorState.isOpen ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : ''}"
                title="Toggle Chart Inspector"
                onclick={() => $inspectorState.isOpen = !$inspectorState.isOpen}
            >
                <span class="text-sm">🛠️</span>
            </button>
            
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
    <div class="relative flex-1 p-3 min-h-[300px] overflow-hidden rounded-b-xl">
        <div role="img" aria-label={`${chartType} chart representation of pivot data`} bind:this={chartRef} class="w-full h-full absolute inset-0"></div>
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- Fullscreen Modal Overlay -->
{#if isFullscreen}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-6"
        style="background: rgba(10, 10, 20, 0.75); backdrop-filter: blur(6px);"
        onclick={(e) => { if (e.target === e.currentTarget) closeFullscreen(); }}
        role="dialog"
        aria-modal="true"
        aria-label="Chart fullscreen view"
        tabindex="-1"
    >
        <div class="relative w-full h-full max-w-[95vw] max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
             style="box-shadow: 0 32px 80px rgba(0,0,0,0.4);">

            <!-- Modal header -->
            <div class="flex items-center justify-between px-6 py-3 border-b dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 shrink-0">
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
                    <!-- Chart type in fullscreen -->
                    <div class="flex items-center gap-0.5 bg-white dark:bg-gray-700 p-1 rounded-lg shadow-sm border dark:border-gray-600">
                        {#each (['auto', 'bar', 'line', 'pie', 'scatter', 'area', 'treemap', 'heatmap'] as ChartType[]) as type}
                            <button
                                class="px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                                    {chartType === type ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600'}"
                                onclick={() => onChartTypeChange(type)}
                            >
                                {chartIcons[type]} {chartLabels[type]}
                            </button>
                        {/each}
                    </div>

                    <!-- Palette picker in fullscreen -->
                    <div class="relative">
                        <button
                            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 transition-all duration-150 shadow-sm"
                            onclick={() => showPalettePicker = !showPalettePicker}
                        >
                            <span class="flex gap-0.5">
                                {#each PALETTES[selectedPalette].slice(0, 5) as c}
                                    <span class="w-3 h-3 rounded-full" style="background:{c}"></span>
                                {/each}
                            </span>
                            <span class="text-gray-600 dark:text-gray-300">{selectedPalette}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        {#if showPalettePicker}
                            <div class="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl p-2 w-52"
                                 style="box-shadow: 0 8px 32px rgba(0,0,0,0.18);">
                                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase px-2 pb-1.5">Color Palette</p>
                                {#each paletteNames as name}
                                    <button
                                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left
                                            {selectedPalette === name ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}"
                                        onclick={() => selectPalette(name)}
                                    >
                                        <span class="flex gap-0.5 shrink-0">
                                            {#each PALETTES[name].slice(0, 8) as c}
                                                <span class="w-3 h-3 rounded-full" style="background:{c}"></span>
                                            {/each}
                                        </span>
                                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</span>
                                        {#if selectedPalette === name}<span class="ml-auto text-indigo-600 text-xs">✓</span>{/if}
                                    </button>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <!-- Close button -->
                    <button
                        class="ml-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-150"
                        title="Close (Esc)"
                        onclick={closeFullscreen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Chart canvas -->
            <div class="relative flex-1">
                <div role="img" aria-label={`${chartType} chart representation of pivot data`} bind:this={fullscreenChartRef} class="w-full h-full absolute inset-0 p-4"></div>
            </div>

            <!-- ESC hint -->
            <div class="shrink-0 px-6 py-1.5 text-center text-xs text-gray-400 dark:text-gray-600 border-t dark:border-gray-800">
                Press <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> to close
            </div>
        </div>
    </div>
{/if}
