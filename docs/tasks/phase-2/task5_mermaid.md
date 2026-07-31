TASK: Phase 2 — Task 5: Mermaid.js Diagram Integration

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Integrate Mermaid.js into the LocalMind Docs workspace to allow users to write text-based diagrams (Flowcharts, UML, ER diagrams) and render them directly in the markdown viewer.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Parse code blocks with `language-mermaid`.
- Render the diagrams using Mermaid's API.
- Support dark/light mode toggling for the diagrams.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/lib/components/MarkdownViewer.svelte` (or similar markdown rendering host)
- `package.json`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Dependencies: Install `mermaid@^11.0.0`.
- Initialization: In the markdown viewer or host component, import Mermaid and initialize it globally: `mermaid.initialize({ startOnLoad: false, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default' })`.
- Rendering: Write a Svelte action (e.g., `use:renderMermaid`) or use an `$effect` block that finds all `<code class="language-mermaid">` blocks, reads their text content, and calls `mermaid.run()` or `mermaid.render()` to inject the SVG. Ensure you handle rendering errors gracefully so malformed markdown doesn't crash the UI.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. MODIFY: `package.json`
2. MODIFY: `src/lib/components/MarkdownViewer.svelte`

Commit: "feat: Phase 2 Task 5 mermaid diagrams"
Target branch: feature/task5-mermaid
