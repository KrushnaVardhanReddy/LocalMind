# Phase 3: UI to Worker Message Contract

## 1. Overview
This contract defines message passing for Phase 3 workers: `ffmpeg` (media conversion), `whisper` (transcription), `magick` (image processing), and `zxing` (barcode decoding).

## 2. Message Envelope
Identical to Phase 1 (`docs/contracts/phase-1/ui_worker_contract.md`).

## 3. FFmpeg Worker Actions

### 3.1 Initialize FFmpeg
- **Action**: `INIT`
- **Request Payload**: `{}`
- **Response Data**: `{ ready: boolean; version: string }`

### 3.2 Convert Media
- **Action**: `CONVERT`
- **Request Payload**:
  ```typescript
  { inputBuffer: ArrayBuffer; inputName: string; outputFormat: string; options?: Record<string, string> }
  ```
  (e.g., `outputFormat: 'webm'`, `options: { crf: '28' }`)
- **Response Data**: `{ outputBuffer: ArrayBuffer; outputName: string }` (transferable)
- **Progress Events**: Worker emits intermediate `PROGRESS` messages: `{ id: string; progress: number }` (0–1 range).

### 3.3 Extract Thumbnail
- **Action**: `THUMBNAIL`
- **Request Payload**: `{ inputBuffer: ArrayBuffer; inputName: string; timestampSec: number }`
- **Response Data**: `{ imageBuffer: ArrayBuffer }` (JPEG, transferable)

## 4. Whisper Worker Actions

### 4.1 Initialize Whisper
- **Action**: `INIT`
- **Request Payload**: `{ model: 'tiny' | 'base' | 'small' }`
- **Response Data**: `{ ready: boolean }`

### 4.2 Transcribe Audio
- **Action**: `TRANSCRIBE`
- **Request Payload**: `{ audioBuffer: ArrayBuffer; language?: string }` (transferable)
- **Response Data**:
  ```typescript
  { text: string; segments: Array<{ start: number; end: number; text: string }> }
  ```

## 5. Magick Worker Actions

### 5.1 Initialize Magick
- **Action**: `INIT`
- **Request Payload**: `{}`
- **Response Data**: `{ ready: boolean; version: string }`

### 5.2 Process Image
- **Action**: `PROCESS`
- **Request Payload**:
  ```typescript
  { inputBuffer: ArrayBuffer; operations: ImageOperation[]; outputFormat: string }
  // ImageOperation examples: { type: 'resize', width: 800, height: 600 } | { type: 'rotate', degrees: 90 }
  ```
- **Response Data**: `{ outputBuffer: ArrayBuffer }` (transferable)

### 5.3 Read EXIF Metadata
- **Action**: `READ_EXIF`
- **Request Payload**: `{ inputBuffer: ArrayBuffer }`
- **Response Data**: `{ metadata: Record<string, string | number> }`

### 5.4 Strip EXIF Metadata
- **Action**: `STRIP_EXIF`
- **Request Payload**: `{ inputBuffer: ArrayBuffer; outputFormat: string }`
- **Response Data**: `{ outputBuffer: ArrayBuffer }` (transferable)

## 6. ZXing Worker Actions

### 6.1 Decode Barcode
- **Action**: `DECODE`
- **Request Payload**: `{ imageBuffer: ArrayBuffer }`
- **Response Data**:
  ```typescript
  { results: Array<{ format: string; text: string; rawBytes?: Uint8Array }> }
  ```
