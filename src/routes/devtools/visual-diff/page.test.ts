import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from './+page.svelte';

vi.mock('$lib/workers/WorkerManager', () => ({
    WorkerManager: {
        getVisualDiff: vi.fn().mockResolvedValue({
            compare: vi.fn().mockResolvedValue({
                diffPixelCount: 0,
                totalPixels: 100,
                percentageChanged: 0,
                diffImageBuffer: new ArrayBuffer(0),
                boundingBox: null
            })
        })
    }
}));

describe('Visual Diff Page UI', () => {
    it('should render the visual diff components', () => {
        const { getByText, getByLabelText } = render(Page);
        expect(getByText('Visual Regression Diffing')).toBeTruthy();
        expect(getByText('Drop Expected Screenshot Here')).toBeTruthy();
        expect(getByText('Drop Actual Screenshot Here')).toBeTruthy();
        expect(getByText('Compare')).toBeTruthy();
    });
});
