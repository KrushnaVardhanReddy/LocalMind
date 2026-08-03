import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CanvasEditor from './CanvasEditor.svelte';

describe('CanvasEditor Component', () => {
    beforeEach(() => {
        // Mock URL.createObjectURL and revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
        global.URL.revokeObjectURL = vi.fn();

        // Mock prompt
        global.prompt = vi.fn(() => 'test text');
    });

    it('renders the toolbar and canvas', () => {
        const { container } = render(CanvasEditor, { props: { imageFile: null } });

        expect(screen.getByText('Select')).toBeDefined();
        expect(screen.getByText('Rectangle')).toBeDefined();
        expect(screen.getByText('Circle')).toBeDefined();
        expect(screen.getByText('Arrow')).toBeDefined();
        expect(screen.getByText('Text')).toBeDefined();
        expect(screen.getByText('Blur')).toBeDefined();
        expect(screen.getByText('Clear All')).toBeDefined();
        expect(screen.getByText('Export')).toBeDefined();

        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
    });

    it('changes tool on button click', async () => {
        render(CanvasEditor, { props: { imageFile: null } });

        const rectButton = screen.getByText('Rectangle');
        await fireEvent.click(rectButton);

        // Assert that the button has the active class style
        expect(rectButton.className).toContain('text-blue-700');
    });

    it('calls toDataURL on export', async () => {
        const { container } = render(CanvasEditor, { props: { imageFile: null } });

        const canvas = container.querySelector('canvas');
        if (canvas) {
            canvas.toDataURL = vi.fn(() => 'data:image/png;base64,test');
        }

        // Mock document.createElement('a') to prevent navigation error during tests
        const mockAnchor = {
             href: '',
             download: '',
             click: vi.fn()
        };
        const origCreateElement = document.createElement.bind(document);
        document.createElement = vi.fn((tagName) => {
            if (tagName === 'a') return mockAnchor as any;
            return origCreateElement(tagName);
        });

        const exportButton = screen.getByText('Export');
        await fireEvent.click(exportButton);

        expect(canvas?.toDataURL).toHaveBeenCalledWith('image/png');
        expect(mockAnchor.click).toHaveBeenCalled();

        // Restore document.createElement
        document.createElement = origCreateElement;
    });
});
