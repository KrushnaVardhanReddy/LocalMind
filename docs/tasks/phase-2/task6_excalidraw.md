TASK: Phase 2 — Task 6: Excalidraw Local Whiteboard

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Embed the Excalidraw npm package to provide a fully local, zero-backend whiteboarding and sketching environment within LocalMind.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Strictly use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`) in the wrapper.
- DO NOT use Svelte 4 reactivity (`export let`, `$:`) or stores.
- DO NOT modify `src/lib/workers/WorkerManager.ts`. Pure client-side wrapper only.
- DO NOT modify `package.json`. The dependencies (`@excalidraw/excalidraw`, `react`, `react-dom`) are already installed.
- Isolate all React wrapper logic to `src/lib/components/plugins/excalidraw/ui/`.
- Ensure all drawings are saved locally to OPFS via `wa-sqlite` or `IndexedDB`.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `docs/specs/phase-14/01_advanced_docs_plugins_spec.md` (Architecture Spec)

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- **Svelte Wrapper:** Create `src/lib/components/plugins/excalidraw/ui/ExcalidrawWrapper.svelte`. Use `createRoot(container).render(...)` to mount the React component. Use an `$effect` or standard `onDestroy` lifecycle block to call `root.unmount()` during cleanup to prevent memory leaks.
- **Persistence:** Hook into Excalidraw's `onChange(elements, appState, files)` callback. Serialize the elements and save them locally to OPFS/IndexedDB. Ensure the save operation is debounced so it doesn't freeze the canvas during rapid sketching.
- **Route Setup:** Expose the tool by creating `src/routes/whiteboard/+page.svelte` which simply mounts `<ExcalidrawWrapper />`.
- **Theming:** The wrapper should automatically sync Excalidraw's theme prop with LocalMind's dark/light modes.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. CREATE: `src/lib/components/plugins/excalidraw/ui/ExcalidrawWrapper.svelte`
2. CREATE: `src/routes/whiteboard/+page.svelte`

Commit: "feat: Phase 2 Task 6 excalidraw whiteboard"
Target branch: feature/task6-excalidraw
