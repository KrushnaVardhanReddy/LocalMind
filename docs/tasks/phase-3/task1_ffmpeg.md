# Task 1: FFmpeg WASM Integration

## Objective
Implement local video and audio conversion and compression using FFmpeg WASM.

## Prerequisites
- Review `docs/specs/phase-3/01_media_workspace_spec.md`.
- Review `docs/contracts/phase-3/media_worker_contract.md`.

## Implementation Steps

### 1. FFmpeg Worker Setup
- Install `@ffmpeg/ffmpeg` and `@ffmpeg/core`.
- Create a dedicated Web Worker (`src/lib/workers/ffmpeg.worker.ts`).
- Ensure COOP/COEP headers are configured for SharedArrayBuffer support (crucial for FFmpeg performance).

### 2. Message Routing
- Implement the `FFMPEG_EXECUTE` action in the worker.
- Use FFmpeg's virtual file system (FS) to write the input file, execute the command, and read the output file.
- Stream standard output/error back to the UI as progress logs.

### 3. Media Conversion UI
- Create a UI for uploading video/audio.
- Add preset buttons for common tasks (e.g., "Convert to MP4", "Extract Audio to MP3", "Compress 50%").
- Display a real-time log terminal to show FFmpeg's progress.
- Provide a download link for the generated output file.

## Acceptance Criteria
- [ ] Users can upload a video and convert its format completely locally.
- [ ] FFmpeg logs are streamed to the UI in real-time.
- [ ] The browser does not freeze during conversion.
