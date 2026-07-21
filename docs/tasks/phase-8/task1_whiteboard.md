# Task 1: Infinite Whiteboard Integration

## Objective
Integrate Excalidraw as an offline-first infinite whiteboard into LocalMind, with full scene persistence via wa-sqlite and custom LocalMind "data node" templates for linking whiteboard elements to live workspace data.

## Prerequisites
- Review `docs/specs/phase-8/01_whiteboard_spec.md`.
- Cross-cutting wa-sqlite task must be complete — scenes are stored in `whiteboard_scenes` table.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add @excalidraw/excalidraw react react-dom
bun add -D @types/react @types/react-dom
```

### 2. React-in-Svelte Adapter
- Create `src/lib/components/ReactHost.svelte`.
- Use a `<div bind:this={container}>` and `onMount(() => ReactDOM.createRoot(container).render(<ExcalidrawWrapper />))`.
- Pass Svelte-side props (initial scene data, onChange callback) via a ref or event emitter.
- This is the only location in the codebase where React is used.

### 3. Excalidraw Scene Wrapper
- Create `src/lib/whiteboard/ExcalidrawWrapper.tsx`.
- Render `<Excalidraw>` with:
  - `initialData={{ elements: parsedSceneElements, appState: {} }}`.
  - `onChange(elements, appState)` → debounced 1000ms → call Svelte's `onSceneChange(elements)` callback.
  - `renderTopRightUI={() => <LocalMindToolbar />}` — adds LocalMind-specific actions to the toolbar.

### 4. Scene Persistence
- `onSceneChange(elements)`: serialize elements to JSON, call `WorkerManager.getSQLite().saveDashboardPanel(...)` (extend or add a new `whiteboard_scenes` method).
- On page load, query `whiteboard_scenes` from wa-sqlite and pass as `initialData` to Excalidraw.

### 5. Whiteboard Scene Manager
- Create `src/routes/whiteboard/+page.svelte`.
- Left sidebar: list of saved scenes ("My Boards"). "New Board" button creates a new `whiteboard_scenes` record.
- Rename, duplicate, and delete scenes.

### 6. Custom LocalMind Nodes
- In the custom Excalidraw toolbar, add a "Link DuckDB Table" action.
- Creates a sticky-note-style element with: table name, row count (queried live from DuckDB), last updated timestamp.

### 7. Export
- "Download as PNG" and "Download as SVG" buttons using Excalidraw's `exportToCanvas()` / `exportToSvg()` APIs.

## Definition of Done
- Drawing shapes, typing text, and refreshing the page restores the exact whiteboard state.
- Creating a "Link DuckDB Table" node shows live row count from a registered DuckDB table.
- Switching between scenes works correctly from the sidebar.
- **No external server.** All scene data lives in wa-sqlite OPFS.
- The whiteboard is fully functional offline.

---

# Phase 8: End-to-End Testing

## Test Cases (`tests/phase-8/`)

```typescript
// whiteboard.spec.ts
test('Drawing a rectangle persists after page refresh', async ({ page }) => {
    // Navigate to /whiteboard
    // Click to draw a rectangle using Excalidraw's rectangle tool
    // Wait for debounced save (1.5 seconds)
    // Reload the page
    // Assert: rectangle element is present in the canvas
});

test('Switching scenes loads different whiteboard content', async ({ page }) => {
    // Create two boards with different shapes
    // Switch between them via the sidebar
    // Assert: each board shows its own distinct content
});
```

## Definition of Done
- Tests pass on Chrome.
- **No mocks.** Real Excalidraw renders; real wa-sqlite persists scenes.
- Scene restore after refresh is validated in the test.
