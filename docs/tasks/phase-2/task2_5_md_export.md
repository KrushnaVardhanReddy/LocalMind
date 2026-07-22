# Task 2.5: Markdown to PDF/HTML Export

## Objective
Implement a local Markdown-to-PDF and Markdown-to-HTML export pipeline using a WASM-based renderer, enabling users to author documents in Markdown and export polished, styled outputs without any internet connection.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md`.
- Task 2 (MuPDF) should be complete — PDF output is piped through MuPDF for finalization.

## Implementation Steps

### 1. Install Dependencies
*(Already completed by Antigravity in `feature/dev`. No need to run these commands.)*

### 2. Markdown → HTML Renderer
- Create `src/lib/utils/markdown-renderer.ts`.
- Use `marked` to parse Markdown to HTML.
- Sanitize output with `DOMPurify` to prevent XSS.
- Apply a curated CSS stylesheet (stored in `src/lib/styles/export-document.css`) for a polished print layout: proper typography, code block syntax highlighting via `highlight.js`, table borders, page margins.

### 3. HTML → PDF Export
- Use the browser's native `window.print()` API with a print-specific CSS (`@media print`) to render the styled HTML to PDF.
- Alternatively, use `jsPDF` + `html2canvas` for a programmatic PDF generation path (choose the approach with better fidelity).
- Target: output must look like a professionally typeset document, not a browser print dump.

### 4. Build the Markdown Editor UI
- Create `src/routes/docs/markdown/+page.svelte`.
- Left panel: a `<textarea>` or `CodeMirror`-based Markdown editor.
- Right panel: a live-updating HTML preview (debounced 300ms).
- Toolbar: `Bold`, `Italic`, `Code`, `Link`, `Image`, `Table` shortcut buttons.
- Export buttons: "Download HTML" (Blob download) and "Export to PDF" (triggers print/jsPDF).

### 5. Template Library
- Provide 3 starter templates selectable from the toolbar:
  - "Meeting Notes" template.
  - "Technical Report" template.
  - "Invoice" template.
- Templates are Markdown strings stored in `src/lib/templates/markdown/`.

## Definition of Done
- Typing in the editor updates the preview in real time (< 500ms debounce).
- "Download HTML" produces a self-contained HTML file (CSS inlined) that renders correctly in any browser.
- "Export to PDF" produces a clean, paginated PDF with correct heading hierarchy.
- **No cloud dependencies.** No Pandoc server, no cloud PDF API.
- The exported PDF opens correctly in Adobe Reader and macOS Preview.
