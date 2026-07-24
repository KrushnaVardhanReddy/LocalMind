# LocalMind Kids Learning & Reading Buddy

## 1. Goal
Create a 100% offline, private, and distraction-free learning environment for children. The workspace will act as an interactive reading buddy and a safe "My First AI" tutor, ensuring no audio or data is sent to the cloud.

## 2. Technical Stack
- **WebLLM (Existing Worker):** Used with strict, kid-friendly system prompts to generate stories or act as a Socratic math/science tutor.
- **Whisper WASM (Existing Worker):** Used to transcribe the child reading out loud.
- **Browser TTS (Web Speech API):** Used to read stories aloud or sound out difficult words for early literacy.
- **Svelte UI:** A dedicated route (`/kids`) featuring a playful, simplified interface with larger text and easy-to-use microphone buttons.

## 3. Conflict-Free Execution (Parallel Sets)
- **Safe:** This task relies entirely on *existing* workers (`getWhisper` and `getWebLLM`). It does **not** need to modify `WorkerManager.ts`. 
- **Set 15:** Placed alongside other advanced plugins that are pure JS/UI wrappers around existing capabilities.

## 4. Acceptance Criteria
- [ ] Implement a `/kids` UI route tailored for young users (larger fonts, simplified buttons).
- [ ] Implement the **"Interactive Story"** component: The UI requests a story from WebLLM, displays it, and allows the child to click "Read to me" (via TTS).
- [ ] Implement the **"Reading Buddy"** component: The child clicks "I want to read", speaks into the microphone (via Whisper), and the UI compares the transcript to the story text to highlight words they got right.
- [ ] Implement the **"Safe AI Tutor"** chat: A chat interface locked to a specific WebLLM system prompt (e.g., "You are a friendly teacher for a 7-year-old. Never give the direct answer to a math problem; only give hints. Keep answers short and safe.")
