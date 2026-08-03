TASK: Phase 14 — Task 2: Citation & Bibliography Builder (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build a utility where users can paste raw text, URLs, or ISBNs. The WebLLM worker formats these inputs into perfect APA, MLA, or Chicago style citations and allows exporting them as a BibTeX or plain text bibliography.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- UI Component Isolation: Create generic components locally in `src/lib/components/plugins/education/citation-builder/ui/`.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/education/citation-builder/+page.svelte`
2. NEW: `src/lib/components/plugins/education/citation-builder/CitationList.svelte`

Commit: "feat: Phase 14 Task 2 Citation Builder"
Target branch: feature/task2-citation-builder
