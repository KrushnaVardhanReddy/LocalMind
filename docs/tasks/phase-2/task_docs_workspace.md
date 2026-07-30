# Task: Docs-1 (Docs Workspace Route & Layout)

## Objective
Create the `/docs` route and implement the core UI shell (sidebar + main tabs) for the Docs workspace, connecting it to the existing WASM workers.

## Prerequisites
- Review `docs/specs/phase-2/02_docs_workspace_ui_spec.md`.
- Review `docs/specs/phase-2/01_docs_engine_spec.md`.

## Implementation Steps
1. **Create the Route:** Create `src/routes/docs/+page.svelte`.
2. **Build the Layout:**
   - Implement a CSS Grid layout with a 250px left sidebar and a flexible main content area.
   - Sidebar: Create a "File List" section and an "OCR Queue" section.
   - Main Area: Create a tabbed navigation bar (`Viewer`, `Merge & Split`, `Redact`, `Extract`).
3. **Wire Existing Logic:**
   - Import `WorkerManager` and ensure it properly initializes the `tesseractWorker` and `mupdfWorker` when the Docs route mounts.

## 💡 Implementation Tips for Jules
- **Svelte 5 Runes:** Use `$state` for the active tab selection (e.g., `let activeTab = $state('viewer')`). Do not use Svelte 4 `export let` for internal component state.
- **E2E Testability (CRITICAL):** Add specific `data-testid` or clean `aria-label` attributes to the Sidebar items and the Main Area tabs. The Playwright tests for Phase 2 will rely heavily on these locators to drag-and-drop PDFs. If the DOM structure is unpredictable, the future E2E tests will flake.
- **Styling:** Use standard Tailwind utility classes (`flex`, `grid`, `w-64`, `bg-surface-800`). Do not write custom CSS unless absolutely necessary.
