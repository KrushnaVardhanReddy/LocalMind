# Phase 2: Document Workspace Specification

## 1. Overview
The Document Workspace allows users to extract text, search, and perform semantic analysis on documents (PDFs, DOCX, Images) entirely locally. It uses various WASM technologies to avoid sending sensitive documents to external cloud APIs for parsing.

## 2. Core Features

### 2.1 Local Document Parsing
- **PDF Extraction**: Parse and extract text from PDFs locally using MuPDF WASM or PDF.js.
- **DOCX Extraction**: Parse DOCX files and extract content using mammoth.js or similar local libraries.
- **OCR (Optical Character Recognition)**: Extract text from images and scanned PDFs using Tesseract WASM.

### 2.2 Advanced Document Operations
- **PDF Manipulation**: Merge multiple PDFs, split pages, and apply basic redactions using MuPDF WASM.
- **Universal Conversion**: Convert Markdown to DOCX, PDF to HTML, etc., using Pandoc WASM.

### 2.3 Search Capabilities
- **Full-Text Search**: Implement local full-text search across parsed documents (e.g., using a local indexing library like lunr.js or flexsearch).
- **Semantic Search**: Use Transformers.js with a small embedding model (e.g., all-MiniLM-L6-v2) to generate embeddings locally. Search paragraphs by meaning, not just exact keywords.

## 3. Optional Cloud AI Integration
- **Summarization**: Users can choose to send the extracted text (or a specific section) to the Cloud AI for summarization, governed by the same strict consent dialog as Phase 1.
- **Key Entity Extraction**: Optionally use AI to extract key entities if local extraction is insufficient, again behind a consent dialog.

## 4. Architecture & Threading
- **Isolation**: Parsing engines (Tesseract, MuPDF, Transformers.js) MUST run in dedicated Web Workers to avoid blocking the UI thread during heavy operations.
- **Storage**: Store extracted text, search indices, and embeddings in IndexedDB for fast retrieval across sessions.
