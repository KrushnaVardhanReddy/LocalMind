# Task 1.2: OpenCV Image Enhancement

## Objective
Implement the OpenCV.js Web Worker to pre-process scanned documents before OCR — deskewing, denoising, and binarizing images to significantly improve Tesseract accuracy on low-quality scans.

## Prerequisites
- Review `docs/specs/phase-2/01_docs_engine_spec.md` (Section 4.2).
- Review `docs/contracts/phase-2/docs_worker_contracts.md`.
- Task 1 (OCR) must be complete — enhancement feeds directly into Tesseract.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add @techstark/opencv-js
```

### 2. Create the OpenCV Worker
- Create `src/lib/workers/opencv.worker.ts`.
- In `init()`, load the OpenCV WASM module using the dynamic `cv` global pattern.
- Implement the following pipeline methods (all accept/return `ArrayBuffer`):

  #### `deskew(imageBuffer: ArrayBuffer): Promise<ArrayBuffer>`
  - Convert to OpenCV Mat.
  - Binarize using Otsu thresholding.
  - Detect text lines via `HoughLinesP`.
  - Compute median rotation angle.
  - Apply `warpAffine` rotation correction.
  - Return corrected image as PNG ArrayBuffer.

  #### `enhance(imageBuffer: ArrayBuffer): Promise<ArrayBuffer>`
  - Apply adaptive thresholding (Gaussian, block size 11).
  - Apply morphological opening (2×2 kernel) to remove noise.
  - Optionally upscale to 300 DPI equivalent if image is small.
  - Return processed image as PNG ArrayBuffer.

  #### `enhance_and_deskew(imageBuffer: ArrayBuffer): Promise<ArrayBuffer>`
  - Chains `deskew()` → `enhance()`.

- Call `expose(new OpenCVService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getOpenCV()` with the Singleton lazy-loading pattern.

### 4. Wire into the OCR Pipeline
- In the Docs upload handler, before calling `Tesseract.recognizeImage()`, call `OpenCV.enhance_and_deskew()`.
- Show a two-phase progress indicator: "Enhancing image… 1/2" then "Running OCR… 2/2".

### 5. Before/After Preview
- Display the original and the enhanced image side by side in a split-view panel before showing OCR results.
- Allow the user to toggle "Use Enhanced" or "Use Original" before running OCR.

## Definition of Done
- A visibly skewed, low-contrast scan shows measurably improved Tesseract confidence after enhancement.
- The two-phase progress bar renders correctly.
- The before/after split-view shows the enhancement effect clearly.
- **No mocks.** OpenCV WASM is the real engine running in the worker thread.
