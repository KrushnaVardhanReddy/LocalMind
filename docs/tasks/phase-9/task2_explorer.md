# Phase 9, Task 2: OPFS File Explorer Sidebar & Top Nav

## OBJECTIVE
Implement the Left Sidebar (File Explorer) and Top Navigation bar for the LocalMind OS. The Left Sidebar must read from the browser's OPFS (Origin Private File System) to render a native-feeling file tree.

## CONTEXT
LocalMind OS uses a VS Code-like 4-pane layout. The `+layout.svelte` shell was created in Task 1. We now need to populate the `<aside>` placeholder for the Explorer with a robust file tree component.

## IMPLEMENTATION TIPS
1. **Tree Component:** Do not build a complex infinite-depth tree from scratch if a lightweight, unstyled package exists, OR build a clean recursive Svelte 5 component (`ExplorerNode.svelte`).
2. **OPFS API:** Use standard `navigator.storage.getDirectory()` to read the file structure.
3. **Icons:** Use Lucide-svelte for file/folder icons.
4. **Top Nav Breadcrumbs:** The Top Navigation should display the current workspace and path context.
5. **State Management:** Store the currently selected file path in `WorkspaceStore`.

## DELIVERABLES
1. Create `src/lib/components/explorer/FileExplorer.svelte` that reads OPFS and renders the file tree.
2. Update `src/routes/+layout.svelte` to replace the "Explorer" placeholder text with `<FileExplorer />`.
3. Update `src/lib/components/workspace/WorkspaceNav.svelte` to act as the global Top Navigation (showing active workspace/breadcrumbs).
4. Add basic unit tests for the OPFS reading logic (mock `navigator.storage` if necessary in Vitest).
