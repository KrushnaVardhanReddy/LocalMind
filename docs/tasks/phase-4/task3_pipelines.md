# Task 3: Visual Transformation Pipelines

## Objective
Implement a node-based visual pipeline builder where users can chain DevTools operations together — e.g., "Base64 Decode → Gunzip → Format JSON → Validate Schema" — by connecting nodes on a canvas, all running locally.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md`.
- Tasks 1 (Formatters) and 1.5 (Converters) must be complete — pipeline nodes reuse their workers.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add @xyflow/svelte
```

### 2. Define Pipeline Node Types
Create `src/lib/pipeline/nodes.ts` defining the catalog of available nodes:

```typescript
type NodeType =
    | 'input'         // Raw text / file input
    | 'base64_decode' | 'base64_encode'
    | 'json_format'   | 'json_minify'
    | 'yaml_to_json'  | 'json_to_yaml'
    | 'xml_to_json'   | 'json_to_xml'
    | 'gunzip'        | 'gzip'
    | 'url_decode'    | 'url_encode'
    | 'jwt_decode'
    | 'regex_extract' // Configurable: user inputs regex pattern
    | 'output';       // Final display panel
```

Each node has: `inputs: string[]`, `outputs: string[]`, `config?: object`.

### 3. Pipeline Execution Engine
- Create `src/lib/pipeline/engine.ts`.
- Traverse the node graph in topological order.
- Execute each node's transform function using the appropriate Worker (Converter, Formatter).
- For CPU-intensive nodes (Gunzip, large Base64 decode), route through the Converter worker.
- For pure JS operations (URL decode/encode, regex), run synchronously in the engine.
- Pass data between nodes as `string | ArrayBuffer`.

### 4. Build the Canvas UI
- Create `src/routes/devtools/pipelines/+page.svelte`.
- Use `@xyflow/svelte` for the drag-and-drop node canvas.
- Left sidebar: draggable node palette organized by category.
- Canvas: nodes with connection handles.
- Node inspector panel: clicking a node shows its config form (e.g., regex pattern for `regex_extract`).
- "Run Pipeline" button — executes and shows output in the terminal panel at the bottom.

### 5. Save/Load Pipelines
- "Save Pipeline" button — serializes the node graph to JSON and saves via wa-sqlite (new `saved_pipelines` table).
- "Load Pipeline" — retrieves from wa-sqlite and restores the canvas.
- Include 3 example starter pipelines: "API Response Debugger", "Log Line Parser", "JWT Analyzer".

## Definition of Done
- A "Base64 Decode → Format JSON" pipeline runs correctly and displays output.
- Connecting a Gunzip node to a Format JSON node works for a real gzipped JSON payload.
- Pipelines are saved and restored correctly after a browser refresh.
- **No mocks.** All transformations use the same real workers as standalone tools.
- Invalid connections (e.g., non-JSON into `json_format`) display a descriptive error in the output panel.
