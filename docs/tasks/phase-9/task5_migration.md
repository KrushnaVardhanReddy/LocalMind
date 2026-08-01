# Phase 9, Task 5: Workspace Migration

## OBJECTIVE
Migrate the existing full-page routes (e.g., Analytics, DevTools, PDF Reader) into Workspace Components that render seamlessly inside the new LocalMind OS center canvas, eliminating full-page reloads and unifying the user experience.

## CONTEXT
Currently, tools like `/analytics` and `/devtools` operate as standalone SvelteKit routes (`+page.svelte`). Now that we have a robust 4-pane layout in `+layout.svelte` with a global `WorkspaceStore` and `CommandRegistry`, these tools need to be converted into modular `<Workspace />` components.

## IMPLEMENTATION TIPS
1. **Component Refactoring:** Extract the core logic of `src/routes/analytics/+page.svelte` into a reusable component (e.g., `src/lib/components/workspace/panels/AnalyticsWorkspace.svelte`). Do the same for DevTools or other major tools.
2. **Dynamic Canvas Routing:** Instead of SvelteKit's `goto('/analytics')`, use the `workspaceStore.activeWorkspace` to determine which workspace component to render inside the center `<main>` canvas of `+layout.svelte`. (You may still use SvelteKit routing for deep-linking, but the shell remains persistent).
3. **Command Palette Integration:** Update the "Go to Analytics" command in `CommandRegistry.ts` to trigger a workspace switch via the store instead of a hard navigation.
4. **Layout Cleanup:** Remove old layout wrappers from the individual tool routes if they conflict with the new global `+layout.svelte`.

## DELIVERABLES
1. Create at least one workspace component (e.g., `AnalyticsWorkspace.svelte`) by refactoring an existing route.
2. Update the center canvas in `src/routes/+layout.svelte` to dynamically render the active workspace component based on `workspaceStore.activeWorkspace`.
3. Update `CommandRegistry.ts` to use `workspaceStore.setActiveWorkspace(...)` for navigation commands.
4. Ensure the transition between workspaces is smooth and the Left Sidebar/Right Inspector persist across switches.
