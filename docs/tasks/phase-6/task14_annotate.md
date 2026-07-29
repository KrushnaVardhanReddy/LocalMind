# Task 14: LocalMind Annotate — Image & Screenshot Annotation Workspace

## Objective
Build a lightweight canvas-based annotation workspace at `/annotate`. Users can draw, highlight, annotate screenshots, add text/arrows/shapes, crop images, and export to PNG/SVG/PDF — entirely offline using the browser canvas API and existing magick-wasm.

No new WASM workers needed. This reuses the existing canvas API + magick-wasm.

## Prerequisites
- UX-1 (Workspace launcher dashboard) completed — `/annotate` card must be in the launcher.
- magick-wasm already integrated (image format conversion).

## Implementation

### 1. Route Structure
```
src/routes/annotate/
├── +page.svelte              ← Main annotate workspace
├── +page.ts
└── components/
    ├── AnnotateCanvas.svelte     ← HTML5 Canvas with tool layer
    ├── AnnotateToolbar.svelte    ← Tool palette (draw, shapes, text, eraser)
    ├── AnnotateLayerPanel.svelte ← Layer list sidebar
    └── AnnotateExport.svelte     ← Export modal (PNG/SVG/PDF)
```

### 2. Canvas Tools
Implement via HTML5 Canvas 2D API with pointer events:

| Tool | Behaviour |
|---|---|
| ✏️ Freehand | Smooth path drawing with configurable stroke width + color |
| 📐 Arrow | Click-drag to draw directional arrow with configurable arrowhead |
| ⬜ Rectangle / ⭕ Circle | Click-drag shapes with fill + stroke options |
| T Text | Click to place text, configurable font size + color |
| 🖍 Highlight | Semi-transparent yellow overlay rectangle |
| ✂️ Crop | Select region → export only that region |
| 🧹 Eraser | Remove drawn elements within radius |

### 3. Image Import
- Drag-and-drop image (PNG, JPG, WEBP, BMP, GIF) onto canvas — renders as background layer.
- Paste from clipboard (`Ctrl+V`) — pastes screenshot directly as background layer.
- This is the primary entry point: take a screenshot → paste → annotate → export.

### 4. Export
- **PNG:** `canvas.toDataURL('image/png')` → download.
- **SVG:** Serialize all vector annotations to SVG (background image embedded as base64 `<image>`).
- **PDF:** Use the existing `window.print()` strategy from Session-3 (print-optimized CSS).

### 5. AI Auto-Label (Optional, consent-gated)
- "Ask AI to describe this image" button.
- Sends only a low-resolution thumbnail (max 512x512, base64) to the consent-gated cloud bridge.
- AI returns descriptive text → pre-fills a text annotation on the canvas.
- Requires user consent before any image data leaves the device.

## Acceptance Criteria
- [ ] `/annotate` route renders a blank canvas workspace.
- [ ] Drag-and-drop image opens as background layer.
- [ ] Clipboard paste (`Ctrl+V`) imports screenshot as background.
- [ ] All 7 tools work correctly (freehand, arrow, rect, circle, text, highlight, eraser).
- [ ] Color picker and stroke width controls work.
- [ ] PNG export downloads a valid image with annotations composited.
- [ ] No new WASM workers added to WorkerManager.ts.
- [ ] Unit tests cover tool state management and export output.
