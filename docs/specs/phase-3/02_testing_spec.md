# Phase 3: Media Workspace — Testing Specification

## 1. Overview
End-to-End testing requirements for Phase 3 of the Media Workspace. Tests use Playwright against the local SvelteKit dev server. Fixtures are committed to `tests/fixtures/phase-3/`.

> ⚠️ **Performance note**: FFmpeg and Whisper operations are slow. E2E tests must use small fixture files (e.g., a 5-second MP4, a 10-second WAV) to keep test runtime under 2 minutes per scenario.

## 2. Test Fixtures Required
- `short_video.mp4` — A 5-second, small-resolution test video.
- `short_audio.wav` — A 10-second audio clip with clear spoken English words.
- `test_image.jpg` — A sample photo for image processing and QR tests.
- `qr_code.png` — An image containing a known QR code with a predictable URL.

## 3. Test Scenarios

### 3.1 Video Conversion (FFmpeg)
- **Action**: Upload `short_video.mp4`. Select "Convert to WebM". Trigger conversion.
- **Verification**:
  1. A progress bar appears and advances during conversion.
  2. On completion, a download link for a `.webm` file is offered.
  3. The output file is non-zero bytes.

### 3.2 Audio Transcription (Whisper)
- **Action**: Upload `short_audio.wav`. Trigger transcription.
- **Verification**:
  1. Whisper WASM worker initializes with a visible loading state.
  2. A transcript is produced within 60 seconds for the 10-second fixture.
  3. The transcript text is non-empty and contains words matching known content of the fixture.
  4. No network requests are made during transcription (verified via `page.route` intercept returning 400 for non-localhost URLs).

### 3.3 QR Code Decoding (ZXing)
- **Action**: Upload `qr_code.png`. Trigger QR decode.
- **Verification**:
  1. The decoded URL/text matches the known expected value in the fixture.
  2. Result is displayed inline without any network requests.

### 3.4 Background Removal (rembg/WebGPU)
- **Pre-condition**: Browser supports WebGPU (skip test gracefully if not).
- **Action**: Upload `test_image.jpg`. Trigger background removal.
- **Verification**:
  1. A processing indicator is shown.
  2. An output image with a transparent background is produced.
  3. The output image canvas/element is visible in the UI.

### 3.5 Accessibility Audit
- **Action**: Load the Media Workspace with a file active.
- **Verification**: Zero axe-core violations at `critical` or `serious` level.

## 4. Acceptance Criteria
- [ ] All scenarios pass against the local build.
- [ ] Whisper test verifies no external network calls are made during transcription.
- [ ] WebGPU test skips gracefully if hardware is unsupported.
- [ ] No axe-core violations at `critical` or `serious` level.
