# Task 4: Local Vision Chat (Multimodal)

## Objective
Support multimodal AI interactions by allowing users to drag and drop images into the chat and query them using small local vision-language models (e.g., LLaVA or similar) running via WebGPU.

## Prerequisites
- WebLLM Engine (Phase 5 Task 1).

## Implementation Steps
1. **Model Support:** Configure WebLLM to load a vision-language model.
2. **UI Updates:** Update the Chat UI to accept image drops and render them as attachments in the message input.
3. **Processing:** Pass the image tensor alongside the text prompt to the WebLLM engine.
4. **Use Cases:** Specifically test for diagram-to-code, OCR reading, and image description.

## Definition of Done
- User can drag a screenshot into the chat and ask "What is in this image?", receiving an accurate offline answer.
