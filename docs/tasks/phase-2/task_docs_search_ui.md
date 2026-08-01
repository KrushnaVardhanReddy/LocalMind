TASK: Phase 2 — Docs-2: Semantic Search UI

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Move the Semantic Search functionality out of the temporary "Extract" tab and into a dedicated `DocsSearchPanel.svelte` component within the Left Sidebar of the Docs Workspace. This makes search globally accessible across all views.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-2/02_docs_workspace_ui_spec.md
  docs/contracts/phase-2/docs_worker_contracts.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Extraction: Remove the existing semantic search UI (`searchQuery`, input box, search results grid) from the main `extract` tab in `+page.svelte`.
- Creation: Build a new `DocsSearchPanel.svelte` component to encapsulate the search input and results logic.
- Integration: Inject the `<DocsSearchPanel />` into the left `<aside>` of `+page.svelte` (e.g., above or below the File List).
- State Management: Use Svelte 5 `$state` runes for reactive properties. The search state (`isSearching`, `searchResults`, etc.) must be contained within the new component or passed cleanly.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/docs/+page.svelte` (Current Docs workspace shell with embedded search)
- `src/lib/contracts/embeddings_worker_contract.ts` (Embeddings interface)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Props: Pass the `embeddingsWorker` and `sqliteWorker` references from `+page.svelte` down to `DocsSearchPanel` as props (`let { embeddingsWorker, sqliteWorker } = $props();`).
- Layout: The sidebar is narrow (250px). Ensure the search input and results cards stack vertically. Show the cosine similarity score as a compact pill or badge.
- UX: Add a "Clear" button to reset the search and hide the results list.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/lib/components/workspace/panels/DocsSearchPanel.svelte`
2. MODIFY: `src/routes/docs/+page.svelte`

Commit: "feat: Implement Docs-2 Semantic Search Sidebar UI"
Target branch: feature/docs2-semantic-search
