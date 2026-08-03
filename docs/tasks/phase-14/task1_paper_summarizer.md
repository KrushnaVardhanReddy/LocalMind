TASK: Phase 14 — Task 1: Academic Paper Summarizer (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build a tool for researchers to upload academic PDFs (ArXiv, Nature). MuPDF parses the text, and WebLLM extracts the Abstract, Methodology, Findings, and Limitations into a structured JSON dashboard.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- UI Component Isolation: Create generic components locally in `src/lib/components/plugins/education/paper-summarizer/ui/`.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/education/paper-summarizer/+page.svelte`
2. NEW: `src/lib/components/plugins/education/paper-summarizer/PaperDashboard.svelte`

Commit: "feat: Phase 14 Task 1 Academic Paper Summarizer"
Target branch: feature/task1-paper-summarizer
