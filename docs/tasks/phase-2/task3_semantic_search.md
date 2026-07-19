# Task 3: Local Semantic Search

## Objective
Implement local semantic search across extracted document text using Transformers.js to generate embeddings in the browser.

## Prerequisites
- Completion of Tasks 1 and 2.
- Review `docs/specs/phase-2/01_document_workspace_spec.md`.

## Implementation Steps

### 1. Transformers.js Setup
- Install `@xenova/transformers`.
- Create a dedicated Web Worker (`src/lib/workers/transformers.worker.ts`).
- Implement initialization logic to load a small embedding model (e.g., `Xenova/all-MiniLM-L6-v2`). Note: Model downloading should be cached using the browser's Cache API.

### 2. Embedding Generation
- Handle the `GENERATE_EMBEDDINGS` action.
- When document text is extracted (from previous tasks), split it into paragraphs or chunks.
- Send the chunks to the Transformers worker to generate vector embeddings.
- Store the chunks and their corresponding vector embeddings in IndexedDB.

### 3. Search UI
- Create a search input field.
- When a query is entered, generate an embedding for the query string.
- Perform a local cosine similarity search against the stored document embeddings.
- Display the most relevant paragraphs as search results.

## Acceptance Criteria
- [ ] Transformers.js successfully loads the model locally.
- [ ] Embeddings are generated for document text and stored.
- [ ] Users can perform semantic searches (searching by meaning, not just exact keywords) and receive accurate results instantly.
