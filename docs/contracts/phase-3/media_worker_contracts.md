# Contract: Phase 3 — Media Worker Interfaces

## 1. Vision Segmentation Contract (Background Removal)

```typescript
// docs/contracts/phase-3/vision_segmentation_contract.ts

export interface SegmentationResult {
    maskBuffer: ArrayBuffer; // PNG buffer with transparent background
    executionTimeMs: number;
}

export interface VisionSegmentationContract {
    /**
     * Initializes the ONNX Runtime Web session and loads the segmentation model (e.g., RMBG-1.4).
     */
    initModel(): Promise<void>;

    /**
     * Processes an image buffer (JPEG/PNG), extracts the foreground, and returns a transparent PNG buffer.
     * Uses WebGPU execution provider if available, falling back to WASM.
     */
    removeBackground(imageBuffer: ArrayBuffer, width: number, height: number): Promise<SegmentationResult>;
}
```

## 2. Transcription Contract (Subtitle Editor)

```typescript
// docs/contracts/phase-3/transcription_contract.ts

export interface TranscriptSegment {
    id: number;
    text: string;
    startMs: number;
    endMs: number;
}

export interface TranscriptionResult {
    segments: TranscriptSegment[];
    srtContent: string; // Pre-formatted SRT string
    executionTimeMs: number;
}

export interface TranscriptionContract {
    /**
     * Initializes the Whisper WASM worker (transformers.js).
     */
    initModel(): Promise<void>;

    /**
     * Transcribes an audio buffer (WAV) and returns precise timestamped segments.
     */
    transcribeAudio(audioBuffer: ArrayBuffer, generateSrt: boolean): Promise<TranscriptionResult>;
}
```
