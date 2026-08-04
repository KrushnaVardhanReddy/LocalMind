TASK: Phase 9 — E2E Tests: LocalMind OS (Macro-Shell)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Write comprehensive Playwright E2E tests for the entire Phase 9 LocalMind OS shell — the macro-level
UI that wraps all workspaces. This covers the OPFS File Explorer, Command Palette, Dynamic Inspector
Panel, and Workspace Migration flows.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Playwright only. These are browser-level integration tests.
- Do NOT mock localStorage or IndexedDB — test against the real storage layer.
- Each test must be independent. Use `beforeEach` to reset state as needed.
- The app runs at `http://localhost:5173` in the test environment.

═══════════════════════════════════════════════════════════════
CONTEXT — REPO LAYOUT
═══════════════════════════════════════════════════════════════
- Main layout shell: `src/routes/+layout.svelte`
- Global store: `src/lib/stores/workspace.store.ts`
- OPFS Explorer sidebar component: `src/lib/components/workspace/` (look for ExplorerSidebar)
- Command palette: `src/lib/services/CommandRegistry.ts`, look for a `CommandPalette.svelte` component
- Right inspector panel: `src/lib/components/workspace/` (look for InspectorPanel)
- Workspace migration: `src/lib/services/` (look for migration-related code)
- Existing phase-9 task docs: `docs/tasks/phase-9/` for context on what was built

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════

1. **Macro-Shell Layout (`shell.spec.ts`)**:
   - Navigate to `/` — verify the global shell renders (sidebar, top-nav, main area)
   - Assert the workspace switcher is visible
   - Click each workspace link (Analytics, Docs, DevTools, Media, etc.) and verify the route changes
   - Test dark/light mode toggle if present in the shell header

2. **OPFS File Explorer (`explorer.spec.ts`)**:
   - Navigate to `/` and open the OPFS sidebar (click the file explorer icon/button)
   - Verify the file tree renders
   - Upload a test file via the explorer and confirm it appears in the tree
   - Click a file and confirm it opens in the correct workspace
   - Test the "Delete" action on a file

3. **Command Palette (`command-palette.spec.ts`)**:
   - Press `Ctrl+K` (or `Cmd+K`) and verify the command palette opens
   - Type "analytics" and verify matching commands appear
   - Press `Escape` and verify it closes
   - Select a command from the list and verify navigation occurs

4. **Dynamic Inspector Panel (`inspector-panel.spec.ts`)**:
   - Navigate to the Analytics workspace and create a chart
   - Click the inspector icon (🛠️) and verify the right panel opens
   - Toggle a chart property and verify the chart updates
   - Close the inspector and verify it collapses

5. **Workspace Migration (`workspace-migration.spec.ts`)**:
   - Create a workspace with data (upload a file, run a query)
   - Export as a `.lm` session file
   - Reload the page and re-import the `.lm` file
   - Verify the workspace state is fully restored

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW directory: `tests/phase-9/`
2. NEW: `tests/phase-9/shell.spec.ts`
3. NEW: `tests/phase-9/explorer.spec.ts`
4. NEW: `tests/phase-9/command-palette.spec.ts`
5. NEW: `tests/phase-9/inspector-panel.spec.ts`
6. NEW: `tests/phase-9/workspace-migration.spec.ts`

Commit: "test: Phase 9 E2E — Macro-Shell OS (Explorer, Command Palette, Inspector)"
Target branch: feature/dev
