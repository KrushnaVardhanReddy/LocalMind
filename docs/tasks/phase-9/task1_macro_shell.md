TASK: Phase 9 — Task 1 & 3: Macro-Shell Layout & Command Palette

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Refactor the application layout into a modern "LocalMind OS" workspace macro-shell (VS Code / Figma style) and implement a global Command Palette for rapid navigation.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-9/01_localmind_os_spec.md
  docs/wiki/design_philosophy.md

Contract (MUST implement exact interface):
  docs/contracts/workspace_store_contract.ts

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Use Svelte 5 Runes for the `workspace.store.svelte.ts`.
- DO NOT invent a custom command palette UI from scratch. Evaluate and integrate an existing lightweight library (e.g., `ninja-keys`, `svelte-command-palette`, or similar).
- The `+layout.svelte` must implement the 4-pane layout: Left Explorer, Center Canvas, Right Inspector, Top Nav.
- Ensure the Command Palette can be triggered globally via `Ctrl+K` or `Cmd+K`.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/+layout.svelte` (Current application layout)
- `src/app.html`
- `package.json`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Dependencies: Consider installing `ninja-keys@^1.2.2` or `svelte-command-palette@^2.0.2` instead of building a fuzzy-search UI from scratch.
- State: Be sure to use `$state` in your `workspace.store.svelte.ts` class/object to ensure reactivity when the active workspace or inspector state changes.
- Styling: Ensure that the Left Explorer and Right Inspector have explicit min and max widths so the Center Canvas scales appropriately using CSS flexbox.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. Create `src/lib/stores/workspace.store.svelte.ts` implementing `WorkspaceStoreContract`.
2. Update `src/routes/+layout.svelte` to feature the new macro-shell design (Left Sidebar, Right Sidebar, Top Nav).
3. Integrate the chosen command palette library into `+layout.svelte` and register at least 3 global commands (e.g., "Open Analytics", "Open DevTools", "Toggle Dark Mode").
