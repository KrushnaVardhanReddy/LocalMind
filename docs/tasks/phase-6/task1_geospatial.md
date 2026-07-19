# Task: Phase 6 — Geo-Spatial Workspace

## Objective
Implement the Geo-Spatial workspace using `gdal3.js` for local shapefile-to-GeoJSON conversion and coordinate reprojection.

## Spec Reference
`docs/specs/phase-6/01_specialized_workspace_spec.md` — §2.1

## Implementation Steps

### 1. Add gdal3.js Worker
- Add `'gdal'` to `WorkerPool` worker keys.
- Create `src/lib/workers/gdal.worker.ts`.
- Initialize `gdal3.js` on `INIT`. Lazy-load only when user navigates to Geo-Spatial workspace.

### 2. Implement Shapefile Conversion
- Action: `CONVERT_SHAPEFILE` — accepts a ZIP containing `.shp`, `.dbf`, `.prj`; outputs GeoJSON string.
- Action: `REPROJECT` — accepts GeoJSON + source EPSG + target EPSG; outputs reprojected GeoJSON.

### 3. Add Route
- Create `src/routes/geo/+page.svelte`.
- File picker accepts `.zip` (shapefile bundle).
- On conversion, display result on a Leaflet.js map (`import 'leaflet'`; tiles optional — show GeoJSON overlay only).
- Offer GeoJSON download.

### 4. Add to WorkerPool
Register `'gdal'` in `WorkerPool.ts` and implement lazy initialization.

## Acceptance Criteria
- [ ] A 10MB shapefile ZIP converts to GeoJSON in under 10 seconds.
- [ ] GeoJSON overlay is visible on the Leaflet map.
- [ ] No network requests made during conversion.
- [ ] axe-core passes at `serious` level.
