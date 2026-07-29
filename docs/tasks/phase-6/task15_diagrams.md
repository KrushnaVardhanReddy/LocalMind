# Task 15: LocalMind Diagrams — AI Diagram Generation Workspace

## Objective
Build a diagram generation workspace at `/diagrams` that produces UML, ER, architecture, and flowchart diagrams from code, SQL schemas, OpenAPI specs, or plain English — rendered offline via Mermaid.js and D3.js, exported to PNG/SVG/PDF.

No new WASM workers needed. Reuses: tree-sitter (code parsing), DuckDB (schema introspection), WebLLM / cloud AI bridge (natural language → diagram definition).

## Prerequisites
- UX-1 (Workspace launcher dashboard) completed.
- tree-sitter WASM, DuckDB WASM, and WebLLM already integrated in WorkerManager.
- Mermaid.js available in package.json (add if missing — pure JS, no WASM).

## Implementation

### 1. Route Structure
```
src/routes/diagrams/
├── +page.svelte               ← Main diagrams workspace
├── +page.ts
└── components/
    ├── DiagramInput.svelte        ← Input panel: source selector + text editor
    ├── DiagramRenderer.svelte     ← Mermaid.js / D3 render panel
    ├── DiagramToolbar.svelte      ← Diagram type selector, export buttons
    └── DiagramExport.svelte       ← Export modal (PNG/SVG/PDF)
```

### 2. Input Sources & Diagram Types

| Input Source | Diagram Type | How |
|---|---|---|
| Plain text / Mermaid syntax | Any | Direct Mermaid render |
| Natural language (AI) | Flowchart, Sequence | WebLLM → Mermaid definition |
| SQL schema (DuckDB `DESCRIBE`) | ER Diagram | Parse schema → generate Mermaid `erDiagram` |
| Source file (tree-sitter) | UML Class | Parse code → extract classes → generate Mermaid `classDiagram` |
| OpenAPI JSON/YAML | API Sequence | Parse spec → generate Mermaid `sequenceDiagram` |

### 3. DiagramInput.svelte
- **Source tabs:** `Text Editor` | `SQL Schema` | `Source File` | `OpenAPI Spec` | `Natural Language`.
- **Text Editor:** CodeMirror-lite textarea accepting raw Mermaid or D3 JSON.
- **SQL Schema:** Drop or select a table from DuckDB, auto-generate `erDiagram`.
- **Source File:** Drop a `.ts`/`.py`/`.java` file, tree-sitter parses it, auto-generate `classDiagram`.
- **OpenAPI Spec:** Drop a `.json`/`.yaml`, parse `paths` → auto-generate `sequenceDiagram`.
- **Natural Language:** Type "Show the checkout flow" → WebLLM (local) or cloud bridge generates Mermaid.

### 4. DiagramRenderer.svelte
- Render Mermaid definitions via `mermaid.render()`.
- Support zoom/pan on the SVG output.
- Show error panel when Mermaid syntax is invalid (not a crash).
- Live re-render on every keystroke (debounced 300ms).

### 5. Export
- **SVG:** Extract the rendered `<svg>` element, trigger download.
- **PNG:** Use `canvas.drawImage` from the SVG → PNG download.
- **PDF:** Print-optimized CSS, same strategy as Session-3.

## Acceptance Criteria
- [ ] `/diagrams` route renders the two-panel (input + preview) layout.
- [ ] Raw Mermaid text renders correctly in the preview panel.
- [ ] Dropping a SQL-backed table auto-generates a valid ER diagram.
- [ ] Dropping a TypeScript file generates a class diagram with correct class names.
- [ ] "Natural Language" input sends to WebLLM (local) and renders the result.
- [ ] SVG and PNG export produce valid downloadable files.
- [ ] Invalid Mermaid syntax shows an error message (no crash).
- [ ] No new WASM workers added to WorkerManager.ts.
- [ ] Unit tests cover each source-to-diagram transformation path.
