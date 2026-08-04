TASK: Phase 2 — Task 8: Document Comparison (Redline Diffing)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Extract text from two local PDF documents and run a text-diff algorithm to highlight additions and deletions for legal/HR review. Render the redline diffing interface natively in the browser without server calls.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Strictly use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`).
- DO NOT use Svelte 4 reactivity (`export let`, `$:`) or stores.
- DO NOT modify `src/lib/workers/WorkerManager.ts`. Use the existing `getMuPDF()` for text extraction.
- DO NOT modify `package.json`. The dependency `diff-match-patch` is already installed.
- Isolate all component UI logic to `src/lib/components/plugins/doc-diff/ui/`.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `docs/specs/phase-14/01_advanced_docs_plugins_spec.md` (Architecture Spec)
- `src/lib/workers/WorkerManager.ts` (For `getMuPDF()`)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- **Text Extraction:** Import `WorkerManager.getMuPDF()` and use `extractText()` on the two files provided by the user.
- **Diff Engine:** Import `diff-match-patch`, instantiate `new diff_match_patch()`, and call `diff_main(text1, text2)`. Call `diff_cleanupSemantic(diffs)` for cleaner results.
- **UI Architecture:** Create `src/lib/components/plugins/doc-diff/ui/DocDiffPanel.svelte` that renders the result array natively using semantic HTML (e.g. `<ins>` for insertions in green, `<del>` for deletions in red).
- **Route Setup:** Expose the tool by creating `src/routes/docs/compare/+page.svelte` which simply mounts `<DocDiffPanel />`.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. CREATE: `src/lib/components/plugins/doc-diff/ui/DocDiffPanel.svelte`
2. CREATE: `src/routes/docs/compare/+page.svelte`

Commit: "feat: Phase 2 Task 8 document redline diffing"
Target branch: feature/task8-doc-diff
