<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import * as echarts from 'echarts';

  export let data: any[] = [];
  export let columns: string[] = [];

  let chartContainer: HTMLDivElement;
  let chartInstance: echarts.ECharts | null = null;

  let chartType: 'line' | 'bar' | 'pie' = 'bar';
  let xAxisColumn: string = columns[0] || '';
  let yAxisColumn: string = columns[1] || columns[0] || '';

  // Watch for data/column changes and update default axes if necessary
  $: {
    if (columns.length > 0) {
      if (!columns.includes(xAxisColumn)) xAxisColumn = columns[0];
      if (!columns.includes(yAxisColumn)) {
         // Try to find a numeric column for the y-axis to avoid blank charts
         const numericCol = columns.find(col => {
            if (data && data.length > 0) {
              return typeof data[0][col] === 'number';
            }
            return false;
         });
         yAxisColumn = numericCol || (columns.length > 1 ? columns[1] : columns[0]);
      }
    }
  }

  // Reactive statement to re-render chart when config or data changes
  $: if (chartInstance && data && xAxisColumn && yAxisColumn) {
    updateChart();
  }

  onMount(() => {
    if (chartContainer) {
      chartInstance = echarts.init(chartContainer);
      updateChart();
    }

    // Resize chart when window resizes
    const handleResize = () => {
      if (chartInstance) chartInstance.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (chartInstance) {
      chartInstance.dispose();
    }
  });

  function updateChart() {
    if (!chartInstance) return;

    if (!data || data.length === 0 || !xAxisColumn || !yAxisColumn) {
      chartInstance.clear();
      return;
    }

    const xAxisData = data.map(row => row[xAxisColumn]);
    const yAxisData = data.map(row => row[yAxisColumn]);

    let option: echarts.EChartsOption;

    if (chartType === 'pie') {
      const pieData = data.map(row => ({
        name: String(row[xAxisColumn]),
        value: Number(row[yAxisColumn])
      }));

      option = {
        tooltip: {
          trigger: 'item'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          type: 'scroll'
        },
        series: [
          {
            name: yAxisColumn,
            type: 'pie',
            radius: '50%',
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };
    } else {
      option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: xAxisData,
          name: xAxisColumn,
          nameLocation: 'middle',
          nameGap: 30
        },
        yAxis: {
          type: 'value',
          name: yAxisColumn
        },
        series: [
          {
            data: yAxisData,
            type: chartType,
            smooth: true
          }
        ]
      };
    }

    chartInstance.setOption(option, true);
  }
</script>

<div class="chart-viewer-container">
  <div class="chart-controls">
    <div class="control-group">
      <label for="chart-type">Chart Type:</label>
      <select id="chart-type" bind:value={chartType}>
        <option value="bar">Bar Chart</option>
        <option value="line">Line Chart</option>
        <option value="pie">Pie Chart</option>
      </select>
    </div>

    <div class="control-group">
      <label for="x-axis">X Axis / Label:</label>
      <select id="x-axis" bind:value={xAxisColumn}>
        {#each columns as col}
          <option value={col}>{col}</option>
        {/each}
      </select>
    </div>

    <div class="control-group">
      <label for="y-axis">Y Axis / Value:</label>
      <select id="y-axis" bind:value={yAxisColumn}>
        {#each columns as col}
          <option value={col}>{col}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="chart-wrapper" bind:this={chartContainer}></div>
</div>

<style>
  .chart-viewer-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 15px;
    background-color: #fff;
  }

  .chart-controls {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  label {
    font-size: 14px;
    font-weight: 500;
    color: #333;
  }

  select {
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 14px;
  }

  .chart-wrapper {
    width: 100%;
    height: 400px;
  }
</style>
