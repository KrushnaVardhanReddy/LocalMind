TASK: Phase 13 — Task 2: Deposition Transcript Summarizer (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline tool to process massive deposition transcripts (TXT/PDF). The tool will use the WebLLM worker in a Map-Reduce fashion to summarize testimony and extract contradictions or key admissions.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- UI Component Isolation: Create generic components locally in `src/lib/components/plugins/legal/deposition/ui/`.
- Chunking: Implement text chunking before sending to WebLLM to avoid context limits.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/legal/deposition/+page.svelte`
2. NEW: `src/lib/components/plugins/legal/deposition/DepositionViewer.svelte`

Commit: "feat: Phase 13 Task 2 Deposition Summarizer"
Target branch: feature/task2-deposition
