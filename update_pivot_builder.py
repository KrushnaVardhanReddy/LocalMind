import re

with open('src/lib/components/PivotBuilder.svelte', 'r') as f:
    content = f.read()

# Add imports
imports = """import { buildEchartsOption, type ChartType } from '$lib/utils/chartBuilder';
    import { computeGrandTotals, sortRows } from './pivotUtils';"""
content = content.replace("import { buildEchartsOption, type ChartType } from '$lib/utils/chartBuilder';", imports)

# Add State variables
state_vars = """    let dragItem = $state<{ type: string, column: string, index?: number } | null>(null);

    let currentPage = $state(1);
    const PAGE_SIZE = 1000;
    let sortCol = $state<string | null>(null);
    let sortAsc = $state(true);"""
content = content.replace("    let dragItem = $state<{ type: string, column: string, index?: number } | null>(null);", state_vars)

# Reset pagination on config change (in generateAndExecuteSQL)
# Actually, better to reset in the $effect that reacts to tableName, and also reset when query executes.
# Let's add it to generateAndExecuteSQL finally block maybe, or right before query.
content = content.replace("        isExecuting = true;", "        isExecuting = true;\n        currentPage = 1;\n        sortCol = null;")

# Add derived blocks for pagination, sorting and grandTotals
derived_blocks = """    const aggregations = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'];

    let sortedRows = $derived(result && result.rows ? sortRows(result.rows, sortCol, sortAsc) : []);
    let paginatedRows = $derived(sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
    let grandTotals = $derived(result && result.rows && result.columns ? computeGrandTotals(result.rows, result.columns, rows, values) : {});
"""
content = content.replace("    const aggregations = ['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'];", derived_blocks)

with open('src/lib/components/PivotBuilder.svelte', 'w') as f:
    f.write(content)
