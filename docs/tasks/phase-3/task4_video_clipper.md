# Task 3: Instant Video Clipper

## Objective
Implement a user-friendly video clip editor that lets users visually select time ranges, preview frames, and export clips — all locally via FFmpeg WASM, without any upload.

## Prerequisites
- Review `docs/specs/phase-3/01_media_engine_spec.md`.
- Task 1 (FFmpeg) must be complete — the clipper uses the FFmpeg worker.

## Implementation Steps

### 1. Video Preview
- Create `src/routes/media/clipper/+page.svelte`.
- Drop zone accepts any video format.
- On drop, render the video in an HTML `<video>` element using `URL.createObjectURL()`.
- Display video metadata: duration, resolution, codec, file size.

### 2. Timeline Scrubber
- Implement a range slider for selecting start/end clip times.
- Display the start time and end time as `HH:MM:SS` inputs (synced with the slider).
- As the user moves the start/end handles, extract and show a thumbnail from that frame via `FFmpegWorkerContract.generateThumbnail()`.

### 3. Multi-Clip Queue
- Allow adding multiple clip ranges to a queue (e.g., clip 0:10–0:30 and 1:00–1:20).
- Each queued clip shows a preview thumbnail, duration, and a "Remove" button.
- "Export All Clips" button — processes all clips in sequence and triggers individual downloads.
- "Merge Clips" button — concatenates all clips into one output via FFmpeg `concat` demuxer.

### 4. Output Settings
- Output format dropdown: MP4 (H.264), WebM (VP9).
- Quality presets: High (CRF 18), Medium (CRF 23), Low/Small (CRF 28).

### 5. E2E Test (for Phase 3 E2E)
- Write a Playwright test that drops a fixture video, sets clip range 0:05–0:10, clicks "Export", and asserts a `.mp4` download occurs.

## Definition of Done
- Clipping a 10-second segment from a 5-minute video downloads correctly.
- Thumbnail preview updates as the time range handles are dragged.
- Multi-clip queue: adding 3 clips and "Export All" produces 3 individual downloads.
- **No mocks.** Real FFmpeg WASM trims the clips.
- The `<video>` element is fully responsive and maintains aspect ratio on mobile viewports.

---

# Phase 3: End-to-End Testing

## Objective
Validate all Phase 3 Media features (FFmpeg transcoding, Whisper transcription, and Video Clipper) via a zero-mock Playwright E2E suite.

## Prerequisites
- All Phase 3 tasks must be complete.
- **No mocking rule:** Real FFmpeg WASM and Whisper ONNX must be exercised. No Worker stubs.

## Test Fixtures (`tests/fixtures/media/`)
- `sample_video.mp4` — 30-second, 720p MP4 (~5MB, generated via FFmpeg script).
- `sample_audio.mp3` — 60-second English speech MP3 (~1MB).

## Test Cases (`tests/phase-3/`)

```typescript
// ffmpeg.spec.ts
test('Transcodes MP4 to WebM successfully', async ({ page }) => {
    // Drop sample_video.mp4, select WebM output, click Convert
    // Assert: download triggered, file extension is .webm
});

test('Audio extraction produces an MP3 download', async ({ page }) => {
    // Drop sample_video.mp4 on Extract Audio tab
    // Assert: .mp3 download triggered
});

// whisper.spec.ts
test('Whisper transcribes English audio to text', async ({ page }) => {
    // Drop sample_audio.mp3, click Transcribe
    // Assert: transcript panel is non-empty within 60 seconds
    // Assert: SRT download button is visible
});

// clipper.spec.ts
test('Video clipper exports a trimmed clip', async ({ page }) => {
    // Drop sample_video.mp4
    // Set range 0:05 to 0:10
    // Click Export
    // Assert: .mp4 download triggered
});
```

## Definition of Done
- `bun run test:e2e -- tests/phase-3/` passes on Chrome.
- All WASM workers use real binaries — no stubs.
- Test runtime does not exceed 10 minutes (Whisper is slow on CI).
