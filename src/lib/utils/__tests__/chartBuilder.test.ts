import { describe, it, expect } from 'vitest';
import { detectChartType, buildEchartsOption, type PivotResult, type PivotValue } from '../chartBuilder';

describe('chartBuilder utility', () => {
    describe('detectChartType', () => {
        it('detects pie for <= 5 rows', () => {
            expect(detectChartType(1)).toBe('pie');
            expect(detectChartType(5)).toBe('pie');
        });

        it('detects bar for > 5 and <= 20 rows', () => {
            expect(detectChartType(6)).toBe('bar');
            expect(detectChartType(20)).toBe('bar');
        });

        it('detects line for > 20 rows', () => {
            expect(detectChartType(21)).toBe('line');
            expect(detectChartType(100)).toBe('line');
        });
    });

    describe('buildEchartsOption', () => {
        it('returns "No data" if result is null or empty', () => {
            const opt = buildEchartsOption(null, 'auto', [], []);
            expect(opt.title?.text).toBe('No data');

            const opt2 = buildEchartsOption({ columns: [], rows: [] }, 'auto', [], []);
            expect(opt2.title?.text).toBe('No data');
        });

        it('returns "No values" if values array is empty', () => {
            const result: PivotResult = { columns: ['A'], rows: [{A: 1}] };
            const opt = buildEchartsOption(result, 'auto', ['A'], []);
            expect(opt.title?.text).toBe('No values to chart');
        });

        it('gracefully degrades scatter to bar if less than 2 measures', () => {
            const result: PivotResult = { columns: ['A', 'SUM_B'], rows: [{A: 'foo', SUM_B: 10}] };
            const values: PivotValue[] = [{ column: 'B', agg: 'SUM' }];
            const opt = buildEchartsOption(result, 'scatter', ['A'], values);

            // Should fallback to bar and have category axis
            expect(opt.series[0].type).toBe('bar');
            expect(opt.xAxis.type).toBe('category');
        });

        it('handles pie with multiple measures by using first measure', () => {
            const result: PivotResult = {
                columns: ['A', 'SUM_B', 'SUM_C'],
                rows: [{A: 'foo', SUM_B: 10, SUM_C: 20}]
            };
            const values: PivotValue[] = [
                { column: 'B', agg: 'SUM' },
                { column: 'C', agg: 'SUM' }
            ];

            const opt = buildEchartsOption(result, 'pie', ['A'], values);

            expect(opt.series[0].type).toBe('pie');
            expect(opt.series[0].data.length).toBe(1);
            expect(opt.series[0].data[0].name).toBe('foo');
            expect(opt.series[0].data[0].value).toBe(10); // used SUM_B
        });

        it('builds scatter correctly for 2 measures', () => {
            const result: PivotResult = {
                columns: ['A', 'SUM_B', 'AVG_C'],
                rows: [{A: 'foo', SUM_B: 10, AVG_C: 20}]
            };
            const values: PivotValue[] = [
                { column: 'B', agg: 'SUM' },
                { column: 'C', agg: 'AVG' }
            ];

            const opt = buildEchartsOption(result, 'scatter', ['A'], values);

            expect(opt.series[0].type).toBe('scatter');
            expect(opt.series[0].data[0].value).toEqual([10, 20]);
            expect(opt.series[0].data[0].rowData).toEqual({ A: 'foo', SUM_B: 10, AVG_C: 20 });
            expect(opt.xAxis.name).toBe('SUM_B');
            expect(opt.yAxis.name).toBe('AVG_C');
        });

        it('handles no rows (only values)', () => {
            const result: PivotResult = {
                columns: ['SUM_B'],
                rows: [{SUM_B: 100}]
            };
            const values: PivotValue[] = [
                { column: 'B', agg: 'SUM' }
            ];

            // Should produce 'All' label
            const opt = buildEchartsOption(result, 'bar', [], values);

            expect(opt.series[0].type).toBe('bar');
            expect(opt.xAxis.data).toEqual(['All']);
            expect(opt.series[0].data[0].value).toEqual(100);
            expect(opt.series[0].data[0].rowData).toEqual({ SUM_B: 100 });
        });
    });
});
