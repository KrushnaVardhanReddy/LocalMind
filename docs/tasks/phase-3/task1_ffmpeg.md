# Task 1: FFmpeg WASM Integration

## Objective
Implement the FFmpeg WASM Web Worker for local video transcoding, audio extraction, and clip trimming — all running in the browser without any server upload.

## Prerequisites
- Review `docs/specs/phase-3/01_media_engine_spec.md`.
- Phase 1 WorkerPool must be complete.

## Implementation Steps

### 1. Install Dependencies
*(Already completed by Antigravity in `feature/dev`. No need to run these commands.)*

### 2. Create the FFmpeg Worker
- Create `src/lib/workers/ffmpeg.worker.ts`.
- In `init()`, load the FFmpeg WASM core using `FFmpeg.load()`. Use the CDN path for the core (configure Vite to externalize it) so it is lazy-loaded, not bundled.
- Implement all methods from `FFmpegWorkerContract` (see `docs/specs/phase-3/01_media_engine_spec.md`).
- Forward FFmpeg `progress` events to the UI via a Comlink-exposed callback (`onProgress`).
- Call `expose(new FFmpegService())`.

### 3. Register with WorkerManager
*(Already completed by Antigravity. `getFFmpeg()` is already in `WorkerManager.ts`.)*

### 4. Build the Media UI
- Create `src/routes/media/+page.svelte` with three sub-tabs: **Transcode**, **Trim**, **Extract Audio**.
- **Transcode tab:** file drop zone + source/target format selectors + quality settings + "Convert" button + download link.
- **Trim tab:** file drop zone + start/end time inputs + preview thumbnail + "Trim" button.
- **Extract Audio tab:** file drop zone + output format selector + "Extract" button.
- Progress bar bound to `onProgress` callback.

### 5. File Size Warning
- After file drop, check `file.size`. If > 500MB, display: "Large file detected (X GB). Processing may take several minutes."
- If > 2GB, add: "Warning: Browser memory limits may apply. The Desktop app supports unlimited file sizes."

## Definition of Done
- Converting a 100MB `.mov` file to `.mp4` completes successfully and downloads.
- The progress bar updates throughout the conversion.
- Trimming a 30-second clip from a 5-minute video produces the correct output.
- **No mocks.** Real FFmpeg WASM does all processing.
- The main thread remains responsive (UI animations work) during FFmpeg processing.
