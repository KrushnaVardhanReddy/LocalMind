# Task 2: Whisper WASM Transcription

## Objective
Implement local, offline speech-to-text transcription using Whisper WASM.

## Prerequisites
- Completion of Task 1 (FFmpeg is needed to pre-process audio).
- Review `docs/specs/phase-3/01_media_workspace_spec.md`.

## Implementation Steps

### 1. Whisper Worker Setup
- Integrate a Whisper WASM build (e.g., using `whisper.wasm` or similar JS wrappers).
- Create a dedicated Web Worker (`src/lib/workers/whisper.worker.ts`).
- Implement model downloading and caching (e.g., caching the 'tiny.en' model locally).

### 2. Audio Pre-processing Pipeline
- Whisper typically requires 16kHz, 16-bit Mono WAV files.
- Update the UI to automatically send any uploaded audio/video through the FFmpeg worker FIRST to convert it to the required WAV format:
  `ffmpeg -i input -ar 16000 -ac 1 -c:a pcm_s16le output.wav`

### 3. Transcription Execution
- Implement the `TRANSCRIBE_AUDIO` action in the Whisper worker.
- Pass the pre-processed WAV buffer to Whisper.
- Stream transcription segments back to the UI as they are generated.

### 4. Transcription UI
- Create a dedicated Transcription view.
- Display the text updating in real-time as the worker processes the audio.
- Provide export options (TXT, VTT, SRT).

## Acceptance Criteria
- [ ] Users can upload a video or audio file.
- [ ] The file is automatically converted to the correct format using FFmpeg locally.
- [ ] Whisper accurately transcribes the audio to text offline.
- [ ] Subtitle files (SRT/VTT) can be exported.
