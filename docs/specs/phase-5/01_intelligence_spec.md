# Spec: Phase 5 — LocalMind Intelligence (Local LLM & AI Engine)

## 1. Overview
LocalMind Intelligence is a future plugin providing a fully local, on-device LLM experience using WebLLM (WebGPU-accelerated). Users can run Phi-3, Gemma, or Llama 3.2 locally in the browser — no API key, no internet, no data leaving the device.

## 2. WASM/WebGPU Engines

| Engine | Package | Purpose |
|---|---|---|
| WebLLM | `@mlc-ai/web-llm` | Local LLM inference via WebGPU (Phi-3, Gemma, Llama 3.2) |
| Transformers.js | `@xenova/transformers` | NLP tasks: embeddings, classification, summarization |

## 3. Architecture

```mermaid
graph TD
    UI[Chat UI] --> WM[WorkerManager]
    WM --> LW[WebLLM Worker]
    LW --> WebGPU[WebGPU — GPU Acceleration]
    LW --> Cache[Cache Storage — Model Weights]

    subgraph Model Weights (Browser Cache)
        Cache
    end
```

## 4. Supported Models (Launch Set)

| Model | Size | VRAM Required | Use Case |
|---|---|---|---|
| `Phi-3-mini-4k-instruct-q4` | ~2.3GB | ~3GB | General chat, code Q&A |
| `Gemma-2b-it-q4f32_1` | ~1.5GB | ~2GB | Lightweight general chat |
| `Llama-3.2-1B-Instruct-q4f16_1` | ~1GB | ~1.5GB | Fastest option |

## 5. Features

### 5.1 Local Chat Interface
- Standard chat UI with message history.
- System prompt configuration.
- Streaming token output (rendered incrementally as tokens arrive).
- Model switcher dropdown.

### 5.2 Local AI Data Janitor
- Accept a DuckDB query result (from the Analytics workspace) or a raw text blob.
- Apply structured transformations guided by natural language (e.g., "normalize all phone numbers to E.164 format").
- The LLM generates a SQL UPDATE or Python-style transformation; user reviews and confirms before execution.

### 5.3 Retrieval-Augmented Generation (RAG)
- Combine the Embeddings worker (Phase 2) with WebLLM.
- User drops documents → indexed as vectors in wa-sqlite.
- Chat queries retrieve relevant chunks → injected into the LLM context window.
- Full RAG pipeline, fully offline.

### 5.4 Local Vision Chat (Multimodal) (Task 4)
- **Objective:** Support image drops in the chat using vision-language models (e.g., LLaVA) via WebGPU.
- **Pipeline:** Image → HTMLCanvas → Tensor → WebLLM Multimodal engine.
- **Use Cases:** Offline diagram-to-code generation, screenshot OCR, and visual analysis.

## 6. Worker Contract

```typescript
// docs/contracts/phase-5/webllm_worker_contract.ts

export interface WebLLMWorkerContract {
    loadModel(modelId: string, onProgress?: (progress: number, text: string) => void): Promise<void>;
    chat(messages: ChatMessage[], systemPrompt?: string): AsyncGenerator<string>; // streaming
    complete(prompt: string, maxTokens?: number): Promise<string>;
    getLoadedModel(): Promise<string | null>;
    unloadModel(): Promise<void>;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
```

## 7. Invariants
1. **WebGPU is required** — if `navigator.gpu` is undefined, display: "Your browser or device does not support WebGPU. Local LLM inference is unavailable."
2. **Model weights are cached in the browser's Cache Storage** — first load is slow; subsequent loads are instant.
3. **No data is sent anywhere** — the LLM runs 100% locally; this guarantee must be visible in the UI.
4. **Memory guard:** After loading a model, check `navigator.deviceMemory` (if available). Warn if < 4GB RAM.
5. **Unload on navigate:** When leaving the Intelligence section, call `unloadModel()` to free GPU memory.
