# LocalMind Polyglot (Language Learning Workspace)

## 1. Goal
Create a localized, privacy-first language learning environment ("LocalMind Polyglot") using existing AI primitives in LocalMind. The feature will combine the **WebLLM** engine for conversational tutoring and the **Whisper WASM** engine for speech recognition and pronunciation checking.

## 2. Technical Stack
- **WebLLM (Existing Worker):** Used as the conversational tutor and flashcard generator.
- **Whisper WASM (Existing Worker):** Used for transcribing user audio to provide pronunciation feedback.
- **Browser TTS (Web Speech API):** Used for speaking AI responses aloud (listening comprehension).
- **DuckDB/SQLite (Existing Worker):** Used for storing user vocabulary lists, progress, and flashcard history.
- **Svelte UI:** A dedicated route (`/polyglot`) with chat-like interface and spaced repetition UI.

## 3. Conflict-Free Execution (Parallel Sets)
- **Safe:** This task relies entirely on *existing* workers (`getWebLLM`, `getWhisper`, `getDuckDB`). It does **not** need to modify `WorkerManager.ts`. 
- **Set 12:** It is placed in Set 12 alongside Crypto and Whiteboard because it only involves creating a new `/polyglot` route and UI components.

## 4. Acceptance Criteria
- [ ] Implement a `/polyglot` UI route.
- [ ] Integrate Web Speech API (TTS) so the AI responses can be played out loud.
- [ ] Connect the UI to the existing Whisper worker to record and transcribe audio input.
- [ ] Connect the UI to the WebLLM worker with a pre-configured language tutor system prompt.
- [ ] Implement a simple "Save Word" feature that writes to the local SQLite/DuckDB database for future flashcard usage.
