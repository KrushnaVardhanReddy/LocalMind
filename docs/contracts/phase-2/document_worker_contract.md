# Phase 2: UI-Worker Contract (Document Workspace)

This contract defines the message-passing structure between the main Svelte UI thread and the Document Processing Web Workers (e.g., Tesseract, MuPDF, Transformers.js).

## 1. Generic Message Structure
(Inherits the generic structure from Phase 1)

```typescript
interface DocumentWorkerMessage<T = any> {
  id: string; // UUID for request tracking
  action: DocumentActionType;
  payload?: T;
}

interface DocumentWorkerResponse<T = any> {
  id: string; // Matches request UUID
  success: boolean;
  data?: T;
  error?: string;
  progress?: number; // Optional progress indicator for long tasks
}
```

## 2. Actions and Payloads

### 2.1 OCR (Tesseract WASM)
**Action**: `EXTRACT_TEXT_OCR`
**Payload**:
```typescript
interface ExtractTextPayload {
  file: File | ArrayBuffer;
  language: string; // e.g., 'eng'
}
```
**Response Data**:
```typescript
interface ExtractTextResult {
  text: string;
  confidence: number;
}
```

### 2.2 Semantic Embeddings (Transformers.js)
**Action**: `GENERATE_EMBEDDINGS`
**Payload**:
```typescript
interface GenerateEmbeddingsPayload {
  texts: string[]; // Array of paragraphs/sentences
}
```
**Response Data**:
```typescript
interface GenerateEmbeddingsResult {
  embeddings: number[][]; // Array of vector arrays
}
```

### 2.3 PDF Manipulation (MuPDF WASM)
**Action**: `MERGE_PDFS`
**Payload**:
```typescript
interface MergePdfsPayload {
  files: ArrayBuffer[];
}
```
**Response Data**:
```typescript
interface MergePdfsResult {
  mergedPdf: ArrayBuffer;
}
```
