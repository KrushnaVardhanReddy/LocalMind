import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import MermaidRenderer from '../MermaidRenderer.svelte';
import '@testing-library/jest-dom/vitest';
import mermaid from 'mermaid';

// Mock mermaid completely
vi.mock('mermaid', () => ({
    default: {
        initialize: vi.fn(),
        render: vi.fn().mockResolvedValue({ svg: '<svg data-testid="mock-svg"></svg>' })
    }
}));

describe('MermaidRenderer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes mermaid on mount', () => {
        render(MermaidRenderer, { code: '' });
        expect(mermaid.initialize).toHaveBeenCalledWith(expect.objectContaining({ startOnLoad: false }));
    });

    it('renders placeholder when code is empty', () => {
        render(MermaidRenderer, { code: '' });
        expect(screen.getByText('Diagram preview will appear here')).toBeInTheDocument();
    });

    it('calls mermaid.render when code is provided', async () => {
        const { component } = render(MermaidRenderer, { code: 'graph TD; A-->B;' });

        await waitFor(() => {
            expect(mermaid.render).toHaveBeenCalledWith(
                expect.stringContaining('mermaid-'),
                'graph TD; A-->B;'
            );
        });
    });

    it('displays error message when mermaid throws', async () => {
        const mockError = new Error('Parse error');
        vi.mocked(mermaid.render).mockRejectedValueOnce(mockError);

        render(MermaidRenderer, { code: 'invalid code' });

        await waitFor(() => {
            expect(screen.getByText('Parse error')).toBeInTheDocument();
        });
    });
});
