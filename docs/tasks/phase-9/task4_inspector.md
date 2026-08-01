# Phase 9, Task 4: Dynamic Right Inspector Panel

## OBJECTIVE
Implement the Right Sidebar (Inspector) for the LocalMind OS. This panel should dynamically render context-aware properties, filters, or AI chat interfaces based on what is selected in the main canvas or explorer, reacting to the global `workspaceStore.inspectorState`.

## CONTEXT
In Task 1, we implemented the OS layout skeleton (`+layout.svelte`) and the `WorkspaceStore`. The Right Sidebar currently exists as a placeholder that slides open when `workspaceStore.inspectorState.isOpen` is true. We need to upgrade this placeholder into a robust, dynamic component renderer.

## IMPLEMENTATION TIPS
1. **Dynamic Rendering:** The Inspector should take the `componentName` and `props` from `workspaceStore.inspectorState` and dynamically render the corresponding Svelte component.
2. **Component Registry:** Create a lightweight mapping (e.g., `InspectorRegistry.svelte.ts` or similar) that maps string names (e.g., `'ChartProperties'`, `'FileDetails'`) to actual imported Svelte components.
3. **Empty/Fallback State:** If no component matches or if `isOpen` is true but no component is specified, render a helpful empty state.
4. **Header/Close Button:** Ensure the Inspector has a consistent header with a title and a working close button (calling `workspaceStore.closeInspector()`).
5. **No Infinite Loops:** Be careful with reactivity when passing dynamic props into the rendered component.

## DELIVERABLES
1. Create `src/lib/components/inspector/DynamicInspector.svelte` that acts as the container.
2. Update `src/routes/+layout.svelte` to replace the raw placeholder right sidebar code with `<DynamicInspector />`.
3. Create at least one dummy inspector component (e.g., `src/lib/components/inspector/panels/DemoPanel.svelte`) and test it by adding a temporary button or global command in `+layout.svelte` to trigger it.
