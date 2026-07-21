# Task 5.7: Visual Regression Diffing

## Objective
Implement a local pixel-level visual regression testing tool using `pixelmatch` that compares two screenshots, generates a visual diff heatmap, and reports the percentage of changed pixels — entirely in the browser with no image ever uploaded.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.5).
- Phase 1 scaffolding must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add pixelmatch pngjs
```

### 2. Create the Visual Diff Worker
- Create `src/lib/workers/visual-diff.worker.ts`.
- Implement:

  ```typescript
  interface VisualDiffResult {
      diffPixelCount: number;
      totalPixels: number;
      percentageChanged: number;
      diffImageBuffer: ArrayBuffer; // PNG with diff heatmap
      boundingBox: { x: number; y: number; width: number; height: number } | null;
  }

  interface VisualDiffWorkerContract {
      compare(imageA: ArrayBuffer, imageB: ArrayBuffer): Promise<VisualDiffResult>;
  }
  ```

- Decode both PNG images using `pngjs.PNG.sync.read()`.
- If images are different sizes, pad the smaller one with transparency to match dimensions.
- Run `pixelmatch(img1Data, img2Data, diffData, width, height, { threshold: 0.1 })`.
- Encode the diff data as a PNG buffer.
- Compute the bounding box of all diff pixels.
- Call `expose(new VisualDiffService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getVisualDiff()`.

### 4. Build the Visual Diff UI
- Create `src/routes/devtools/visual-diff/+page.svelte`.
- Two-panel drop zone: "Expected Screenshot" (left) and "Actual Screenshot" (right).
- Accept: `.png`, `.jpg`, `.webp`. Convert non-PNG to PNG via `<canvas>` before passing to worker.
- "Compare" button → triggers `compare()`.
- Results panel (three-column view):
  - Expected image.
  - Actual image.
  - Diff heatmap (red pixels = changed areas).
- Metrics bar: "X pixels changed (Y% of image)" with a severity indicator.
- Bounding box overlay: draw a red rectangle on the Actual image showing the extent of the diff region.
- "Download Diff Image" button.

### 5. Threshold Control
- Slider: "Sensitivity" (maps to pixelmatch `threshold` 0.0–0.5, default 0.1).
- Re-runs comparison in real-time as the slider changes.

## Definition of Done
- Comparing two identical screenshots reports 0% changed.
- Comparing two screenshots with a moved button reports the exact bounding box of the change.
- The diff heatmap PNG downloads correctly.
- **No mocks.** Real pixelmatch runs in the Worker thread.
- Sensitivity slider re-runs comparison without reloading the images.
