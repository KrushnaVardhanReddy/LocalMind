import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/svelte';
import ChartViewer from '../ChartViewer.svelte';

beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

vi.mock('echarts', () => {
    return {
        init: vi.fn(() => ({
            setOption: vi.fn(),
            resize: vi.fn(),
            dispose: vi.fn(),
            clear: vi.fn()
        }))
    };
});

describe('ChartViewer', () => {
    it('renders without crashing when result is null', () => {
        const { container } = render(ChartViewer, { result: null });
        expect(container.querySelector('div')).toBeTruthy();
    });

    it('renders and calls echarts when result has data', () => {
        const mockResult = {
            columns: ['x', 'y'],
            rows: [
                { x: 1, y: 10 },
                { x: 2, y: 20 }
            ],
            executionTimeMs: 1
        };
        const { container } = render(ChartViewer, { result: mockResult });
        expect(container.querySelector('div')).toBeTruthy();
    });
});
