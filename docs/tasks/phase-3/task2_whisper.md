# Task 2: Whisper WASM Integration (Offline Transcription)

## Objective
Implement local, offline audio/video transcription using Whisper (tiny/base model via Transformers.js ONNX), producing timestamped SRT captions and plain-text transcripts without any cloud API.

## Prerequisites
- Review `docs/specs/phase-3/01_media_engine_spec.md`.
- Task 1 (FFmpeg) should be complete — FFmpeg extracts audio from video before Whisper processes it.

## Implementation Steps

### 1. Install Dependencies
*(Already completed by Antigravity in `feature/dev`. No need to run these commands.)*
The Whisper ONNX model (`Xenova/whisper-tiny`) is downloaded from Hugging Face on first use and cached by the Service Worker.

### 2. Create the Whisper Worker
- Create `src/lib/workers/whisper.worker.ts`.
- In `init()`, load the `Xenova/whisper-tiny` pipeline: `pipeline('automatic-speech-recognition', ...)`.
- Implement:
  ```typescript
  interface WhisperWorkerContract {
      init(modelSize?: 'tiny' | 'base'): Promise<void>;
      transcribe(audioBuffer: ArrayBuffer): Promise<TranscriptResult>;
  }
  interface TranscriptResult {
      text: string;
      chunks: Array<{ timestamp: [number, number]; text: string }>;
  }
  ```
- `transcribe()`: accepts a WAV `ArrayBuffer` (44.1kHz mono, float32), returns the transcript with timestamps.
- If the input is not WAV, use the FFmpeg worker to convert it first (via `WorkerManager.getFFmpeg()`).
- Call `expose(new WhisperService())`.

### 3. Register with WorkerManager
*(Already completed by Antigravity. `getWhisper()` is already in `WorkerManager.ts`.)*

### 4. Build the Transcription UI
- Add a "Transcribe" tab to the `src/routes/media/+page.svelte` page.
- File drop zone: accepts `.mp4`, `.mp3`, `.wav`, `.ogg`, `.webm`, `.mov`.
- Model selector: "Tiny (fastest)" or "Base (more accurate)".
- On "Transcribe":
  1. If video: extract audio via FFmpeg worker first.
  2. Show processing state: "Extracting audio… 1/2" then "Transcribing… 2/2".
- Results panel:
  - Plain text transcript with copy button.
  - Timestamped SRT format in a `<pre>` block.
  - "Download .txt" and "Download .srt" buttons.

## Definition of Done
- Transcribing a 5-minute English audio file produces a readable, timestamped transcript.
- The two-phase progress indicator ("Extracting" → "Transcribing") renders correctly for video inputs.
- SRT timestamps are correctly formatted (`HH:MM:SS,mmm --> HH:MM:SS,mmm`).
- **No mocks, no cloud API.** Whisper ONNX runs in a Worker thread.
- Model download progress is shown on first use with a "Downloading model (X MB)…" indicator.
