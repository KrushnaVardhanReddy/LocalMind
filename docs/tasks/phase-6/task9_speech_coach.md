# LocalMind AI Speech & Articulation Coach

## 1. Goal
Provide a private, lightweight speech coaching interface that records a user's speech, transcribes it, and analyzes pacing and filler words to improve their articulation and public speaking.

## 2. Technical Stack
- **Whisper WASM (Existing Worker):** Used to transcribe speech and generate timestamps for pacing calculations.
- **WebLLM (Existing Worker):** Used to provide qualitative feedback on persuasiveness, clarity, and conciseness.
- **Svelte UI:** A dedicated route (`/speech-coach`) with a "Start/Stop Recording" button and a feedback dashboard showing Words Per Minute (WPM), filler word count, and a transcribed review.
- **Regex/JS Logic:** Used to instantly highlight and count filler words ("um", "uh", "like", "you know") in the generated transcript.

## 3. Conflict-Free Execution (Parallel Sets)
- **Safe:** This task relies entirely on *existing* workers (`getWhisper` and `getWebLLM`). It does **not** need to modify `WorkerManager.ts`. 
- **Set 15:** Placed alongside other advanced plugins that are pure JS/UI wrappers around existing capabilities.

## 4. Acceptance Criteria
- [ ] Implement a `/speech-coach` UI route with microphone access and recording capabilities.
- [ ] Feed the recorded audio stream to the `Whisper` worker and display live or post-recording transcription.
- [ ] Use the transcription timestamps to calculate and display the speaker's **Words Per Minute (WPM)**.
- [ ] Run a regex/array check over the transcript to highlight filler words (e.g., "um", "uh", "literally", "like") and show a total count.
- [ ] Feed the final transcript to the `WebLLM` worker with a strict system prompt (e.g., "Act as an executive communication coach. Critique the clarity and conciseness of this pitch.") and display the critique in the UI.
