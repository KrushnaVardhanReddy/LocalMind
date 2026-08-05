import { describe, it, expect } from 'vitest';
import { RegexWorker } from './regex.worker';

describe('RegexWorker', () => {
    it('evaluates simple regex correctly', async () => {
        const worker = new RegexWorker();
        const result = await worker.evaluate('test', 'g', 'this is a test, another test');

        expect(result.matches.length).toBe(2);
        expect(result.matches[0].match).toBe('test');
        expect(result.matches[0].start).toBe(10);
        expect(result.matches[0].end).toBe(14);

        expect(result.matches[1].match).toBe('test');
        expect(result.matches[1].start).toBe(24);
        expect(result.matches[1].end).toBe(28);
    });

    it('extracts named capture groups', async () => {
        const worker = new RegexWorker();
        const result = await worker.evaluate('(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', 'g', 'Today is 2023-10-25');

        expect(result.matches.length).toBe(1);
        expect(result.matches[0].groups).toEqual({
            year: '2023',
            month: '10',
            day: '25'
        });
        expect(result.matches[0].groupIndices).toEqual({
            1: '2023',
            2: '10',
            3: '25'
        });
    });

    it('handles invalid regex syntax gracefully', async () => {
        const worker = new RegexWorker();
        const result = await worker.evaluate('(', 'g', 'test');

        expect(result.matches.length).toBe(0);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Invalid regular expression');
    });
});
