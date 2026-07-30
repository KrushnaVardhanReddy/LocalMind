<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as echarts from 'echarts';
    import type { QueryResult } from '$lib/workers/duckdb.worker';

    let { result = null, customOption = null }: { result: QueryResult | null, customOption?: echarts.EChartsOption | null } = $props();

    let chartContainer: HTMLDivElement;
    let chartInstance: echarts.ECharts | null = null;

    export function getChartBase64(): string | null {
        if (chartInstance) {
            return chartInstance.getDataURL({
                type: 'png',
                backgroundColor: '#ffffff'
            });
        }
        return null;
    }

    onMount(() => {
        if (chartContainer) {
            chartInstance = echarts.init(chartContainer);
        }

        const resizeObserver = new ResizeObserver(() => {
            if (chartInstance) {
                chartInstance.resize();
            }
        });

        if (chartContainer) {
            resizeObserver.observe(chartContainer);
        }

        return () => {
            resizeObserver.disconnect();
            if (chartInstance) {
                chartInstance.dispose();
            }
        };
    });

    $effect(() => {
        if (chartInstance && customOption && result && result.rows && result.rows.length > 0) {
            const optionToSet = { ...customOption };
            optionToSet.dataset = { source: result.rows };
            chartInstance.clear();
            chartInstance.setOption(optionToSet, true);
        } else if (chartInstance && result && result.columns && result.columns.length >= 2 && result.rows && result.rows.length > 0) {
            const xCol = result.columns[0];
            const yCol = result.columns[1];

            const xAxisData = result.rows.map(row => row[xCol]);
            const yAxisData = result.rows.map(row => {
                const val = row[yCol];
                // Try to parse to float if it's a string, otherwise return as is
                if (typeof val === 'string') {
                    const parsed = parseFloat(val);
                    return isNaN(parsed) ? val : parsed;
                }
                return val;
            });

            // check if yAxisData is mostly numeric
            const isNumeric = yAxisData.some(val => typeof val === 'number');

            const option: echarts.EChartsOption = {
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    data: xAxisData,
                    name: xCol,
                    nameLocation: 'middle',
                    nameGap: 30
                },
                yAxis: {
                    type: isNumeric ? 'value' : 'category',
                    name: yCol
                },
                series: [
                    {
                        data: yAxisData,
                        type: 'bar'
                    }
                ]
            };
            chartInstance.setOption(option);
        } else if (chartInstance) {
            chartInstance.clear();
        }
    });

</script>

<div bind:this={chartContainer} class="w-full h-96"></div>
