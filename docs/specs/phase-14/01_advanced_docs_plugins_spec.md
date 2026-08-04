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
