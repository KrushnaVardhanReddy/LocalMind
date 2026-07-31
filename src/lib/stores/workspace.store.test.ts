import { describe, it, expect, beforeEach } from 'vitest';
import { workspaceStore } from './workspace.store.svelte';

describe('WorkspaceStore', () => {
    beforeEach(() => {
        workspaceStore.setActiveWorkspace(null as any);
        workspaceStore.closeInspector();
        workspaceStore.commands.clear();
    });

    it('sets active workspace', () => {
        const ws = { id: 'test', type: 'analytics' as const, title: 'Test WS' };
        workspaceStore.setActiveWorkspace(ws);
        expect(workspaceStore.activeWorkspace).toEqual(ws);
    });

    it('opens and closes inspector', () => {
        workspaceStore.openInspector('TestComponent', { foo: 'bar' });
        expect(workspaceStore.inspectorState.isOpen).toBe(true);
        expect(workspaceStore.inspectorState.componentName).toBe('TestComponent');
        expect(workspaceStore.inspectorState.props).toEqual({ foo: 'bar' });

        workspaceStore.closeInspector();
        expect(workspaceStore.inspectorState.isOpen).toBe(false);
    });

    it('registers and unregisters commands', () => {
        let called = false;
        workspaceStore.registerCommand('cmd1', 'Test Command', () => { called = true; });
        expect(workspaceStore.commands.has('cmd1')).toBe(true);
        expect(workspaceStore.commands.get('cmd1')?.name).toBe('Test Command');

        workspaceStore.commands.get('cmd1')?.callback();
        expect(called).toBe(true);

        workspaceStore.unregisterCommand('cmd1');
        expect(workspaceStore.commands.has('cmd1')).toBe(false);
    });
});
