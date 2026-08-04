export type ChartType = 'auto' | 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'treemap' | 'heatmap';

export interface PivotResult {
    columns: string[];
    rows: any[];
    executionTimeMs?: number;
}

export interface PivotValue {
    column: string;
    agg: string;
}

// Named palette presets — see spec section 4.2
export const PALETTES: Record<string, string[]> = {
    Tableau:    ['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F','#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC'],
    Material:   ['#2196F3','#FF5722','#4CAF50','#9C27B0','#FF9800','#00BCD4','#F44336','#3F51B5','#009688','#FFEB3B'],
    Pastel:     ['#AEC6CF','#FFD1DC','#B5EAD7','#FFDAC1','#C7CEEA','#E2B8B8','#D4E8C2','#F7D59C','#C9C4E5','#FDE8C8'],
    Ocean:      ['#005F73','#0A9396','#94D2BD','#E9D8A6','#EE9B00','#CA6702','#BB3E03','#AE2012','#9B2226','#001219'],
    Vibrant:    ['#E63946','#F4A261','#2A9D8F','#264653','#E9C46A','#A8DADC','#457B9D','#1D3557','#F1FAEE','#6D6875'],
    Monochrome: ['#0D1B2A','#1B2A3B','#2E4057','#3D5A80','#5A7FA0','#88A8BE','#B0C8D9','#D0DDE8','#E8EFF4','#F5F8FA'],
};

export const DEFAULT_PALETTE = 'Tableau';

// Premium ECharts base theme shared across all chart types
function baseTheme(colors: string[], darkMode: boolean) {
    const text = darkMode ? '#e5e7eb' : '#374151';
    return {
        color: colors,
        backgroundColor: 'transparent',
        toolbox: {
            show: true,
            right: 20,
            top: 0,
            feature: {
                saveAsImage: {
                    show: true,
                    name: 'LocalMind_Chart',
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                    pixelRatio: 2,
                    title: 'Save Image'
                }
            },
            iconStyle: {
                borderColor: darkMode ? '#9ca3af' : '#6b7280'
            }
        },
        textStyle: {
            fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
            color: text
        },
        tooltip: {
            backgroundColor: darkMode ? '#1f2937' : '#ffffff',
            borderColor: darkMode ? '#374151' : '#e5e7eb',
            borderWidth: 1,
            borderRadius: 10,
            padding: [10, 14],
            shadowBlur: 16,
            shadowColor: 'rgba(0,0,0,0.25)',
            shadowOffsetY: 4,
            textStyle: {
                color: darkMode ? '#f9fafb' : '#111827',
                fontSize: 13,
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif"
            },
            extraCssText: `box-shadow: 0 4px 24px 0 rgba(0,0,0,${darkMode ? '0.4' : '0.12'}); border-radius: 10px;`
        }
    };
}

