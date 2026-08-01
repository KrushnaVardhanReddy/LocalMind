# Task 11: Offline Regex Tester & Debugger

## Objective
Implement a fully offline Regular Expression tester (similar to Regex101). Developers frequently paste proprietary logs, PII, or internal data into online regex testers to debug patterns, which is a massive data leak risk. This tool will allow them to build and test regexes completely locally.

## Prerequisites
- Review DevTools architecture and existing components.

## Implementation Steps

### 1. Build the UI Shell
- Create `src/routes/devtools/regex-tester/+page.svelte`.
- Layout: 
  - Top: Regex input bar (with flags toggle: `g`, `i`, `m`, `s`, `u`, `y`).
  - Middle Left: Test string editor.
  - Middle Right: Match information panel and explanation.
  - Bottom: Regex cheat sheet / quick reference.

### 2. Regex Execution Engine
- Implement a robust regex evaluator in JavaScript.
- Support standard JavaScript regex syntax natively.
- *(Optional/Future)*: Support PCRE/Python syntax via Pyodide or a WASM-compiled regex engine, but start with pure JavaScript `RegExp`.

### 3. Visual Highlighting
- Use CodeMirror or a custom span-highlighter to visually highlight matches in the test string editor.
- Highlight alternating matches in different colors for easy visualization.
- Highlight capture groups within matches.

### 4. Match Information Panel
- Display a clear list of all matches.
- For each match, display the full matched string, its start/end indices, and all captured groups with their group names/indices.
- Handle catastrophic backtracking gracefully (e.g., using Web Workers with a timeout to evaluate the regex so it doesn't freeze the main UI thread).

## Definition of Done
- A user can enter a regex, flags, and a test string, and instantly see visual highlights of the matches.
- Capture groups are clearly broken down in a side panel.
- The UI remains responsive even if the user enters a slow/infinite regex (handled via Web Worker timeout).
- Fully offline and stores no test strings across reloads (to prioritize security/privacy).
