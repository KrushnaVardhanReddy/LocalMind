# Phase 3: UI-Worker Contract (Media Workspace)

This contract defines the communication for media processing tasks.

## 1. Generic Message Structure
(Inherits the standard `id`, `action`, `payload`, `response` structure)

## 2. Actions and Payloads

### 2.1 FFmpeg WASM (Video/Audio)
**Action**: `FFMPEG_EXECUTE`
**Payload**:
```typescript
interface FFmpegPayload {
  file: File | ArrayBuffer;
  filename: string;
  args: string[]; // Standard FFmpeg arguments, e.g., ['-i', 'input.mp4', '-vcodec', 'libvpx', 'output.webm']
  outputFilename: string;
}
```
**Response Data**:
```typescript
interface FFmpegResult {
  outputBuffer: ArrayBuffer;
  logs: string[];
}
```

### 2.2 Whisper WASM (Transcription)
**Action**: `TRANSCRIBE_AUDIO`
**Payload**:
```typescript
interface TranscribePayload {
  audioBuffer: ArrayBuffer; // Must be 16kHz WAV format (usually pre-processed by FFmpeg)
  model: 'tiny' | 'base';
}
```
**Response Data**:
```typescript
interface TranscribeResult {
  text: string;
  segments: { start: number; end: number; text: string }[];
}
```

### 2.3 ImageMagick (magick-wasm)
**Action**: `PROCESS_IMAGE`
**Payload**:
```typescript
interface ProcessImagePayload {
  imageBuffer: ArrayBuffer;
  operations: { type: string; args: any[] }[]; // e.g., [{type: 'resize', args: [800, 600]}]
}
```
**Response Data**:
```typescript
interface ProcessImageResult {
  processedBuffer: ArrayBuffer;
}
```
