# Task 2: Local Chat Interface

## Objective
Build a polished, streaming local chat interface that communicates with the WebLLM worker — displaying token-by-token streamed responses, a model selector, a system prompt configurator, and full conversation history.

## Prerequisites
- Review `docs/specs/phase-5/01_intelligence_spec.md`.
- Task 1 (WebLLM Engine) must be complete.

## Implementation Steps

### 1. Build the Chat UI
- Create `src/routes/intelligence/chat/+page.svelte`.
- Layout: full-height chat interface (similar to ChatGPT UI).
  - Header: model selector dropdown + "Unload Model" button.
  - Message list: scrollable, with user messages on the right and assistant messages on the left.
  - Typing indicator: three animated dots while the model is generating.
  - Input bar: multiline `<textarea>` with `Ctrl+Enter` to send.

### 2. Streaming Token Display
- Call `WorkerManager.getWebLLM().chat(messages)`.
- Iterate the `AsyncGenerator`, appending each token chunk to the current assistant message.
- Use a Svelte writable store for `currentResponse` — update it on each yielded chunk.
- Render the growing response with a blinking cursor at the end.
- Scroll to the bottom automatically as new tokens arrive.

### 3. System Prompt Configuration
- Add a "System Prompt" collapsible panel above the chat input.
- Pre-filled default: "You are LocalMind Assistant, a helpful local AI. All processing is done on this device."
- Allow the user to edit and save the system prompt to wa-sqlite preferences.

### 4. Conversation History
- Store the full `ChatMessage[]` history in a Svelte store.
- "New Chat" button clears the store and starts a fresh conversation.
- "Export Chat" button downloads the conversation as a `.md` file.

### 5. Privacy Badge
- Display a permanent green badge: "🔒 Running locally — no data sent anywhere."

## Definition of Done
- Sending "Hello, who are you?" to Phi-3-mini produces a streaming response.
- Each token appears incrementally — the full response is not displayed all at once.
- The system prompt is saved and restored across page refreshes.
- **No mocks.** Real WebLLM streaming is used.
- The privacy badge is always visible during an active chat session.
