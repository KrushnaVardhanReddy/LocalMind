# Task 2: Code Analysis with tree-sitter

## Objective
Implement local code parsing to extract structural information using `tree-sitter WASM`.

## Prerequisites
- Review `docs/specs/phase-4/01_developer_workspace_spec.md`.

## Implementation Steps

### 1. tree-sitter Worker Setup
- Install `web-tree-sitter`.
- Create a Web Worker (`src/lib/workers/treesitter.worker.ts`).
- Download and cache language `.wasm` files (e.g., `tree-sitter-javascript.wasm`).

### 2. Parsing Logic
- Handle the `PARSE_CODE` action.
- Walk the generated AST to extract function declarations, classes, and imports.

### 3. Analysis UI
- Build a view that accepts a source file.
- Display a structured outline (tree view) of the code's components.

## Acceptance Criteria
- [ ] Source files are parsed locally without upload.
- [ ] The UI accurately displays the structural outline of the code.
