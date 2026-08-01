# Task 7: AI Background Removal (Image & Video)

## Objective
Provide an entirely offline way to strip backgrounds from images and video frames using ONNX Runtime Web and a local segmentation model (e.g., RMBG-1.4).

## Prerequisites
- Review Phase 3 Media specs.

## Implementation Steps
1. **Model Loading:** Integrate `onnxruntime-web` to load a quantized background removal model.
2. **UI:** Create a drop zone for images/videos in `src/routes/media/bg-removal/+page.svelte`.
3. **Processing:**
   - For images: process on WebGPU/WASM, output a transparent PNG.
   - For video: extract frames (via FFmpeg WASM), process masks, and mux back into a transparent WebM.
4. **Storage:** Temporarily store outputs in OPFS; provide export options.

## Definition of Done
- User can drop an image and instantly download a transparent version.
- Processing runs 100% offline.
