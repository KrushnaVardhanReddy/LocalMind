TASK: Phase 2 — Task 6: Excalidraw Local Whiteboard

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Embed the Excalidraw npm package to provide a fully local, zero-backend whiteboarding and sketching environment within LocalMind.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES
═══════════════════════════════════════════════════════════════
- Ensure all drawings are saved locally to the Origin Private File System (OPFS) via wa-sqlite or IndexedDB.
- The UI must blend cleanly with LocalMind's dark/light modes.
- Avoid unnecessary external network calls.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/whiteboard/+page.svelte` (or similar new route)
- `src/lib/components/Whiteboard.svelte`
- `package.json`

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
- Dependencies: Install `@excalidraw/excalidraw@^0.17.0`, `react@^18.2.0`, and `react-dom@^18.2.0`. Excalidraw's core package requires React, so we must wrap it.
- Svelte Wrapper: Create a Svelte component that mounts the React Excalidraw component into a target `div` using standard React DOM rendering (`createRoot(container).render(...)`). Be sure to clean up the root in the Svelte `onDestroy` lifecycle block.
- Persistence: Hook into Excalidraw's `onChange(elements, appState, files)` callback. Serialize the elements and save them locally to OPFS/IndexedDB. Ensure the save operation is debounced so it doesn't freeze the canvas during rapid sketching.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. MODIFY: `package.json`
2. CREATE: `src/routes/whiteboard/+page.svelte`
3. CREATE: `src/lib/components/Whiteboard.svelte`

Commit: "feat: Phase 2 Task 6 excalidraw whiteboard"
Target branch: feature/dev
