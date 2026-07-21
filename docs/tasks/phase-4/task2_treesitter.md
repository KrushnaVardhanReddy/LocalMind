# Task 2: Code Analysis with tree-sitter

## Objective
Implement a local code structure analysis tool using the tree-sitter WASM parser that extracts functions, classes, imports, and complexity metrics from source files — entirely offline, supporting TypeScript, JavaScript, Python, Go, Rust, C/C++, and Java.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.3).
- Review `docs/contracts/phase-4/devtools_worker_contracts.md` (TreeSitterWorkerContract).

## Implementation Steps

### 1. Install Dependencies
```bash
bun add web-tree-sitter
bun add -D tree-sitter-typescript tree-sitter-python tree-sitter-go tree-sitter-rust tree-sitter-java
```

### 2. Create the tree-sitter Worker
- Create `src/lib/workers/treesitter.worker.ts`.
- Implement `TreeSitterWorkerContract` strictly.
- In `loadLanguage(lang)`:
  - Dynamically import the correct grammar WASM file (e.g., `tree-sitter-typescript.wasm`) from `/static/grammars/`.
  - Use `Language.load()` to load the grammar into the tree-sitter instance.
  - Cache loaded grammars in a `Map<string, Language>` to avoid re-loading.
- In `parseFile(fileContent, fileName)`:
  - Auto-detect language from file extension (`.ts` → typescript, `.py` → python, etc.).
  - Call `loadLanguage()` if the grammar is not cached.
  - Parse the source code and traverse the syntax tree.
  - Extract symbols using tree-sitter S-expression queries.
- Call `expose(new TreeSitterService())`.

### 3. tree-sitter Queries
- For each language, define a query file in `src/lib/workers/treesitter-queries/`:
  - `typescript.scm` — capture `function_declaration`, `class_declaration`, `import_statement`.
  - `python.scm` — capture `function_definition`, `class_definition`, `import_statement`.
  - `go.scm` — capture `function_declaration`, `method_declaration`, `import_spec`.
- These `.scm` query files are loaded as raw strings and compiled via `language.query(queryString)`.

### 4. Register with WorkerManager
- Add `WorkerManager.getTreeSitter()`.

### 5. Build the Code Analysis UI
- Create `src/routes/devtools/code/+page.svelte`.
- File drop zone (accept any source file).
- Language auto-detection badge shown after drop.
- Results panel: a collapsible tree view of extracted symbols.
  - Top level: file name and language.
  - Level 2: functions and classes, with line range and complexity score.
  - Level 3: methods within classes.
- "Download as JSON" button — exports the symbol table as a machine-readable file.

## Definition of Done
- Dropping a 3,000-line TypeScript file returns a complete symbol list within 2 seconds.
- Auto-detection correctly identifies Python files (`.py`) and loads the Python grammar.
- The symbol tree renders correctly with collapsible nodes.
- **No mocks.** Real tree-sitter WASM parses the source files.
- Unknown file types display a "Language not supported" message gracefully.
