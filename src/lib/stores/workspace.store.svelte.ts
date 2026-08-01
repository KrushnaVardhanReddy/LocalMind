import type { WorkspaceContext, InspectorState, WorkspaceStoreContract } from '../../../docs/contracts/workspace_store_contract';

class WorkspaceStore implements WorkspaceStoreContract {
    activeWorkspace: WorkspaceContext | null = $state(null);
    inspectorState: InspectorState = $state({
        componentName: null,
        props: {},
        isOpen: false
    });

    commands = $state<Map<string, {name: string, callback: () => void}>>(new Map());

    setActiveWorkspace(workspace: WorkspaceContext): void {
        this.activeWorkspace = workspace;
    }

    openInspector(componentName: string, props: Record<string, any> = {}): void {
        this.inspectorState = {
            componentName,
            props,
            isOpen: true
        };
    }

    closeInspector(): void {
        this.inspectorState.isOpen = false;
    }

    registerCommand(id: string, name: string, callback: () => void): void {
        const newCommands = new Map(this.commands);
        newCommands.set(id, { name, callback });
        this.commands = newCommands;
    }

    unregisterCommand(id: string): void {
        const newCommands = new Map(this.commands);
        newCommands.delete(id);
        this.commands = newCommands;
    }
}

export const workspaceStore = new WorkspaceStore();
