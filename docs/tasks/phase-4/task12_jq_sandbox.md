# Task 12: JSONPath & `jq` Query Sandbox

## Objective
Parsing massive JSON files via CLI `jq` or online tools can be tedious and pose a privacy risk. This tool provides an offline, dual-pane visual editor to execute `jq` or JSONPath queries against large JSON payloads instantly.

## Prerequisites
- Review DevTools architecture and existing components.

## Implementation Steps

### 1. Build the UI Shell
- Create `src/routes/devtools/jq-sandbox/+page.svelte`.
- Layout: 
  - Top: Query input bar with a toggle between `JSONPath` and `jq` syntax modes.
  - Left Panel: Source JSON editor (dropzone for large `.json` files).
  - Right Panel: Filtered JSON output editor.

### 2. Integration of Engines
- **JSONPath**: Integrate a lightweight library like `jsonpath-plus` to handle JSONPath queries natively in JS.
- **jq**: Integrate a WASM-compiled version of `jq` (e.g., `jq-web` or similar) to allow true `jq` syntax parsing entirely in the browser.

### 3. Performance & Large Files
- Use Web Workers to evaluate the queries so the main UI thread is not blocked, especially for files >10MB.
- Use Monaco Editor or a heavily virtualized CodeMirror instance for the JSON views to support rendering large payloads without crashing the browser.

### 4. Output Formatting
- Format the output automatically (pretty-print).
- Show execution time (e.g., "Executed in 45ms") and output size.
- Add a "Copy to Clipboard" and "Export to File" button for the filtered results.

## Definition of Done
- User can drop a large JSON file into the left panel.
- User can type a `jq` query (e.g., `.users[] | select(.age > 30) | .name`) and see the filtered output on the right panel instantly.
- The browser handles errors gracefully (e.g., invalid query syntax) and displays clear error messages below the query bar.
- The UI handles large JSON payloads without freezing (using Web Workers).
