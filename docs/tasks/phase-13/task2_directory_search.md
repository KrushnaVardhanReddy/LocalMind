# Task 2: Local Directory Semantic Search

## Overview
A powerful workspace that replaces niche folder-scanning tools (e.g., Plagiarism Checker, Case Law Vault). This workspace allows users to point LocalMind at a local directory on their hard drive. It will recursively scan PDFs, Markdown, and Text files, embed them offline using DuckDB VSS (Vector Similarity Search), and provide instant semantic search across thousands of files.

## ⚠️ CRITICAL DELEGATION CONTRACT
**To ensure conflict-free parallel execution across the LocalMind repository, you MUST strictly adhere to the following rules. Failure to do so will result in a rejected PR.**

1. **NO `WorkerManager.ts` Modifications:** 
   - You are **strictly forbidden** from modifying `src/lib/workers/WorkerManager.ts`.
   - Use the existing singletons: `getDuckDB()` for vector storage/search, `getEmbeddings()` for embeddings, and `getMuPDF()` for document parsing.
2. **STRICT Component Isolation:**
   - All UI components for this plugin MUST be placed inside `src/lib/components/plugins/directory-search/ui/`.
   - **Do not** add generic components to `src/lib/components/ui/`.
3. **State Management:**
   - Use Svelte 5 `$state()` runes exclusively. Do not use Svelte 4 stores (`writable`).

## Technical Requirements

### 1. Routes & Architecture
- **Route:** `src/routes/plugins/directory-search/+page.svelte`
- **Layout:** Standard two-pane layout:
  - **Left Pane:** Directory selection, indexing progress, and search input.
  - **Right Pane:** Search results showing the file name, snippet of matching text, and similarity score.

### 2. File System Access
- Use the File System Access API (`showDirectoryPicker`) to allow the user to select a local folder.
- Recursively iterate through the folder (handling limits gracefully, e.g., max 1000 files or skipping large binaries).
- Parse text from `.txt`, `.md`, and `.pdf` files.

### 3. Local Embeddings & Vector Search
- Chunk the extracted text into manageable pieces (e.g., 500 tokens).
- Use the existing WebLLM or `getEmbeddings()` worker to generate embeddings for each chunk.
- Store the chunks and their embeddings in DuckDB using the VSS extension.
- When the user searches, embed the query and execute an `ORDER BY array_cosine_similarity(...)` query in DuckDB to fetch the top 5 results.

### 4. UI Polish & Aesthetics
- The workspace must feel extremely premium. Use sleek progress bars for the indexing phase.
- Search results should highlight the exact snippet of text that matched.
- Provide a clean, dark-mode friendly design with glassmorphism effects.

## Acceptance Criteria
- [ ] The `directory-search` route loads successfully.
- [ ] A user can select a local folder and watch it index into DuckDB.
- [ ] A user can type a semantic query and get highly relevant snippets back in under 1 second.
- [ ] `WorkerManager.ts` is completely untouched in the diff.
- [ ] All components live exclusively in `src/lib/components/plugins/directory-search/ui/`.
- [ ] No Svelte 4 `writable` stores are used.
