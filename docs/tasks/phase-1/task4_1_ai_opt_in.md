# Task 4.1: Enforce "AI Off By Default" (Privacy-First)

## Objective
Update the existing Consent-Gated AI Insights implementation to enforce the new "AI Off By Default" privacy policy. All AI models (even local ones like WebLLM) must be disabled by default to conserve user resources (RAM/Battery).

## Prerequisites
- Review `docs/wiki/Philosophy.md`.
- Ensure Task 4 (Consent-Gated AI Insights) is complete.

## Implementation Steps

### 1. Update LLM Worker Contract
- Modify `src/lib/workers/llm.worker.ts` to fully implement the updated `LLMWorkerContract`.
- Implement `isAIEnabled(): Promise<boolean>`. This should read from a user settings store (e.g., IndexedDB or `localStorage`). Default value must be `false`.
- Implement `enableAI(): Promise<void>`. This should update the store to `true` and trigger any necessary pre-loading or model caching.

### 2. Update Embeddings Worker
- Update `src/lib/workers/embeddings.worker.ts` to implement `isAIEnabled()` and `enableAI()` matching the updated `EmbeddingsWorkerContract`.

### 3. Implement Opt-In UI Flow
- In the UI where the "Ask AI to Analyze" button resides, wrap the AI logic in a check to `isAIEnabled()`.
- If `isAIEnabled()` returns `false`, clicking the button should present a modal:
  > **Enable Local AI?**
  > LocalMind uses AI to analyze your data. To protect your privacy and conserve your device's memory and battery, AI is disabled by default. 
  > Enabling AI will download a local model (approx 1.5GB) to your browser. Your data will never leave your machine.
- Provide an "Enable AI" button. When clicked, call `enableAI()` on the workers, and show a progress state for the model download.

### 4. Settings Management
- Add an "AI Capabilities" section to the global settings panel.
- Allow the user to toggle AI off. Toggling off should ideally purge the cached models or at least prevent them from loading into RAM.

## Definition of Done
- App loads with AI capabilities completely disabled by default.
- Models (WebLLM / Transformers.js) do not consume RAM until explicitly enabled.
- The user is presented with a clear privacy and resource warning before enabling AI.
- The UI handles the transition smoothly and persists the user's choice.
