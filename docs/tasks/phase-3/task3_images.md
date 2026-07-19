# Task 3: Image Processing Pipeline

## Objective
Implement advanced local image processing, filtering, and conversion using ImageMagick via `magick-wasm`.

## Prerequisites
- Review `docs/specs/phase-3/01_media_workspace_spec.md`.

## Implementation Steps

### 1. ImageMagick Worker Setup
- Install `@imagemagick/magick-wasm`.
- Create a Web Worker (`src/lib/workers/imagemagick.worker.ts`).

### 2. Basic Operations
- Implement the `PROCESS_IMAGE` action.
- Support basic operations: Resize, Crop, Convert Format (e.g., to WebP, JPEG).
- Ensure EXIF metadata preservation or stripping based on UI flags.

### 3. Image Editor UI
- Create a visual interface for adjusting image parameters (sliders for size, quality, buttons for format).
- Show a real-time preview of the changes (debounced calls to the worker for performance).

## Acceptance Criteria
- [ ] Users can apply image transformations locally.
- [ ] Performance is sufficient for near real-time previewing.
