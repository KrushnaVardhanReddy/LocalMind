# Task 1: Geo-Spatial Workspace

## Objective
Implement a local geospatial data conversion and visualization tool using gdal3.js, allowing users to convert Shapefiles to GeoJSON and reproject coordinate systems entirely in the browser.

## Prerequisites
- Review `docs/specs/phase-6/01_specialized_plugins_spec.md` (Plugin A).
- Phase 1 WorkerPool must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add gdal3.js leaflet
bun add -D @types/leaflet
```

### 2. Create the Geo Worker
- Create `src/lib/workers/geo.worker.ts`.
- In `init()`, initialize gdal3.js using `initGDAL()`.
- Implement `GeoWorkerContract` from `docs/specs/phase-6/01_specialized_plugins_spec.md`.
- `inspect()`: run `GDALInfo` on the input file, parse the JSON output.
- `convert()`: run `GDALVectorTranslate` with the target format flag (`-f GeoJSON` or `-f KML`).
- `reproject()`: run `GDALVectorTranslate` with `-t_srs EPSG:{toEPSG}`.
- Call `expose(new GeoService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getGeo()`.

### 4. Build the Geo UI
- Create `src/routes/geo/+page.svelte`.
- File drop zone: accepts `.shp`, `.geojson`, `.kml`, `.gpkg` (and all related Shapefile sidecars: `.dbf`, `.shx`, `.prj`).
- Metadata panel: display CRS, extent (bounding box), feature count, geometry type.
- "Convert to GeoJSON" button → download output.
- "Reproject" section: from/to EPSG code inputs (with an EPSG name lookup) + "Reproject" button.
- **Map Preview:** Render the GeoJSON output on a Leaflet map. Use OpenStreetMap tiles (cached by Service Worker for offline use).

## Definition of Done
- Dropping a Shapefile (`+.shp`, `.dbf`, `.shx`) converts to valid GeoJSON and renders on the map.
- Reprojecting from EPSG:4326 to EPSG:3857 produces a correctly reprojected output.
- **No mocks, no cloud.** Real gdal3.js WASM processes all geo data.
- The map renders correctly even in offline mode (OSM tiles cached).
