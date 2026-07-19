# Task 2: Local Chat Interface

## Objective
Build a chat UI for interacting with the local LLM.

## Prerequisites
- Completion of Task 1.

## Implementation Steps

### 1. Chat UI Component
- Build a standard conversational UI (message history, input field).
- Add Markdown rendering support for the LLM's responses.

### 2. Connection to Engine
- Connect the UI to the WebLLM worker.
- Handle streaming text updates to create a typewriter effect as tokens arrive.

### 3. Hardware Fallbacks
- If WebGPU is not supported, display a friendly message explaining the hardware requirements and offer the Cloud AI consent bridge as an alternative.

## Acceptance Criteria
- [ ] Users can hold a conversation with the local LLM.
- [ ] The UI remains responsive during generation.
- [ ] Graceful degradation exists for unsupported browsers.
