# Phase 2: UI to Worker Message Contract

## 1. Overview
This contract defines message passing between the Main Thread (SvelteKit UI) and the Phase 2 Web Workers: `tesseract` (OCR), `mupdf` (PDF operations), and the `onnx` runner for Transformers.js semantic embeddings. All workers use the same envelope format established in Phase 1.

## 2. Message Envelope
Identical to Phase 1 (`docs/contracts/phase-1/ui_worker_contract.md`):
```typescript
type WorkerMessage<T = any> = { id: string; action: ActionType; payload: T };
type WorkerResponse<T = any> = { id: string; status: 'SUCCESS' | 'ERROR'; data?: T; error?: string };
```

## 3. Tesseract Worker Actions

### 3.1 Initialize OCR Engine
- **Action**: `INIT`
- **Request Payload**: `{ language: string }` (default `'eng'`)
- **Response Data**: `{ ready: boolean; version: string }`

### 3.2 Recognize Text from Image
- **Action**: `RECOGNIZE`
- **Request Payload**: `{ imageData: ArrayBuffer }` (transferable)
- **Response Data**:
  ```typescript
  { text: string; confidence: number; words: Array<{ text: string; confidence: number; bbox: BoundingBox }> }
  ```

## 4. MuPDF Worker Actions

### 4.1 Initialize MuPDF Engine
- **Action**: `INIT`
- **Request Payload**: `{}`
- **Response Data**: `{ ready: boolean; version: string }`

### 4.2 Load PDF
- **Action**: `LOAD_PDF`
- **Request Payload**: `{ fileBuffer: ArrayBuffer }` (transferable)
- **Response Data**: `{ pageCount: number; title?: string }`

### 4.3 Extract Text from PDF
- **Action**: `EXTRACT_TEXT`
- **Request Payload**: `{ pageRange?: [number, number] }` (null = all pages)
- **Response Data**: `{ pages: Array<{ pageNumber: number; text: string }> }`

### 4.4 Merge PDFs
- **Action**: `MERGE_PDFS`
- **Request Payload**: `{ fileBuffers: ArrayBuffer[] }`
- **Response Data**: `{ mergedBuffer: ArrayBuffer }` (transferable)

### 4.5 Split PDF
- **Action**: `SPLIT_PDF`
- **Request Payload**: `{ pageRanges: Array<[number, number]> }`
- **Response Data**: `{ splitBuffers: ArrayBuffer[] }` (transferable)

## 5. Transformers.js / ONNX Worker Actions

### 5.1 Initialize Embedding Model
- **Action**: `INIT`
- **Request Payload**: `{ modelId: string }` (e.g., `'Xenova/all-MiniLM-L6-v2'`)
- **Response Data**: `{ ready: boolean; dimensions: number }`

### 5.2 Embed Text
- **Action**: `EMBED`
- **Request Payload**: `{ texts: string[] }`
- **Response Data**: `{ embeddings: number[][] }` (one embedding vector per input text)

### 5.3 Semantic Search
- **Action**: `SEARCH`
- **Request Payload**: `{ query: string; corpus: Array<{ id: string; text: string }>; topK: number }`
- **Response Data**: `{ results: Array<{ id: string; text: string; score: number }> }`
