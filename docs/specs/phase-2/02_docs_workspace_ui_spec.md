# Spec: 02 - Docs Workspace UI Layout

## 1. Overview
The Docs Workspace (`/docs`) is the secondary major vertical of LocalMind. Unlike the Analytics workspace (which focuses on CSVs and DuckDB), the Docs workspace focuses on unstructured data (PDFs, Images, DOCX) using MuPDF, OpenCV, and Tesseract WASM.

## 2. Layout Structure
The workspace will use a CSS Grid-based split-pane layout to maximize vertical screen space for document viewing.

### Left Sidebar (250px, Collapsible)
- **File List:** A list of uploaded unstructured documents.
- **OCR Queue:** A visual indicator showing the background Tesseract.js extraction progress for any scanned PDFs or images.
- **Search Panel:** A semantic search input that queries the local `Transformers.js` embeddings to find relevant paragraphs across all uploaded documents.

### Main View (Fluid)
- **Top Navigation:** Tabbed routing between different document tools:
  - `Viewer`: Standard PDF/Image viewer.
  - `Merge & Split`: Uses MuPDF WASM for local PDF manipulation.
  - `Redact`: Uses ONNX NER models to automatically draw black boxes over PII.
  - `Extract`: Runs OpenCV + Tesseract for OCR.
- **Canvas Area:** The main active rendering zone for the selected tool.

## 3. Theming & Accessibility
- Must use standard Tailwind colors from the `app.css` design system (e.g., `bg-surface-800` for dark mode).
- All interactive tabs and buttons must have standard `aria-label` attributes to ensure Playwright E2E tests can easily target them.
