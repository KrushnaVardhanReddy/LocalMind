TASK: Phase 2 — Task 5: Mermaid.js Diagram Integration

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Integrate Mermaid.js into the LocalMind Docs workspace to allow users to write text-based diagrams (Flowcharts, UML, ER diagrams) and render them directly in the markdown viewer.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Strictly use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`).
- DO NOT modify `WorkerManager.ts`. Pure client-side parsing only.
- DO NOT modify `package.json`. The `mermaid` dependency is already installed.
- Ensure you handle rendering errors gracefully so malformed markdown doesn't crash the UI.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `docs/specs/phase-14/01_advanced_docs_plugins_spec.md` (Architecture Spec)
- `src/lib/components/MarkdownViewer.svelte` (Host component)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- **Initialization:** In the markdown viewer, import Mermaid and initialize it globally: `mermaid.initialize({ startOnLoad: false, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default' })`.
- **Rendering:** Write a Svelte action (e.g., `use:renderMermaid`) or use an `$effect` block that finds all `<code class="language-mermaid">` blocks, reads their text content, and calls `mermaid.run()` or `mermaid.render()` to inject the SVG.
- **Theme Syncing:** Hook into the global theme toggle (or detect body class changes) to re-render the mermaid SVGs when the user toggles dark/light mode.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. MODIFY: `src/lib/components/MarkdownViewer.svelte`

Commit: "feat: Phase 2 Task 5 mermaid diagrams"
Target branch: feature/task5-mermaid
