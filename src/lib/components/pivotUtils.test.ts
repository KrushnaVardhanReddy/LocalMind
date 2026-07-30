import { describe, it, expect } from 'vitest';
import { computeGrandTotals, sortRows } from './pivotUtils';

describe('pivotUtils', () => {
    describe('computeGrandTotals', () => {
        const rows = [
            { region: 'North', sales: 100, profit: 10 },
            { region: 'South', sales: 200, profit: 20 },
            { region: 'East', sales: null, profit: 30 }
        ];

        it('should correctly compute SUM totals', () => {
            const columns = ['region', 'sales'];
            const totals = computeGrandTotals(rows, columns, ['region'], [{ column: 'sales', agg: 'SUM' }]);
            expect(totals).toEqual({
                region: 'Grand Total',
                sales: 300
            });
        });

        it('should correctly compute AVG totals', () => {
            const columns = ['region', 'sales'];
            const totals = computeGrandTotals(rows, columns, ['region'], [{ column: 'sales', agg: 'AVG' }]);
            expect(totals).toEqual({
                region: 'Grand Total',
                sales: 150 // (100 + 200) / 2
            });
        });

        it('should correctly compute MIN and MAX totals', () => {
            const minMaxRows = [
                { sales_min: 100, sales_max: 150 },
                { sales_min: 200, sales_max: 250 }
            ];
            const columns = ['sales_min', 'sales_max'];
            const totals = computeGrandTotals(minMaxRows, columns, [], [
                { column: 'sales', agg: 'MIN' },
                { column: 'sales', agg: 'MAX' }
            ]);
            expect(totals).toEqual({
                sales_min: 100,
                sales_max: 250
            });
        });

        it('should put empty string for second dimension column', () => {
            const multiDimRows = [
                { cat: 'A', sub: 'x', val: 10 },
                { cat: 'B', sub: 'y', val: 20 }
            ];
            const columns = ['cat', 'sub', 'val'];
            const totals = computeGrandTotals(multiDimRows, columns, ['cat', 'sub'], [{ column: 'val', agg: 'SUM' }]);
            expect(totals).toEqual({
                cat: 'Grand Total',
                sub: '',
                val: 30
            });
        });
    });

    describe('sortRows', () => {
        const rows = [
            { id: 1, name: 'Zebra', val: 10 },
            { id: 2, name: 'Apple', val: null },
            { id: 3, name: 'Mango', val: 5 }
        ];

        it('should sort numbers ascending (nulls last)', () => {
            const sorted = sortRows(rows, 'val', true);
            expect(sorted.map(r => r.id)).toEqual([3, 1, 2]);
        });

        it('should sort numbers descending (nulls first)', () => {
            const sorted = sortRows(rows, 'val', false);
            expect(sorted.map(r => r.id)).toEqual([2, 1, 3]);
        });

        it('should sort strings ascending', () => {
            const sorted = sortRows(rows, 'name', true);
            expect(sorted.map(r => r.id)).toEqual([2, 3, 1]);
        });
    });
});
