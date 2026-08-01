# Task 8: Subtitle & SRT Editor

## Objective
Provide a dedicated UI for transcribing long audio/video files using the Whisper worker, generating `.srt` files, and providing an interactive transcript editor.

## Prerequisites
- Requires Phase 3 Task 2 (Whisper WASM Integration).

## Implementation Steps
1. **Transcription:** Enhance the existing Whisper worker to output timestamped segments.
2. **UI Editor:** Create `src/routes/media/subtitles/+page.svelte`.
   - Left: Video/Audio player.
   - Right: Interactive transcript list.
3. **Syncing:** Clicking a transcript block seeks the video to that timestamp.
4. **Editing:** Allow users to correct typos in the text blocks.
5. **Export:** Generate standard `.srt` or `.vtt` formats.

## Definition of Done
- User can transcribe a video and download an SRT file.
- The UI allows editing text and syncs with media playback.
