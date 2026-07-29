export type ChartType = 'auto' | 'bar' | 'line' | 'pie' | 'scatter' | 'area';

export interface PivotResult {
    columns: string[];
    rows: any[];
    executionTimeMs?: number;
}

export interface PivotValue {
    column: string;
    agg: string;
}

export function detectChartType(numRows: number): 'pie' | 'bar' | 'line' {
    if (numRows <= 5) return 'pie';
    if (numRows <= 20) return 'bar';
    return 'line';
}

function getDimensionLabel(row: any, rows: string[]): string {
    if (rows.length === 0) return 'All';
    return rows.map(r => String(row[r])).join(' - ');
}

export function buildEchartsOption(
    result: PivotResult | null,
    chartType: ChartType,
    rows: string[],
    values: PivotValue[]
): any {
    if (!result || result.rows.length === 0) {
        return {
            title: { text: 'No data', left: 'center', top: 'middle' }
        };
    }

    if (values.length === 0) {
        return {
            title: { text: 'No values to chart', left: 'center', top: 'middle' }
        };
    }

    let actualType = chartType === 'auto' ? detectChartType(result.rows.length) : chartType;

    // Scatter requires at least 2 measures
    if (actualType === 'scatter' && values.length < 2) {
        actualType = 'bar';
    }

    const measureKeys = values.map(v => `${v.agg}_${v.column}`);
    const dimensionLabels = result.rows.map(row => getDimensionLabel(row, rows));

    if (actualType === 'pie') {
        const firstMeasure = measureKeys[0];
        const pieData = result.rows.map((row, i) => ({
            name: dimensionLabels[i],
            value: row[firstMeasure]
        }));
        return {
            tooltip: { trigger: 'item' },
            legend: { type: 'scroll', orient: 'horizontal', bottom: 10 },
            series: [{
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
            }]
        };
    }

    if (actualType === 'scatter') {
        // Use first measure as X, second measure as Y
        const measureX = measureKeys[0];
        const measureY = measureKeys[1];

        const scatterData = result.rows.map(row => [row[measureX], row[measureY]]);

        return {
            tooltip: {
                trigger: 'item',
                formatter: function (params: any) {
                    return `X: ${params.value[0]}<br/>Y: ${params.value[1]}`;
                }
            },
            xAxis: {
                type: 'value',
                name: measureX,
                nameLocation: 'middle',
                nameGap: 30
            },
            yAxis: {
                type: 'value',
                name: measureY,
                nameLocation: 'middle',
                nameGap: 40
            },
            series: [{
                type: 'scatter',
                data: scatterData
            }]
        };
    }

    // Bar, Line, Area
    const seriesType = actualType === 'area' ? 'line' : actualType;
    const series = measureKeys.map(key => ({
        name: key,
        type: seriesType,
        areaStyle: actualType === 'area' ? {} : undefined,
        data: result.rows.map(row => row[key])
    }));

    return {
        tooltip: { trigger: 'axis' },
        legend: { data: measureKeys, bottom: 10 },
        xAxis: {
            type: 'category',
            data: dimensionLabels,
            axisLabel: {
                interval: 0,
                rotate: dimensionLabels.length > 10 ? 45 : 0
            }
        },
        yAxis: { type: 'value' },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        series
    };
}
