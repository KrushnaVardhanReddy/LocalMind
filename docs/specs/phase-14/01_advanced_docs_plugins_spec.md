# Advanced Docs Plugins Architecture (Wave F)

## Mission
Enhance the existing Universal Docs workspace by integrating advanced capabilities: **Redline Diffing**, **Mermaid.js Diagrams**, and **Excalidraw Whiteboards**. These must act as pure standalone components with zero conflicts.

## Universal Constraints
1. **Zero State Conflicts:** Use strictly Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`). Do not use Svelte 4 reactivity (`export let`, `$:`) or global stores unless absolutely necessary.
2. **Conflict-Free Entry Points:** **DO NOT modify `src/lib/workers/WorkerManager.ts`**. No new singletons or WebAssembly workers are needed. 
   - Redline Diffing: `WorkerManager.getMuPDF()` already exists.
   - Mermaid: Pure client-side parsing.
   - Excalidraw: Pure client-side React wrapper.
3. **Component Isolation:** 
   - Put all diffing logic inside `src/lib/components/plugins/doc-diff/`
   - Put all Excalidraw wrapper logic inside `src/lib/components/plugins/excalidraw/`
   - Only expose a thin wrapper to the routing layer (`src/routes/...`)
4. **No NPM Changes:** Dependencies (`mermaid`, `@excalidraw/excalidraw`, `react`, `react-dom`, `diff-match-patch`) have already been installed to `package.json`. **DO NOT modify `package.json`** or the lockfile.

## Task Details

### Task 8: Document Comparison (Redline Diffing)
- **UI Location:** `src/lib/components/plugins/doc-diff/ui/DocDiffPanel.svelte`
- **Route:** `src/routes/docs/compare/+page.svelte`
- **Core Loop:**
  1. User selects two files via OPFS.
  2. Invoke `WorkerManager.getMuPDF()` to extract text if PDF, or handle text directly.
  3. Use `diff-match-patch` to compute diffs.
  4. Render results natively using semantic HTML (`<ins>` and `<del>`).

### Task 5: Mermaid.js Diagram Integration
- **UI Location:** Update `src/lib/components/MarkdownViewer.svelte` (or equivalent markdown host).
- **Core Loop:**
  1. Detect `<code class="language-mermaid">` nodes after markdown parses to HTML.
  2. Use a Svelte action `use:mermaidRender` or an `$effect` block.
  3. Call `mermaid.run()` or `mermaid.render()` on the target nodes.
  4. Ensure dark mode syncing (`theme: 'dark'`).

### Task 6: Excalidraw Local Whiteboard
- **UI Location:** `src/lib/components/plugins/excalidraw/ui/ExcalidrawWrapper.svelte`
- **Route:** `src/routes/whiteboard/+page.svelte`
- **Core Loop:**
  1. Import `@excalidraw/excalidraw` and wrap it using `react-dom/client` `createRoot`.
  2. Mount inside a container `div` referenced by `bind:this`.
  3. Ensure cleanup (`root.unmount()`) on `onDestroy`.
  4. Hook `onChange` to serialize and save to OPFS (`wa-sqlite`).

---

## 6. Acceptance Criteria & E2E Test Scenarios

### AC-14.1 Mermaid.js Integration
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User opens a markdown file with a `mermaid` fenced block | An `<svg>` element is rendered in place of the code block |
| AC-2 | The mermaid block is a flowchart: `graph LR; A-->B` | SVG is visible with non-zero width/height; "A" and "B" labels appear |
| AC-3 | User is in dark mode | Mermaid diagram uses dark theme (dark background, light text) |
| AC-4 | User pastes invalid Mermaid syntax | An inline error message is shown; the app does NOT crash |
| AC-5 | Page contains multiple mermaid blocks | All blocks render independently without interfering |

### AC-14.2 Excalidraw Local Whiteboard
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User navigates to `/whiteboard` | Excalidraw canvas is visible and interactive |
| AC-2 | User selects the rectangle tool and drags on canvas | A rectangle shape appears on the canvas |
| AC-3 | User clicks "Export" | A file download is triggered (PNG or SVG) |
| AC-4 | User reloads the page | Previously drawn shapes are restored from OPFS persistence |
| AC-5 | User clicks "Clear canvas" | All shapes are removed |

### AC-14.3 Document Redline Diffing
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads two text files with known differences | A diff view shows `<ins>` (additions in green) and `<del>` (deletions in red) |
| AC-2 | User uploads two identical files | "No differences found" message is shown |
| AC-3 | User uploads two PDFs | Text is extracted via MuPDF and then diffed |
| AC-4 | Additions/Deletions counter | UI displays accurate count of added/removed lines |
| AC-5 | User uploads a very large file (>1MB text) | Diff completes without crashing; progress indicator shown |
