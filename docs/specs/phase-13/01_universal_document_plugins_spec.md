# Spec: Phase 13 — Universal Document Plugins (MVP3 Wave E)

## 1. Overview
Phase 13 consolidates numerous niche document analysis tasks (Legal, Education, Construction, Medical) into two highly generalized, powerful workspaces:
1. **Universal Document Q&A Workspace**: For deep analysis of a single document (PDF, Text).
2. **Local Directory Semantic Search**: For sweeping semantic search across an entire local filesystem.

Both tools run entirely offline, leveraging existing WASM workers (MuPDF, WebLLM, DuckDB).

---

## 2. Plugin A: Universal Document Q&A Workspace

### 2.1 Engine Utilization
- **Parsing:** `getMuPDF()` — Extracts raw text and renders pages from PDFs.
- **Intelligence:** `getWebLLM()` — Provides chat completions based on the extracted text context.

### 2.2 Functional Requirements
- **Document Ingestion:** Accept `.pdf`, `.md`, and `.txt` via drag-and-drop or file picker.
- **Rendering:**
  - PDFs: Render the current page onto an HTML5 Canvas using MuPDF's WASM binding. Include Next/Prev page controls.
  - Text/Markdown: Render as plain text or parsed HTML.
- **Context Extraction:** Extract the entire document's text (up to a safe token limit, e.g., 20,000 tokens) and store it in memory (`$state`).
- **Chat Interface:** Provide a standard messaging UI. The system prompt must be injected with the document context on every query.

### 2.3 Component Architecture
- `UniversalDocLayout.svelte`: Main wrapper, 2-column CSS Grid.
- `DocumentViewer.svelte`: Left pane containing the canvas/text renderer.
- `DocumentChat.svelte`: Right pane handling WebLLM interactions.

---

## 3. Plugin B: Local Directory Semantic Search

### 3.1 Engine Utilization
- **Parsing:** `getMuPDF()` (for PDFs) + native FileReader (for txt/md).
- **Embedding:** `getTransformers()` (or WebLLM) — Generates dense vector embeddings for text chunks.
- **Vector Database:** `getDuckDB()` — Uses the DuckDB VSS (Vector Similarity Search) extension to store and query embeddings.

### 3.2 Functional Requirements
- **Directory Access:** Use the modern `showDirectoryPicker()` API to grant read-only access to a local folder.
- **Recursive Scan:** Traverse the directory tree, identifying supported files (`.pdf`, `.md`, `.txt`).
- **Chunking & Embedding (The Indexing Phase):**
  - Read each file's text.
  - Split text into overlapping chunks of ~500 words.
  - Send chunks to the embedding worker.
  - Insert results into a DuckDB table: `CREATE TABLE docs (path VARCHAR, content VARCHAR, vec FLOAT[384]);`
- **Semantic Search (The Query Phase):**
  - Embed the user's search query.
  - Execute: `SELECT path, content, array_cosine_similarity(vec, query_vec) AS score FROM docs ORDER BY score DESC LIMIT 10;`
  - Display results with highlighted text snippets.

### 3.3 Component Architecture
- `DirectoryScanner.svelte`: Left pane containing the folder selection button and indexing progress bar.
- `SearchResults.svelte`: Right pane displaying the ranked DuckDB output.

---

## 4. Conflict-Free Contract Rules
- **No Global UI Pollution:** All Svelte components must reside strictly within `src/lib/components/plugins/universal-doc/ui/` or `src/lib/components/plugins/directory-search/ui/`.
- **No Worker Modifications:** `WorkerManager.ts` must remain completely untouched. The required singletons are already registered and exported.
