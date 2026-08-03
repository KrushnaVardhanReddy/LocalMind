TASK: Phase 6 — Task 6: Offline Code Interpreter (Pyodide)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build a fully offline Python code interpreter using Pyodide. Users should be able to write Python scripts (including data analysis with Pandas/NumPy and plotting with Matplotlib) and execute them directly in the browser. 

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES 
═══════════════════════════════════════════════════════════════
- WORKER MANAGER MODIFICATION REQUIRED: You MUST modify `src/lib/workers/WorkerManager.ts` to add a new `getPyodideWorker()` singleton method. This is the only task in this wave, so it is safe to do so.
- Dedicated Web Worker: Pyodide execution is heavy and will freeze the browser tab if run on the main thread. It must be instantiated inside a dedicated Web Worker (`src/lib/workers/pyodide.worker.ts`).
- Purely Offline: Python execution must happen strictly via WASM. Do not use any external cloud execution APIs.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/plugins/code-interpreter/` (Target directory for the plugin route)
- `src/lib/workers/` (Where the new `pyodide.worker.ts` and updates to `WorkerManager.ts` will live)
- State Management: The project uses Svelte 5. You must use `$state()` runes for reactive variables (do NOT use Svelte 4 stores).
- UI Components: To maintain isolation, place any generic UI elements (Buttons, Terminals, Split Panes) in `src/lib/components/plugins/code-interpreter/ui/`.

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
1. **Pyodide Worker Setup:**
   - In `pyodide.worker.ts`, import Pyodide (`loadPyodide`).
   - Listen for messages containing Python code, execute them using `pyodide.runPythonAsync()`, and `postMessage` the results back to the main thread.
   - Redirect `sys.stdout` and `sys.stderr` inside Pyodide so that standard `print()` statements can be streamed back to the UI's console window.
2. **Data Science Packages (Crucial):**
   - Use `pyodide.loadPackage(['numpy', 'pandas', 'matplotlib'])` on initialization so users can perform data analysis out of the box.
3. **Handling Matplotlib Plots:**
   - Capturing plots is a classic Pyodide challenge. Tip: Have your Python wrapper code dynamically hijack `matplotlib.pyplot.show()` to save the current figure to a Base64 string, and send that string back to the UI to render as an `<img>`.
4. **UI Layout:**
   - Implement a split-pane layout: Code Editor (left) and Output/Terminal (right).
   - The Output pane should have two tabs: "Console" (for stdout) and "Plots" (for captured base64 images).

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. MODIFY: `src/lib/workers/WorkerManager.ts`
2. NEW: `src/lib/workers/pyodide.worker.ts`
3. NEW: `src/routes/plugins/code-interpreter/+page.svelte`
4. NEW: `src/lib/components/plugins/code-interpreter/CodeEditor.svelte`
5. NEW: `src/lib/components/plugins/code-interpreter/OutputConsole.svelte`

Commit: "feat: Phase 6 Task 6 Offline Code Interpreter via Pyodide"
Target branch: feature/task6-code-interpreter
