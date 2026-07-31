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

// Tableau-10 classic categorical palette
const TABLEAU_COLORS = [
    '#4E79A7', '#F28E2B', '#E15759', '#76B7B2',
    '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7',
    '#9C755F', '#BAB0AC'
];

// Premium ECharts base theme shared across all chart types
function baseTheme() {
    return {
        color: TABLEAU_COLORS,
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
            color: '#374151'
        },
        tooltip: {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            borderRadius: 10,
            padding: [10, 14],
            shadowBlur: 16,
            shadowColor: 'rgba(0,0,0,0.12)',
            shadowOffsetY: 4,
            textStyle: {
                color: '#111827',
                fontSize: 13,
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif"
            },
            extraCssText: 'box-shadow: 0 4px 24px 0 rgba(0,0,0,0.12); border-radius: 10px;'
        }
    };
}

function premiumAxisStyle(labelCount: number) {
    return {
        xAxis: {
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisTick: { show: false },
            axisLabel: {
                color: '#6b7280',
                fontSize: 12,
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
                interval: 0,
                rotate: labelCount > 10 ? 40 : 0
            },
            splitLine: { show: false }
        },
        yAxis: {
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                color: '#6b7280',
                fontSize: 12,
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif"
            },
            splitLine: {
                lineStyle: { type: 'dashed', color: '#f3f4f6', width: 1 }
            }
        },
        grid: {
            left: '2%',
            right: '3%',
            top: '8%',
            bottom: '12%',
            containLabel: true
        }
    };
}

function premiumLegend(data: string[]) {
    return {
        data,
        bottom: 4,
        itemWidth: 12,
        itemHeight: 12,
        borderRadius: 6,
        textStyle: {
            color: '#6b7280',
            fontSize: 12,
            fontFamily: "'Inter', 'Outfit', system-ui, sans-serif"
        }
    };
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
    const base = baseTheme();

    if (!result || result.rows.length === 0) {
        return {
            ...base,
            title: {
                text: 'No data',
                left: 'center',
                top: 'middle',
                textStyle: { color: '#9ca3af', fontSize: 15, fontWeight: 'normal' }
            }
        };
    }

    if (values.length === 0) {
        return {
            ...base,
            title: {
                text: 'No values to chart',
                left: 'center',
                top: 'middle',
                textStyle: { color: '#9ca3af', fontSize: 15, fontWeight: 'normal' }
            }
        };
    }

    let actualType = chartType === 'auto' ? detectChartType(result.rows.length) : chartType;

    // Scatter requires at least 2 measures
    if (actualType === 'scatter' && values.length < 2) {
        actualType = 'bar';
    }

    const measureKeys = values.map(v => `${v.agg}_${v.column}`);
    const dimensionLabels = result.rows.map(row => getDimensionLabel(row, rows));
    const axis = premiumAxisStyle(dimensionLabels.length);

    if (actualType === 'pie') {
        const firstMeasure = measureKeys[0];
        const pieData = result.rows.map((row, i) => ({
            name: dimensionLabels[i],
            value: row[firstMeasure]
        }));
        return {
            ...base,
            tooltip: {
                ...base.tooltip,
                trigger: 'item',
                formatter: (p: any) => `
                    <div style="font-weight:600;margin-bottom:4px">${p.name}</div>
                    <div>${p.marker} ${firstMeasure}: <b>${Number(p.value).toLocaleString()}</b></div>
                    <div style="color:#9ca3af;font-size:11px">${p.percent}% of total</div>
                `
            },
            legend: {
                ...premiumLegend(dimensionLabels),
                type: 'scroll',
                orient: 'horizontal'
            },
            series: [{
                type: 'pie',
                radius: ['35%', '68%'],
                padAngle: 3,
                itemStyle: { borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
                label: {
                    show: true,
                    formatter: '{b}: {d}%',
                    fontSize: 12,
                    color: '#374151'
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 16,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0,0,0,0.25)'
                    },
                    scale: true,
                    scaleSize: 5
                },
                data: pieData
            }]
        };
    }

    if (actualType === 'scatter') {
        const measureX = measureKeys[0];
        const measureY = measureKeys[1];
        const scatterData = result.rows.map(row => [row[measureX], row[measureY]]);
        return {
            ...base,
            tooltip: {
                ...base.tooltip,
                trigger: 'item',
                formatter: (p: any) =>
                    `<b>${measureX}</b>: ${p.value[0].toLocaleString()}<br/><b>${measureY}</b>: ${p.value[1].toLocaleString()}`
            },
            ...axis,
            xAxis: {
                ...axis.xAxis,
                type: 'value',
                name: measureX,
                nameLocation: 'middle',
                nameGap: 32,
                nameTextStyle: { color: '#6b7280', fontSize: 12 }
            },
            yAxis: {
                ...axis.yAxis,
                type: 'value',
                name: measureY,
                nameLocation: 'middle',
                nameGap: 44,
                nameTextStyle: { color: '#6b7280', fontSize: 12 }
            },
            series: [{
                type: 'scatter',
                symbolSize: 9,
                itemStyle: { opacity: 0.82 },
                emphasis: { itemStyle: { shadowBlur: 10, opacity: 1 } },
                data: scatterData
            }]
        };
    }

    // Bar, Line, Area — premium treatment
    const seriesType = actualType === 'area' ? 'line' : actualType;
    const series = measureKeys.map((key, idx) => ({
        name: key,
        type: seriesType,
        smooth: seriesType === 'line',
        areaStyle: actualType === 'area' ? {
            opacity: 0.18,
            color: TABLEAU_COLORS[idx % TABLEAU_COLORS.length]
        } : undefined,
        itemStyle: { borderRadius: actualType === 'bar' ? [4, 4, 0, 0] : 0 },
        emphasis: {
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.2)' }
        },
        data: result.rows.map(row => row[key])
    }));

    return {
        ...base,
        tooltip: { ...base.tooltip, trigger: 'axis' },
        legend: premiumLegend(measureKeys),
        ...axis,
        xAxis: {
            ...axis.xAxis,
            type: 'category',
            data: dimensionLabels
        },
        yAxis: {
            ...axis.yAxis,
            type: 'value'
        },
        series
    };
}
