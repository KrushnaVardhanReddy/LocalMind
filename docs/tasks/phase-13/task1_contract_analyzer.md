TASK: Phase 13 — Task 1: Local Contract Analyzer (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline legal contract analysis tool. Lawyers can upload PDF contracts (parsed via MuPDF worker) and use the WebLLM worker to automatically extract key clauses (e.g., Termination, Liability, Confidentiality).

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- Reuse Existing Workers: Rely strictly on MuPDF and WebLLM singletons.
- UI Component Isolation: You MUST NOT create generic components in `src/lib/components/ui/`. Create them locally in `src/lib/components/plugins/legal/contract-analyzer/ui/`.
- State Management: Svelte 5 `$state()` runes must be used.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/legal/contract-analyzer/+page.svelte`
2. NEW: `src/lib/components/plugins/legal/contract-analyzer/ClauseExtractor.svelte`

Commit: "feat: Phase 13 Task 1 Local Contract Analyzer"
Target branch: feature/task1-contract-analyzer
