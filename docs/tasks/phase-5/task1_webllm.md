# Task 1: WebLLM Engine Setup

## Objective
Implement local LLM execution using WebGPU via the WebLLM library.

## Prerequisites
- Review `docs/specs/phase-5/01_intelligence_workspace_spec.md`.
- Ensure development environment supports WebGPU (Chrome/Edge 113+).

## Implementation Steps

### 1. WebLLM Worker Integration
- Install `@mlc-ai/web-llm`.
- Create a dedicated Web Worker (`src/lib/workers/webllm.worker.ts`).
- Implement WebGPU capability detection.

### 2. Model Management
- Handle the `LOAD_LLM_MODEL` action.
- Implement downloading and caching of a specific quantized model (e.g., Phi-3-mini).
- Stream download progress back to the UI.

### 3. Generation Logic
- Handle the `GENERATE_CHAT` action.
- Ensure the model's output is streamed token-by-token back to the UI using the chunk contract.

## Acceptance Criteria
- [ ] The worker successfully detects WebGPU support.
- [ ] A model can be downloaded, cached, and loaded into VRAM.
- [ ] Text generation streams correctly back to the main thread.
