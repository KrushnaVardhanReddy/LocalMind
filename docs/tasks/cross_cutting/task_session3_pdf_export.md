TASK: Session-3: PDF Report Export (Full Workspace Snapshot)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Export the current workspace view — pivot table, charts, AI insights, and SQL — as a styled, print-ready PDF. This acts as the "executive report" for sharing with stakeholders who expect a static document.

Spec (READ ONLY — implement from it, never edit):
  docs/specs/cross_cutting/05_sessions_spec.md

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Native Browser API: Use the browser's native `window.print()` alongside strict `@media print` CSS queries. DO NOT add heavy PDF-generation dependencies (e.g., pdf-lib, jspdf).
- Clean Output: The final printed output must hide all application chrome (navbars, sidebars, buttons) and only display the data components (charts, tables, AI summaries).

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/lib/styles/print.css` (Target file for print-specific styles)
- `src/lib/components/workspace/panels/AnalyticsWorkspace.svelte` (Target file to add the Export PDF button)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- CSS Rules: In `print.css`, ensure `nav, .toolbar, aside { display: none !important; }` and `body { background: white !important; color: black !important; }`.
- Table Pagination: Use `tr { page-break-inside: avoid; }` to prevent pivot tables from splitting rows awkwardly across PDF pages.
- Title Management: Temporarily change `document.title` to the active session name right before calling `window.print()`, so the browser prompts to save the file with the correct name, then revert it afterward.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW/MODIFY: `src/lib/styles/print.css`
2. MODIFY: `src/lib/components/workspace/panels/AnalyticsWorkspace.svelte`
3. MODIFY: `src/routes/+layout.svelte` (Ensure print.css is imported globally)

Commit: "feat: Implement Session-3 PDF Report Export"
Target branch: feature/session3-pdf-export
