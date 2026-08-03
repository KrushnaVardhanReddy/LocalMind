TASK: Phase 13 — Task 3: Legal Case Research Vault (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build a local semantic search vault for case law. Users upload folders of PDFs (parsed by MuPDF), which are then embedded (via transformers.js) and indexed in DuckDB using its VSS (Vector Similarity Search) extension to allow natural language querying.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- UI Component Isolation: Create generic components locally in `src/lib/components/plugins/legal/case-vault/ui/`.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/legal/case-vault/+page.svelte`
2. NEW: `src/lib/components/plugins/legal/case-vault/SemanticSearch.svelte`

Commit: "feat: Phase 13 Task 3 Legal Case Research Vault"
Target branch: feature/task3-case-vault
