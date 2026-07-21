# Task 3: Local Semantic Search

## Objective
Implement a local, fully offline semantic search engine over a corpus of documents using Transformers.js (all-MiniLM-L6-v2 embeddings) and cosine similarity — enabling users to search by meaning, not just keywords.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md` (Section 4.4).
- Review `docs/contracts/phase-2/docs_worker_contracts.md` (EmbeddingsWorkerContract).
- Tasks 1 (OCR) and wa-sqlite (cross-cutting) must be complete — text and vectors are stored in wa-sqlite.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add @xenova/transformers
```

### 2. Create the Embeddings Worker
- Create `src/lib/workers/embeddings.worker.ts`.
- In `init()`, load the `Xenova/all-MiniLM-L6-v2` pipeline using `pipeline('feature-extraction', ...)`.
- `embed(text: string)`: normalize the output vector (L2 norm) before returning.
- `embedBatch(chunks: string[])`: process in batches of 32 to avoid OOM errors.
- Call `expose(new EmbeddingsService())`.

### 3. Extend wa-sqlite Schema
- Add two tables to the wa-sqlite schema (extend via migration):
  ```sql
  CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding BLOB NOT NULL -- 384 float32 values stored as raw bytes
  );
  ```
- `embedding` is stored as a raw `Float32Array` serialized to `ArrayBuffer`.

### 4. Indexing Pipeline
- When a document is OCR'd or text-extracted, chunk its text into ~256-token chunks with 32-token overlap.
- For each chunk, call `EmbeddingsWorkerContract.embed()`.
- Store chunk text + embedding vector in wa-sqlite `document_chunks` table.

### 5. Search UI
- Add a search bar to the Docs section header.
- On query submit:
  1. Embed the query string using `EmbeddingsWorkerContract.embed()`.
  2. Load all `document_chunks` embeddings from wa-sqlite.
  3. Compute cosine similarity between query embedding and all chunk embeddings (in a Worker).
  4. Return the top-10 most similar chunks, sorted by score.
- Render results as cards: file name, chunk excerpt (highlighted matching text), similarity score.

## Definition of Done
- Indexing 20 PDF documents completes in under 30 seconds.
- Searching "invoices from California suppliers" returns documents containing that semantic meaning even if the exact phrase doesn't appear.
- **No mocks, no cloud.** Transformers.js runs in a Worker; all vectors live in wa-sqlite.
- Similarity search returns results within 1 second for a 1,000-chunk corpus.
