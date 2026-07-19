# Task: Phase 6 — 3D CAD Workspace

## Objective
Implement the 3D CAD workspace using `opencascade.js` for local viewing and conversion of `.step` and `.iges` files.

## Spec Reference
`docs/specs/phase-6/01_specialized_workspace_spec.md` — §2.2

## Implementation Steps

### 1. Add OpenCascade Worker
- Create `src/lib/workers/opencascade.worker.ts`.
- Actions: `LOAD_MODEL` (accepts ArrayBuffer), `CONVERT_TO_STL` (outputs ArrayBuffer), `GET_BOUNDING_BOX`.

### 2. Add Route
- Create `src/routes/cad/+page.svelte`.
- Accept `.step`, `.iges`, `.stl` files via file picker.
- Render using Three.js (`import * as THREE from 'three'`).
- Attempt WebGPU renderer first; fall back to WebGLRenderer with a "Using CPU rendering" notice.
- Show bounding box dimensions after model loads.
- Offer `.stl` export for loaded `.step`/`.iges` models.

### 3. WebGPU Fallback UX
- Check `navigator.gpu` before rendering. If unavailable, show: "WebGPU not supported on this browser. Using CPU renderer — performance may be reduced."

## Acceptance Criteria
- [ ] A 5MB `.step` file loads and renders in under 15 seconds on CPU renderer.
- [ ] STL export produces a valid binary STL file.
- [ ] Graceful WebGPU unavailability message is shown on non-WebGPU browsers.
- [ ] axe-core passes at `serious` level.
