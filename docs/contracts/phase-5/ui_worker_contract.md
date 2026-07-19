# Phase 5: UI to Worker Message Contract

## 1. Overview
This contract defines message passing for Phase 5 workers: `webllm` (local LLM inference via WebGPU). Whisper transcription reuses the Phase 3 `whisper` worker. Semantic embeddings reuse the Phase 2 `onnx` worker.

## 2. Message Envelope
Identical to Phase 1 (`docs/contracts/phase-1/ui_worker_contract.md`).

## 3. WebLLM Worker Actions

> ⚠️ **WebGPU Required**: The WebLLM worker requires WebGPU support. The WorkerPool must check `navigator.gpu` before spawning this worker. If WebGPU is unavailable, return a graceful error prompting the user to use Cloud AI features instead.

### 3.1 Initialize WebLLM
- **Action**: `INIT`
- **Request Payload**: `{ modelId: string; quantization?: 'q4f32_1' | 'q4f16_1' }` (e.g., `'Phi-3-mini-4k-instruct'`)
- **Response Data**: `{ ready: boolean; modelId: string; contextLength: number }`
- **Progress Events**: Worker emits `DOWNLOAD_PROGRESS` messages during model download: `{ id: string; loaded: number; total: number; phase: 'downloading' | 'loading' }`.

### 3.2 Chat Completion
- **Action**: `CHAT`
- **Request Payload**:
  ```typescript
  {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    maxTokens?: number;    // default: 512
    temperature?: number;  // default: 0.7
    stream: boolean;       // if true, worker emits TOKEN_STREAM events
  }
  ```
- **Response Data** (non-streaming): `{ content: string; tokenCount: number; durationMs: number }`
- **Token Stream Events** (streaming): Worker emits intermediate messages `{ id: string; action: 'TOKEN_STREAM'; data: { token: string; done: boolean } }`.

### 3.3 Context-Aware Completion (RAG Mode)
- **Action**: `CHAT_WITH_CONTEXT`
- **Request Payload**:
  ```typescript
  {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    contextChunks: string[]; // Retrieved chunks from the local vector store (Transformers.js)
    maxTokens?: number;
    stream: boolean;
  }
  ```
- **Response Data**: Same as `CHAT`. The worker prepends context chunks to the system prompt internally.

### 3.4 Reset Chat History
- **Action**: `RESET`
- **Request Payload**: `{}`
- **Response Data**: `{ cleared: boolean }`

### 3.5 Unload Model
- **Action**: `UNLOAD`
- **Request Payload**: `{}`
- **Response Data**: `{ unloaded: boolean; freedMB: number }`
