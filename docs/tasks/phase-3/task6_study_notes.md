TASK: Phase 3 — Task 5: Study Note & Flashcard Generator (Media Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an educational tool that takes audio/video lectures or raw text as input, transcribes them (if media), and uses the WebLLM worker to extract key concepts into structured study notes and interactive, Anki-compatible flashcards (Q&A format).

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Under no circumstances should `src/lib/workers/WorkerManager.ts` be modified.
- Reuse Existing Workers: Delegate transcription to the Whisper worker and flashcard generation to the WebLLM worker.
- Purely Offline: All data must remain local. No external servers.

═══════════════════════════════════════════════════════════════
CONTEXT — EXISTING REPO LAYOUT & ARCHITECTURE
═══════════════════════════════════════════════════════════════
- `src/routes/plugins/study-notes/` (Target directory for the new route)
- `src/lib/workers/WorkerManager.ts` (For retrieving WebLLM and Whisper singletons)
- `src/lib/components/ui/` (Use standard UI primitives)
- State Management: Svelte 5 `$state()` runes must be used. Svelte 4 reactivity is deprecated in this project.

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
1. **Input Flexibility:**
   - Provide a Tabbed UI allowing the user to either "Paste Text/Notes" OR "Upload Lecture Audio". If audio is uploaded, route it through the Whisper transcription pipeline first.
2. **Prompt Engineering & JSON Extraction:**
   - Use a strict system prompt instructing the LLM to output a JSON array of flashcards. 
   - Example prompt: `Extract 10 key concepts from the following text and return them as a JSON array exactly matching this format: [{"q": "Question text", "a": "Answer text"}]. Do not include markdown formatting or extra text outside the JSON.`
   - Write a robust parser that can extract the JSON array even if the LLM wraps it in markdown code blocks (` ```json ... ``` `).
3. **Interactive Flashcard UI:**
   - Build a `FlashcardViewer.svelte` component with smooth CSS 3D transforms (`transform: rotateY(180deg)`) for flipping the card.
   - Include Next, Previous, and Shuffle buttons to iterate through the array of generated cards.
4. **Anki Integration (Export):**
   - Provide an "Export to Anki" button.
   - Generate a standard CSV format where the first column is the front of the card, the second column is the back, and the separator is a comma or tab. Ensure quotes inside the text are properly escaped for CSV compliance.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/study-notes/+page.svelte`
2. NEW: `src/lib/components/plugins/study-notes/FlashcardViewer.svelte`
3. NEW: `src/lib/components/plugins/study-notes/FlashcardGenerator.ts` (LLM prompt & parsing logic)

Commit: "feat: Phase 3 Task 5 Study Note and Flashcard Generator"
Target branch: feature/task5-study-notes
