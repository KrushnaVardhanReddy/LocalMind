# Task 1: WebLLM Engine Setup

## Objective
Implement the WebLLM Web Worker to load and run local LLM models (Phi-3, Gemma, Llama 3.2) via WebGPU directly in the browser — no API key, no internet, no data leaving the device.

## Prerequisites
- Review `docs/specs/phase-5/01_intelligence_spec.md`.
- Phase 1 WorkerPool must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add @mlc-ai/web-llm
```

### 2. WebGPU Availability Check
- Create `src/lib/utils/webgpu-check.ts`.
- Export `checkWebGPUSupport(): { supported: boolean; reason?: string }`.
- If `!navigator.gpu`, return `{ supported: false, reason: 'WebGPU is not supported in this browser. Use Chrome 113+ or Edge 113+.' }`.
- Call this in `+layout.svelte` and display a banner on the Intelligence page if unsupported.

### 3. Create the WebLLM Worker
- Create `src/lib/workers/webllm.worker.ts`.
- Implement `WebLLMWorkerContract` from `docs/specs/phase-5/01_intelligence_spec.md`.
- `loadModel(modelId, onProgress)`: use `CreateMLCEngine(modelId, { initProgressCallback: onProgress })`.
- `chat(messages)`: implement as an `AsyncGenerator` using `engine.chat.completions.create({ stream: true })`, yielding each delta token.
- `unloadModel()`: call `engine.unload()`.
- Call `expose(new WebLLMService())`.

### 4. Register with WorkerManager
- Add `WorkerManager.getWebLLM()`.

### 5. Model Download UI
- On `loadModel()`, forward `onProgress` events to a download modal:
  - Show: model name, total size, download percentage, estimated time remaining.
  - "Cancel" button calls `unloadModel()` and closes the modal.

## Definition of Done
- Selecting "Phi-3-mini" and clicking "Load Model" shows the download progress modal.
- After loading, `getLoadedModel()` returns the correct model ID.
- `unloadModel()` successfully frees GPU memory (verify via browser Task Manager).
- **No mocks.** Real WebLLM downloads and runs real model weights.
- On a machine without WebGPU, the error banner renders and the Intelligence section is gracefully disabled.
