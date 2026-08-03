TASK: Phase 3 — Task 4: Podcast & Meeting Summarizer (Media Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline summarization tool for audio/video files. The user will upload a media file, which will be transcribed using the existing Whisper worker, and then summarized using the existing WebLLM worker into action items and key takeaways.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Under no circumstances should `src/lib/workers/WorkerManager.ts` be modified. 
- Reuse Existing Workers: Delegate transcription strictly to the existing Whisper worker singleton and summarization to the existing WebLLM singleton.
- Purely Offline: All processing must happen strictly within the browser. Absolutely no API calls to external cloud providers.
- Non-Blocking: Audio decoding and LLM generation must not block the main UI thread.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/plugins/summarizer/` (Target directory for the new route)
- `src/lib/workers/WorkerManager.ts` (For retrieving WebLLM and Whisper singletons: `WorkerManager.getInstance().getWhisperWorker()` etc.)
- `src/lib/components/ui/` (Use existing UI primitives: `Button.svelte`, `Card.svelte`, `Progress.svelte`, `Dropzone.svelte`)
- State Management: The project uses Svelte 5. You must use `$state()` runes for reactive variables (do NOT use Svelte 4 stores/reactive statements).

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
1. **Audio Decoding & Chunking:** 
   - Use the `Web Audio API` (AudioContext) to decode the uploaded file into a `Float32Array` before sending it to the Whisper worker.
   - **Crucial:** If the audio is long (>10 minutes), you must chunk the `Float32Array` into smaller segments (e.g., 5-minute blocks) and feed them to the Whisper worker sequentially to prevent memory crashes.
2. **Map-Reduce Summarization:**
   - LLMs have finite context windows. If the transcript is extremely long, split the transcript text into chunks.
   - Ask the LLM to summarize each chunk individually (Map), then pass all the chunk summaries back to the LLM to create a final, cohesive summary (Reduce).
3. **UI/UX Flow:**
   - Display a step-by-step progress indicator: [1. Decoding Media] -> [2. Transcribing: 45%] -> [3. Generating Summary].
   - Render the final output in Markdown using a Markdown rendering component if available, ensuring clear headings ("Key Takeaways", "Action Items").
4. **Export Options:**
   - Implement "Export as Markdown" and "Copy to Clipboard" buttons. Use `URL.createObjectURL(new Blob([...]))` for file downloads.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/summarizer/+page.svelte`
2. NEW: `src/lib/components/plugins/summarizer/SummarizerPipeline.svelte`
3. NEW: `src/lib/components/plugins/summarizer/AudioChunker.ts` (Utility for audio chunking)

Commit: "feat: Phase 3 Task 4 Podcast and Meeting Summarizer"
Target branch: feature/task4-summarizer
