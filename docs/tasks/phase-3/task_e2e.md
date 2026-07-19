# Task 4: End-to-End Testing (Phase 3)

## Objective
Implement End-to-End tests for the Media Workspace features.

## Prerequisites
- Completion of Tasks 1-3.

## Implementation Steps

### 1. Test: FFmpeg Conversion
- Create a test that:
  1. Uploads a small sample video.
  2. Triggers an audio extraction task.
  3. Verifies the output file is generated.

### 2. Test: Whisper Transcription
- Create a test that:
  1. Uploads a sample audio file containing clear speech.
  2. Triggers the transcription process.
  3. Verifies that the transcribed text contains expected keywords.

### 3. Test: Image Processing
- Create a test that:
  1. Uploads an image.
  2. Applies a resize operation.
  3. Verifies the output image dimensions are correct.

## Acceptance Criteria
- [ ] Playwright E2E tests run successfully, validating the media workers locally.
