# Task 7: Offline Chat-with-Docs (Local RAG)

## Objective
Implement a local Retrieval-Augmented Generation (RAG) system where users can chat with a folder of local PDFs using WebLLM and local embeddings.

## Prerequisites
- Requires Phase 5 WebLLM and Phase 2 Semantic Search.

## Implementation Steps
1. **Document Ingestion:** Re-use the MuPDF and Embeddings workers to chunk and embed dropped PDFs into `wa-sqlite` vector tables.
2. **Chat UI:** Create `src/routes/docs/rag/+page.svelte`.
3. **Execution Flow:**
   - User types a query.
   - Generate embedding for query.
   - Run vector similarity search in SQLite to fetch top-K chunks.
   - Construct prompt with context chunks and send to WebLLM.
4. **Citations:** The response must show clickable citations that open the specific PDF page.

## Definition of Done
- User can drop a PDF, ask a question, and get a sourced answer completely offline.
