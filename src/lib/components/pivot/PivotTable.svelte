<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { computeGrandTotals } from '../pivotUtils';
    import { createGrid, type GridApi, type GridOptions, type ColDef, type ValueFormatterParams } from 'ag-grid-community';

    // Core CSS
    import 'ag-grid-community/styles/ag-grid.css';
    import 'ag-grid-community/styles/ag-theme-quartz.css';

    let {
        result,
        rowsConfig,
        valuesConfig,
        pageSize = 100
    } = $props<{
        result: any;
        rowsConfig: any[];
        valuesConfig: any[];
        pageSize?: number;
    }>();

    let gridContainer = $state<HTMLElement | null>(null);
    let gridApi = $state<GridApi | null>(null);
    let themeClass = $state('ag-theme-quartz');
    let observer: MutationObserver | null = null;

    let grandTotals = $derived(result && result.rows && result.columns ? computeGrandTotals(result.rows, result.columns, rowsConfig, valuesConfig) : {});

    // Manage theme based on dark mode class on document element
    function updateTheme() {
        if (typeof document !== 'undefined') {
            const isDark = document.documentElement.classList.contains('dark');
            themeClass = isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz';
        }
    }

    onMount(() => {
        updateTheme();

        if (typeof document !== 'undefined') {
            observer = new MutationObserver(() => {
                updateTheme();
            });
            observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }
    });

    onDestroy(() => {
        if (observer) {
            observer.disconnect();
        }
        if (gridApi) {
            gridApi.destroy();
        }
    });

    // Create or update grid when container and result are ready
    $effect(() => {
        if (gridContainer && !gridApi) {
            const gridOptions: GridOptions = {
                columnDefs: [],
                rowData: [],
                pagination: true,
                paginationPageSize: pageSize,
                paginationPageSizeSelector: false,
                defaultColDef: {
                    sortable: true,
                    flex: 1,
                    minWidth: 100,
                    resizable: true
                },
                suppressCellFocus: true,
                domLayout: 'normal'
            };

            gridApi = createGrid(gridContainer, gridOptions);
        }
    });

    // Update grid when result changes
    $effect(() => {
        if (gridApi && result && result.columns && result.rows) {
            const colDefs: ColDef[] = result.columns.map((col: string) => {
                return {
                    field: col,
                    headerName: col,
                    valueFormatter: (params: ValueFormatterParams) => {
                        if (params.value === null || params.value === undefined) return '';
                        if (typeof params.value === 'number') {
                            return params.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
                        }
                        return params.value;
                    }
                };
            });

            gridApi.setGridOption('columnDefs', colDefs);
            gridApi.setGridOption('rowData', result.rows);

            // Add pinned bottom row for grand totals
            if (Object.keys(grandTotals).length > 0) {
                const totalsRow = { ...grandTotals };

                // Optional: find first string column to put "Grand Total" label
                const firstCol = result.columns[0];
                if (firstCol && totalsRow[firstCol] === undefined) {
                    totalsRow[firstCol] = 'Grand Total';
                }

                gridApi.setGridOption('pinnedBottomRowData', [totalsRow]);
            } else {
                gridApi.setGridOption('pinnedBottomRowData', []);
            }
        } else if (gridApi) {
            gridApi.setGridOption('columnDefs', []);
            gridApi.setGridOption('rowData', []);
            gridApi.setGridOption('pinnedBottomRowData', []);
        }
    });

    $effect(() => {
        if (gridApi) {
            gridApi.setGridOption('paginationPageSize', pageSize);
        }
    });

</script>

<div class="flex flex-col h-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm">
    {#if result && result.rows.length > 0}
        <div class="flex-1 w-full relative">
            <!-- Ensure container has height/width -->
            <div
                bind:this={gridContainer}
                class="{themeClass} absolute inset-0"
            ></div>
        </div>
        <div class="flex items-center justify-between p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg text-xs text-gray-500 dark:text-gray-400 z-10 relative">
            <div class="flex items-center gap-2">
                <span>{result.rows.length.toLocaleString()} total rows</span>
                <span class="text-gray-300 dark:text-gray-600">|</span>
                <span class="font-mono">{result.executionTimeMs?.toFixed(1) || 0}ms</span>
            </div>
        </div>
    {:else}
        <div class="flex-1 flex items-center justify-center p-8 text-gray-400 dark:text-gray-500 text-sm">
            <div class="text-center">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                No data to display. Drop columns into rows or values to build your pivot.
            </div>
        </div>
    {/if}
</div>

<style>
    /* Customization for the dark mode */
    :global(.ag-theme-quartz-dark) {
        --ag-background-color: #1f2937; /* gray-800 */
        --ag-header-background-color: #374151; /* gray-700 */
        --ag-border-color: #4b5563; /* gray-600 */
        --ag-row-border-color: #374151; /* gray-700 */
        --ag-odd-row-background-color: #111827; /* gray-900 */
        --ag-row-hover-color: #1e3a8a; /* blue-900/20 approx */
        --ag-foreground-color: #f3f4f6; /* gray-100 */
        --ag-header-foreground-color: #e5e7eb; /* gray-200 */
    }
</style>