function premiumAxisStyle(labelCount: number, darkMode: boolean) {
    const labelColor = darkMode ? '#9ca3af' : '#6b7280';
    const axisLineColor = darkMode ? '#374151' : '#e5e7eb';
    const splitLineColor = darkMode ? '#1f2937' : '#f3f4f6';
    return {
        xAxis: {
            axisLine: { lineStyle: { color: axisLineColor } },
            axisTick: { show: false },
            axisLabel: {
                color: labelColor,
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
                color: labelColor,
                fontSize: 12,
                fontFamily: "'Inter', 'Outfit', system-ui, sans-serif"
            },
            splitLine: {
                lineStyle: { type: 'dashed', color: splitLineColor, width: 1 }
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

function premiumLegend(data: string[], darkMode: boolean) {
    return {
        data,
        bottom: 4,
        itemWidth: 12,
        itemHeight: 12,
        borderRadius: 6,
        textStyle: {
            color: darkMode ? '#9ca3af' : '#6b7280',
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

function deepMerge(target: any, source: any): any {
    if (target === null || target === undefined) return source;
    if (source === null || source === undefined) return target;
    
    if (Array.isArray(target) && Array.isArray(source)) {
        return source; // For arrays in ECharts, we usually overwrite (like series array) or we could merge by index. Overwrite is safer for raw JSON overrides.
    }
    
    if (typeof target === 'object' && typeof source === 'object') {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            result[key] = deepMerge(result[key], source[key]);
        }
        return result;
    }
    
    return source;
}

function getDimensionLabel(row: any, rows: string[]): string {
    if (rows.length === 0) return 'All';
    return rows.map(r => String(row[r])).join(' - ');
}

export function buildEchartsOption(
    result: PivotResult | null,
    chartType: ChartType,
    rows: string[],
    values: PivotValue[],
    colors: string[] = PALETTES[DEFAULT_PALETTE],
    darkMode: boolean = false,
    overrides: any = null
): any {
    const base = baseTheme(colors, darkMode);

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

    // measureKeys typically matches values but in a PIVOT the query returns expanded columns.
    // Spec says: Values shelf defines measures, Columns shelf defines the pivot headers.
    // `result.columns` will contain the dimension columns + pivoted measure columns.
    // If we have rows, the first N columns of result.columns match the row definitions.
    const measureKeys = result.columns.filter(c => !rows.includes(c));

    const dimensionLabels = result.rows.map(row => getDimensionLabel(row, rows));
    const axis = premiumAxisStyle(dimensionLabels.length, darkMode);

    if (actualType === 'pie') {
        const firstMeasure = measureKeys[0];
        const pieData = result.rows.map((row, i) => ({
            name: dimensionLabels[i],
            value: Number(row[firstMeasure]),
            rowData: row // attach for cross-filtering
        }));
        return {
            ...base,
            tooltip: {
                ...base.tooltip,
                trigger: 'item',
                formatter: (p: any) => `
                    <div style="font-weight:600;margin-bottom:4px;color:${darkMode ? '#f9fafb' : '#111827'}">${p.name}</div>
                    <div>${p.marker} ${firstMeasure}: <b>${Number(p.value).toLocaleString()}</b></div>
                    <div style="color:${darkMode ? '#9ca3af' : '#6b7280'};font-size:11px">${p.percent}% of total</div>
                `
            },
            legend: {
                ...premiumLegend(dimensionLabels, darkMode),
                type: 'scroll',
                orient: 'horizontal'
            },
            series: [{
                type: 'pie',
                radius: ['35%', '68%'],
                padAngle: 3,
                itemStyle: { borderRadius: 6, borderWidth: 2, borderColor: darkMode ? '#1f2937' : '#fff' },
                label: {
                    show: true,
                    formatter: '{b}: {d}%',
                    fontSize: 12,
                    color: darkMode ? '#e5e7eb' : '#374151'
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
        const scatterData = result.rows.map(row => ({
            value: [Number(row[measureX]), Number(row[measureY])],
            rowData: row // attach for cross-filtering
        }));
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

    if (actualType === 'treemap') {
        const firstMeasure = measureKeys[0];
        const treemapData = result.rows.map((row, i) => ({
            name: dimensionLabels[i],
            value: Number(row[firstMeasure]),
            rowData: row // attach for cross-filtering
        }));
        return {
            ...base,
            tooltip: {
                ...base.tooltip,
                trigger: 'item',
                formatter: (p: any) => `
                    <div style="font-weight:600;margin-bottom:4px;color:${darkMode ? '#f9fafb' : '#111827'}">${p.name}</div>
                    <div>${p.marker} ${firstMeasure}: <b>${Number(p.value).toLocaleString()}</b></div>
                `
            },
            series: [{
                type: 'treemap',
                data: treemapData,
                roam: false,
                nodeClick: false, // Handle via generic click event
                breadcrumb: { show: false },
                itemStyle: {
                    borderColor: darkMode ? '#1f2937' : '#fff',
                    borderWidth: 1,
                    gapWidth: 1
                }
            }]
        };
    }

    if (actualType === 'heatmap') {
        const xDim = rows[0] || 'All';
        const yDim = rows[1] || ''; // Need 2 dimensions for good heatmap
        const measure = measureKeys[0];

        // Format data: [xIndex, yIndex, value]
        const xLabels = Array.from(new Set(result.rows.map(r => r[xDim])));
        const yLabels = yDim ? Array.from(new Set(result.rows.map(r => r[yDim]))) : ['All'];

        const heatmapData = result.rows.map(row => {
            const xIndex = xLabels.indexOf(row[xDim]);
            const yIndex = yDim ? yLabels.indexOf(row[yDim]) : 0;
            return {
                value: [xIndex, yIndex, Number(row[measure])],
                rowData: row // attach for cross-filtering
            };
        });

        return {
            ...base,
            tooltip: {
                ...base.tooltip,
                trigger: 'item',
                formatter: (p: any) => `
                    <div style="font-weight:600;margin-bottom:4px;color:${darkMode ? '#f9fafb' : '#111827'}">
                        ${xLabels[p.value[0]]} ${yDim ? ' - ' + yLabels[p.value[1]] : ''}
                    </div>
                    <div>${p.marker} ${measure}: <b>${Number(p.value[2]).toLocaleString()}</b></div>
                `
            },
            grid: {
                ...axis.grid,
                right: '10%' // make room for visual map
            },
            xAxis: {
                ...axis.xAxis,
                type: 'category',
                data: xLabels,
                splitArea: { show: true }
            },
            yAxis: {
                ...axis.yAxis,
                type: 'category',
                data: yLabels,
                splitArea: { show: true }
            },
            visualMap: {
                min: Math.min(...result.rows.map(r => Number(r[measure]))),
                max: Math.max(...result.rows.map(r => Number(r[measure]))),
                calculable: true,
                orient: 'vertical',
                right: '2%',
                bottom: '15%',
                inRange: {
                    color: [colors[0] + '33', colors[0]] // light to solid base color
                },
                textStyle: { color: darkMode ? '#9ca3af' : '#6b7280' }
            },
            series: [{
                type: 'heatmap',
                data: heatmapData,
                label: { show: false },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
    }

    // Bar, Line, Area — premium treatment
    const seriesType = actualType === 'area' ? 'line' : actualType;
    const series = measureKeys.map((key, idx) => ({
        name: key,
        type: seriesType,
        smooth: seriesType === 'line',
        itemStyle: { borderRadius: actualType === 'bar' ? [4, 4, 0, 0] : 0 },
        emphasis: {
            itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.2)' }
        },
        data: result.rows.map(row => ({
            value: Number(row[key]),
            rowData: row // attach for cross-filtering
        })),
        areaStyle: actualType === 'area' ? {
            opacity: 0.18,
            color: colors[idx % colors.length]
        } : undefined
    }));

    const baseOption = {
        ...base,
        tooltip: { ...base.tooltip, trigger: 'axis' },
        legend: premiumLegend(measureKeys, darkMode),
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

    return overrides ? deepMerge(baseOption, overrides) : baseOption;
}
