TASK: Phase 1 — Task 14: Offline HTML Table Extractor

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Allow users to paste raw HTML source code and extract all structured data (tables, lists, JSON-LD) directly into queryable DuckDB tables without leaving the browser.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Pure Client Side: Use `DOMParser` to parse the dropped HTML text.
- No network requests (must work offline).

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/analytics/extractor/` (Target directory)
- `src/lib/components/ui/` (Existing UI components)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Parsing: Query all `<table>` elements. Extract headers (`<th>`) and rows (`<tr>/<td>`). Query `<script type="application/ld+json">` for structured JSON data.
- DuckDB Integration: Convert the extracted arrays into JSON and register them with DuckDB.
- Preview: Show a data grid preview of the extracted tables.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/analytics/extractor/+page.svelte`
2. NEW: `src/lib/components/analytics/HtmlExtractor.svelte`

Commit: "feat: Phase 1 Task 14 HTML Extractor"
Target branch: feature/task14-html-extractor
