TASK: Phase 6 — Task 15: LocalMind Diagrams (AI Diagram Generation)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an AI-assisted diagram generator. The user types a prompt ("Create an architecture diagram of a web server"), the existing WebLLM worker outputs Mermaid.js code, and the UI renders the diagram in real-time.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/phase-6/01_specialized_plugins_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Reuse Existing Workers: Delegate AI generation to the existing `LLMWorkerContract`. DO NOT introduce a new LLM engine.
- Mermaid Only: Use Mermaid.js for rendering. Do not build a custom node-based editor.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/plugins/diagrams/` (Target directory for the new route)
- `src/lib/workers/WorkerManager.ts` (For retrieving the WebLLM instance)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Streaming: Listen to the LLM token stream to render the Mermaid diagram live if possible, or wait until generation completes to avoid syntax errors during rendering.
- Code Editing: Provide a split-pane view where the user can manually edit the AI-generated Mermaid code and see the visual update immediately.
- Export: Implement SVG and PNG export buttons for the rendered diagram.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/diagrams/+page.svelte`
2. NEW: `src/lib/components/plugins/diagrams/MermaidRenderer.svelte`

Commit: "feat: Phase 6 Task 15 Diagrams plugin"
Target branch: feature/task15-diagrams
