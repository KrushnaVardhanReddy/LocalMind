# Session-3: PDF Report Export (Full Workspace Snapshot)

## Objective
Export the current workspace view — pivot table, charts, AI insights, and SQL — as a styled, print-ready PDF. This is the "executive report" export for sharing with stakeholders who expect a PDF, not an interactive HTML file.

## Prerequisites
- Session-1 (Core Session Schema) completed.
- UX-3 (Static HTML Report Export) completed — reuse the HTML template generator.
- MuPDF WASM is already integrated.

## Implementation

### 1. PDF Generation Strategy
Use the browser's native `window.print()` with a print-optimized CSS media query rather than adding a new WASM dependency. This avoids the complexity of PDF WASM rendering while producing high-quality output.

**Alternative** (if print quality is insufficient): Use the existing MuPDF WASM worker to convert the HTML report blob to PDF client-side.

### 2. Print-Optimized Styles (`src/lib/styles/print.css`)
```css
@media print {
  /* Hide UI chrome */
  nav, .toolbar, .command-palette, .workspace-nav { display: none !important; }

  /* Force white background */
  body { background: white !important; color: black !important; }

  /* Prevent table row breaks across pages */
  tr { page-break-inside: avoid; }

  /* Chart canvas — ensure it renders at full width */
  canvas { max-width: 100% !important; height: auto !important; }

  /* Page header with title and timestamp */
  .report-header::before {
    content: attr(data-title) " — " attr(data-date);
    display: block; font-size: 18px; font-weight: bold;
  }
}
```

### 3. Export Button & Flow
- Add "Export PDF" button alongside the existing "Export Report" button in the Analytics workspace toolbar.
- On click:
  1. Set `document.title` to the session title (browser uses this as the PDF filename).
  2. Call `ReportExporter.prepareForPrint()` — hides non-report UI, injects print header.
  3. Call `window.print()` — browser opens native print dialog pre-set to "Save as PDF".
  4. After dialog closes, restore original UI state.

### 4. Report Layout for Print
- Page 1: Session title, generated timestamp, data source filename.
- Page 2+: Pivot table (paginated across print pages if needed).
- Final page: ECharts chart (rendered as static image via `canvas.toDataURL()`), AI summary, Generated SQL.

## Acceptance Criteria
- [ ] "Export PDF" button visible in Analytics workspace.
- [ ] Clicking opens the browser's native print dialog with the workspace content.
- [ ] Nav, toolbar, and non-report UI is hidden in the print view.
- [ ] Pivot table renders across multiple pages without row breaks mid-row.
- [ ] Chart renders as a static image (not blank) in the PDF.
- [ ] Session title appears as the PDF document title.
- [ ] No external network requests are made during PDF export.
