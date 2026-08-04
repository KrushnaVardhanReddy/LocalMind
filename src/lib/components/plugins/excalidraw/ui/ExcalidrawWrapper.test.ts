import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import ExcalidrawWrapper from './ExcalidrawWrapper.svelte';

vi.mock('react', async () => {
    return {
        createElement: vi.fn(),
        useState: vi.fn(),
        useEffect: vi.fn(),
        useRef: vi.fn(),
        useCallback: vi.fn(),
    };
});

vi.mock('react-dom/client', () => {
    return {
        createRoot: vi.fn(() => ({
            render: vi.fn(),
            unmount: vi.fn()
        }))
    };
});

vi.mock('@excalidraw/excalidraw', () => {
    return {
        Excalidraw: vi.fn()
    };
});

describe('ExcalidrawWrapper', () => {
    it('should render the wrapper container', () => {
        const { container } = render(ExcalidrawWrapper, {
            initialData: null,
            onChange: vi.fn()
        });

        // The container div should be rendered
        expect(container.querySelector('div')).toBeTruthy();
        expect(container.querySelector('div')?.className).toContain('w-full');
    });
});
