# Task 2: 3D CAD Workspace

## Objective
Implement a local 3D CAD file viewer and converter using OpenCascade.js, allowing engineers to view and convert proprietary `.step` and `.iges` CAD files in the browser without uploading IP to cloud viewers.

## Prerequisites
- Review `docs/specs/phase-6/01_specialized_plugins_spec.md` (Plugin B).
- Phase 1 WorkerPool must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add opencascade.js three @types/three
```

### 2. Create the CAD Worker
- Create `src/lib/workers/cad.worker.ts`.
- In `init()`, initialize the OpenCascade WASM engine.
- Implement `CADWorkerContract` from `docs/specs/phase-6/01_specialized_plugins_spec.md`.
- `loadModel()`: import the file using the appropriate OpenCascade reader (`STEPControl_Reader`, `IGESControl_Reader`).
- `convertToSTL()`: use `StlAPI_Writer` to export the loaded shape.
- `convertToOBJ()`: export as OBJ via `RWObj_Writer`.
- Call `expose(new CADService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getCAD()`.

### 4. Build the 3D Viewer UI
- Create `src/routes/cad/+page.svelte`.
- File drop zone: accepts `.step`, `.stp`, `.iges`, `.igs`, `.stl`.
- After loading:
  - Display metadata: entity count, bounding box, volume (if computable).
  - Render the model in a `three.js` WebGL canvas with:
    - Orbit controls (mouse drag to rotate, scroll to zoom).
    - Ambient + directional lighting.
    - A ground-plane grid for scale reference.
    - Wireframe toggle button.
- Export buttons: "Download as STL" and "Download as OBJ".

### 5. Privacy Warning
- Display a permanent banner: "🔒 Your CAD files are processed locally. No geometry data is uploaded."

## Definition of Done
- Dropping a `.step` file renders the 3D model in the viewport within 10 seconds.
- Orbit controls allow free rotation and zoom.
- "Download as STL" produces a valid STL file openable in Blender or Cura.
- **No mocks, no cloud.** Real OpenCascade.js WASM parses and converts geometry.
- Privacy banner is always visible.
