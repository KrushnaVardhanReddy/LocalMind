export interface WorkspaceContext {
    id: string;
    type: 'analytics' | 'devtools' | 'pdf' | 'whiteboard' | 'custom';
    title: string;
    activeFileId?: string;
}

export interface InspectorState {
    componentName: string | null;
    props: Record<string, any>;
    isOpen: boolean;
}

export interface WorkspaceStoreContract {
    // Current active workspace context
    activeWorkspace: WorkspaceContext | null;
    
    // Right sidebar (Inspector) state
    inspectorState: InspectorState;

    // Actions
    setActiveWorkspace(workspace: WorkspaceContext): void;
    openInspector(componentName: string, props?: Record<string, any>): void;
    closeInspector(): void;
    
    // Command Palette hooks
    registerCommand(id: string, name: string, callback: () => void): void;
    unregisterCommand(id: string): void;
}
