# Task 8: Document Comparison (Redline Diffing)

## Objective
Extract text from two PDF/Word documents locally and run a text-diff algorithm to highlight additions and deletions for legal/HR review.

## Implementation Steps
1. **Text Extraction:** Use MuPDF (or mammoth.js for DOCX) to extract raw text from Version A and Version B.
2. **Diff Engine:** Implement or use a diffing library (e.g., `diff-match-patch`) to compute differences at the word/sentence level.
3. **UI:** Create `src/routes/docs/compare/+page.svelte`.
   - Render a dual-pane or single-pane redline view.
   - Additions in green, deletions in red strike-through.
4. **Export:** Allow exporting the diff report as HTML or PDF.

## Definition of Done
- Two documents can be compared instantly in the browser.
- The UI clearly highlights differences.
