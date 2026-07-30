export function computeGrandTotals(
    rows: any[],
    columns: string[],
    rowsShelf: string[],
    valuesShelf: { column: string, agg: string }[]
): Record<string, any> {
    if (!rows || rows.length === 0) return {};

    const totals: Record<string, any> = {};
    let firstDimFound = false;

    for (const col of columns) {
        if (rowsShelf.includes(col)) {
            if (!firstDimFound) {
                totals[col] = 'Grand Total';
                firstDimFound = true;
            } else {
                totals[col] = '';
            }
            continue;
        }

        // Determine aggregation type for this column
        let agg = 'SUM'; // default
        if (valuesShelf.length === 1) {
            agg = valuesShelf[0].agg;
        } else if (valuesShelf.length > 1) {
            // First check if the column string explicitly mentions the aggregation
            const colLower = col.toLowerCase();
            let matchedAgg = null;
            let bestMatch = null;
            for (const v of valuesShelf) {
                const expr = `${v.agg}("${v.column}")`.toLowerCase();
                const expr2 = `${v.agg}_${v.column}`.toLowerCase();
                const aggStr = v.agg.toLowerCase();
                if (colLower.includes(expr) || colLower.includes(expr2)) {
                    matchedAgg = v.agg;
                    break;
                } else if (colLower.includes(aggStr) && colLower.includes(v.column.toLowerCase())) {
                    bestMatch = v.agg;
                } else if (colLower.includes(v.column.toLowerCase()) && !bestMatch) {
                    bestMatch = v.agg;
                }
            }
            if (matchedAgg) {
                agg = matchedAgg;
            } else if (bestMatch) {
                agg = bestMatch;
            }
        }

        let sum = 0;
        let count = 0;
        let min = Infinity;
        let max = -Infinity;

        for (const row of rows) {
            const val = row[col];
            if (typeof val === 'number') {
                sum += val;
                count++;
                if (val < min) min = val;
                if (val > max) max = val;
            }
        }

        if (count === 0) {
            totals[col] = null;
            continue;
        }

        if (agg === 'SUM' || agg === 'COUNT') {
            totals[col] = sum;
        } else if (agg === 'AVG') {
            totals[col] = sum / count;
        } else if (agg === 'MIN') {
            totals[col] = min !== Infinity ? min : null;
        } else if (agg === 'MAX') {
            totals[col] = max !== -Infinity ? max : null;
        } else {
            totals[col] = sum;
        }
    }

    return totals;
}

export function sortRows(rows: any[], sortCol: string | null, sortAsc: boolean): any[] {
    if (!sortCol || !rows) return rows;

    return [...rows].sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return sortAsc ? 1 : -1;
        if (valB === null || valB === undefined) return sortAsc ? -1 : 1;

        if (typeof valA === 'number' && typeof valB === 'number') {
            return sortAsc ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();

        if (strA < strB) return sortAsc ? -1 : 1;
        if (strA > strB) return sortAsc ? 1 : -1;
        return 0;
    });
}
