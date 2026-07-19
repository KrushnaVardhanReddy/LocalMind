# Phase 6: Specialized Workspaces — Specification

## 1. Overview
Phase 6 introduces tools for highly proprietary, industry-specific file formats that cannot be sent to cloud platforms. These workspaces target regulated-industry buyers in manufacturing, urban planning, and security engineering — market segments that have no viable cloud alternative due to IP sensitivity or compliance constraints.

## 2. Workspace Modules

### 2.1 Geo-Spatial Workspace
- **Engine**: `gdal3.js` (GDAL compiled to WASM).
- **Target Users**: Urban planners, logistics teams, GIS analysts.
- **Capabilities**:
  - Convert proprietary shapefiles (`.shp`, `.dbf`, `.prj`) to GeoJSON locally.
  - Reproject coordinate systems (e.g., EPSG:4326 to EPSG:3857).
  - Preview the resulting GeoJSON on an interactive local map (using Leaflet.js — no tile server required for basic GeoJSON overlay).
  - Export converted files locally.
- **Privacy**: Raw shapefile bytes never leave the browser.

### 2.2 3D CAD Workspace
- **Engine**: `opencascade.js` (OpenCASCADE compiled to WASM).
- **Target Users**: Hardware startups, mechanical engineers, manufacturing QA teams.
- **Capabilities**:
  - View unreleased product designs in `.step` and `.iges` format directly in the browser.
  - Convert `.step` / `.iges` to `.stl` for 3D printing locally.
  - Basic measurement tools (bounding box dimensions).
  - Render via Three.js (CPU fallback) or WebGPU (if available) for smooth 3D interaction.
- **Privacy**: CAD files containing unreleased IP never touch a server.

### 2.3 Security / Cryptography Workspace
- **Engine**: `libsodium.js`.
- **Target Users**: Security engineers, developers needing local key operations.
- **Capabilities**:
  - **File Encryption**: Encrypt any local file using XSalsa20-Poly1305 (symmetric) or X25519 (asymmetric). Output a locally-saved encrypted file.
  - **File Decryption**: Decrypt an encrypted file using a provided key.
  - **Key Generation**: Generate Ed25519 keypairs, X25519 keypairs, and 256-bit symmetric keys locally.
  - **Hash Validation**: Compute and verify BLAKE2b, SHA-256, or SHA-512 hashes of local files.
  - **Password Hashing**: Generate and verify Argon2id password hashes locally.
- **Privacy**: Keys are held in-memory only and never persisted. This is the same key-storage policy as AI API keys.

## 3. Architecture & Threading
- All three engines MUST run in dedicated Web Workers (managed via `WorkerPool`).
- `gdal3.js` and `opencascade.js` are large bundles (5–15MB). Implement lazy loading — workers are only initialized when the user navigates to the respective workspace.

## 4. Non-Functional Requirements
- **Geo-Spatial**: Convert a 10MB shapefile to GeoJSON in under 10 seconds.
- **3D CAD**: Load and render a 5MB `.step` file in under 15 seconds.
- **Crypto**: Encrypt a 100MB file in under 5 seconds.

## 5. UX Considerations
- All three workspaces must gracefully handle unsupported file formats with a clear error message listing supported formats.
- For the 3D CAD viewer, display a hardware capability warning if WebGPU is unavailable (fallback to Three.js CPU renderer).

## 6. Task Reference
See `docs/tasks/phase-6/`.
