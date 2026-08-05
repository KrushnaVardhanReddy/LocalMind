# E2E Fix Wave 2a — Phase 2 (Docs) + Phase 3 (Media/FFmpeg)

## Objective
Run the Phase 2 and Phase 3 E2E test suites, identify every failing test, read the relevant source files to understand the actual DOM and component structure, then fix both the tests and any source bugs you find. Check fixture files exist and create any that are missing.

## How to Work

1. Start the dev server: `bun run dev`
2. Run: `bunx playwright test tests/phase-2/ tests/phase-3/ --project=chromium`
3. For every failing test:
   - Read the error and page snapshot in `test-results/`
   - Open the relevant source component(s) in `src/`
   - Fix the test selector to match the actual DOM **or** fix the source bug if the component is broken
   - Re-run until that test passes
4. For any test that requires a missing fixture file — create a minimal valid fixture at the path the test expects
5. For any test that depends on a WASM engine (Tesseract, Whisper, FFmpeg) that genuinely cannot run headlessly without GPU: add `test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1')` — do NOT delete the test
6. Run `bun run check` — zero TypeScript errors required before committing

## Known Issues to Fix First

### `tests/phase-2/search.spec.ts`

**Bug A — Missing fixture:** Line 13 references `tests/fixtures/docs/search_target.pdf`. Check if it exists. If not, create the directory and a minimal valid PDF at that path whose text layer contains the phrase "machine learning" so the semantic search assertion passes.

**Bug B — `button[data-testid="tab-extract"]`:** Open `src/routes/docs/+page.svelte` and the docs workspace component. If this `data-testid` doesn't exist on the button, add it to the source — or update the test to use `getByRole('button', { name: /extract/i })` to match what the source actually renders.

**Bug C — `input[aria-label="Semantic search query"]`:** Verify this `aria-label` exists on the search input in the docs workspace source. If missing, add it to the source.

**Bug D — `section[data-testid="sidebar-search-panel"]`:** Verify this `data-testid` exists on the search results wrapper. Add it to the source element if missing, or update the test to use a text/role-based selector.

### `tests/phase-3/ffmpeg.spec.ts`

**Bug A — Missing fixture:** Lines 26 and 64 reference `tests/fixtures/media/sample_video.mp4`. Check if it exists. If not, create `tests/fixtures/media/` and a minimal valid MP4 file (even 1 second of silent video) that FFmpeg.wasm can process.

**Bug B — Tab selectors:** The test uses `filter({ hasText: /transcode/i })` and `filter({ hasText: /extract/i })`. Open `src/routes/media/+page.svelte` and verify the exact button labels. Update the regex patterns to match whatever the source renders.

### `tests/phase-3/whisper.spec.ts` and `tests/phase-3/summarizer.spec.ts`

These require WASM engines that may not load in headless Playwright. Open each file. If they don't already have an env-flag skip guard, add: `test.skip(!process.env.RUN_WASM_TESTS, 'Requires WASM/GPU — set RUN_WASM_TESTS=1')` at the top of each test. Do NOT delete the tests.

## All Other Tests — Fix the Same Way

After fixing the known issues above, re-run the full suite and fix any remaining failures in all spec files using the same approach: read the source component, identify the real selector or real bug, fix it, re-run.

## Phase 2 Test Files
- `tests/phase-2/search.spec.ts`
- `tests/phase-2/ocr.spec.ts`
- `tests/phase-2/pdf.spec.ts`
- `tests/phase-2/redaction.spec.ts`
- `tests/phase-2/mermaid.spec.ts`
- `tests/phase-2/excalidraw.spec.ts`
- `tests/phase-2/doc-diff.spec.ts`

## Phase 3 Test Files
- `tests/phase-3/ffmpeg.spec.ts`
- `tests/phase-3/whisper.spec.ts`
- `tests/phase-3/summarizer.spec.ts`
- `tests/phase-3/clipper.spec.ts`
- `tests/phase-3/study-notes.spec.ts`

## Source Files to Reference
- `src/routes/docs/+page.svelte`
- `src/routes/media/+page.svelte`
- `src/lib/components/workspace/panels/DocsWorkspace.svelte` (if exists)
- `src/lib/components/workspace/panels/MediaWorkspace.svelte` (if exists)
- Any component files under `src/lib/components/` related to docs, OCR, redaction, mermaid, excalidraw
- Any component files under `src/lib/components/` related to FFmpeg, Whisper, clipper, summarizer

## Fixture Files to Check
- `tests/fixtures/docs/` — check for any PDF referenced by phase-2 specs; create if missing
- `tests/fixtures/media/sample_video.mp4` — check if exists; create a minimal valid MP4 if missing
- `tests/fixtures/sample.mp3` — check content; replace with a real minimal MP3 if the test requires audio data

## Definition of Done
- `bunx playwright test tests/phase-2/ --project=chromium` — all tests pass or have explicit skip guards
- `bunx playwright test tests/phase-3/ --project=chromium` — all tests pass or have explicit skip guards
- `bun run check` — zero TypeScript errors
- Commit message: `jules: fix e2e phase2+3 selectors, fixtures, and wasm guards`
