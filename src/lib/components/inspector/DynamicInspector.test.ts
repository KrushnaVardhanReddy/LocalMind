import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import DynamicInspector from './DynamicInspector.svelte';
import { workspaceStore } from '$lib/stores/workspace.store.svelte';

describe('DynamicInspector', () => {
    beforeEach(() => {
        cleanup();
        workspaceStore.closeInspector();
    });

    it('does not render anything when isOpen is false', () => {
        render(DynamicInspector);
        const aside = screen.queryByTestId('inspector-aside');
        expect(aside).toBeNull();
    });

    it('renders the fallback empty state when isOpen is true but no component is selected', () => {
        workspaceStore.openInspector('');
        render(DynamicInspector);
        const emptyState = screen.getByTestId('inspector-empty');
        expect(emptyState).toBeTruthy();
        expect(screen.getByText('No details to show')).toBeTruthy();
    });

    it('renders the fallback empty state when isOpen is true but componentName is null', () => {
        workspaceStore.inspectorState.isOpen = true;
        workspaceStore.inspectorState.componentName = null;
        render(DynamicInspector);
        const emptyState = screen.getByTestId('inspector-empty');
        expect(emptyState).toBeTruthy();
    });

    it('renders a specific component when componentName is valid and isOpen is true', () => {
        workspaceStore.openInspector('DemoPanel', { title: 'Test Title', message: 'Test Message' });
        render(DynamicInspector);

        // DemoPanel specific content
        expect(screen.getByText('Demo Panel')).toBeTruthy();
        expect(screen.getByText('Test Title')).toBeTruthy();
        expect(screen.getByText('Test Message')).toBeTruthy();
    });

    it('renders an error message when an unknown component is requested', () => {
        workspaceStore.openInspector('UnknownComponent');
        render(DynamicInspector);

        expect(screen.getByText('Component not found:')).toBeTruthy();
        expect(screen.getByText('UnknownComponent')).toBeTruthy();
    });
});
