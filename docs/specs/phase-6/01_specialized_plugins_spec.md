# Spec: Phase 6 — Specialized Niche Plugins

## 1. Overview
Phase 6 introduces three highly specialized WASM-powered workspaces for geospatial data, 3D CAD models, and cryptographic operations — all running locally without any cloud dependency.

---

## 2. Plugin A: Geo-Spatial Workspace (gdal3.js)

### 2.1 Engine
`gdal3.js` — GDAL compiled to WASM, enabling coordinate reprojection and format conversion without QGIS or ArcGIS.

### 2.2 Supported Operations
- **Format Conversion:** Shapefile (`.shp`) → GeoJSON, KML, GeoTIFF.
- **Coordinate Reprojection:** Convert between any EPSG coordinate reference systems.
- **File Inspection:** Display metadata of geospatial files (CRS, extent, feature count).

### 2.3 Visualization
Render GeoJSON output on a local `Leaflet.js` map (OpenStreetMap tiles, served from browser cache).

### 2.4 Worker Contract
```typescript
export interface GeoWorkerContract {
    init(): Promise<void>;
    inspect(fileBuffer: ArrayBuffer, fileName: string): Promise<GeoFileMetadata>;
    convert(fileBuffer: ArrayBuffer, fileName: string, targetFormat: 'geojson' | 'kml'): Promise<ArrayBuffer>;
    reproject(fileBuffer: ArrayBuffer, fromEPSG: number, toEPSG: number): Promise<ArrayBuffer>;
}
```

---

## 3. Plugin B: 3D CAD Workspace (OpenCascade.js)

### 3.1 Engine
`opencascade.js` — OpenCASCADE Technology compiled to WASM, supporting `.step`, `.iges`, and `.stl` formats.

### 3.2 Supported Operations
- **View:** Render 3D models in a `three.js` WebGL viewport.
- **Convert:** `.step` → `.stl` or `.obj` for use in other tools.
- **Inspect:** Extract metadata (bounding box, volume, surface area, entity count).

### 3.3 Worker Contract
```typescript
export interface CADWorkerContract {
    init(): Promise<void>;
    loadModel(fileBuffer: ArrayBuffer, fileName: string): Promise<CADMetadata>;
    convertToSTL(): Promise<ArrayBuffer>;
    convertToOBJ(): Promise<ArrayBuffer>;
}

export interface CADMetadata {
    entityCount: number;
    boundingBox: { min: [number, number, number]; max: [number, number, number] };
    volumeCm3?: number;
}
```

---

## 4. Plugin C: Cryptography Workspace (libsodium.js)

### 4.1 Engine
`libsodium-wrappers` — libsodium compiled to WASM, the gold-standard cryptographic library.

### 4.2 Supported Operations
- **Symmetric Encryption:** AES-256-GCM / XSalsa20-Poly1305 file encryption/decryption.
- **Hashing:** SHA-256, SHA-512, BLAKE2b of files or text.
- **Key Generation:** Generate random 256-bit keys, keypairs (X25519 for key exchange, Ed25519 for signing).
- **Digital Signing:** Sign data with Ed25519 private key; verify with public key.

### 4.3 Privacy Invariant
All cryptographic operations are performed in a Web Worker. **Private keys and plaintext data must never be passed to the main thread.** Only ciphertext and hashes are returned.

### 4.4 Worker Contract
```typescript
export interface CryptoWorkerContract {
    init(): Promise<void>;
    generateSymmetricKey(): Promise<ArrayBuffer>;
    encryptFile(fileBuffer: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer>;
    decryptFile(ciphertextBuffer: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer>;
    hashFile(fileBuffer: ArrayBuffer, algorithm: 'sha256' | 'sha512' | 'blake2b'): Promise<string>;
    generateKeypair(): Promise<{ publicKey: ArrayBuffer; privateKey: ArrayBuffer }>;
    signData(dataBuffer: ArrayBuffer, privateKey: ArrayBuffer): Promise<ArrayBuffer>;
    verifySignature(dataBuffer: ArrayBuffer, signature: ArrayBuffer, publicKey: ArrayBuffer): Promise<boolean>;
}
```

---

## 5. Plugin D: Mind Map Workspace (Task 9)

### 5.1 Engine
`SvelteFlow` — A node-based UI engine for rendering mind maps and brainstorm canvases.

### 5.2 Supported Operations
- **Node Management:** Add, connect, group, and style text nodes.
- **Persistence:** Save graph structure (JSON) into `wa-sqlite` for the current `.lm` session.
- **AI Expansion:** Select a node and prompt the WebLLM engine to generate child nodes.

### 5.3 Worker Contract
```typescript
export interface MindMapGraphState {
    nodes: Array<{ id: string; data: { label: string }; position: { x: number; y: number } }>;
    edges: Array<{ id: string; source: string; target: string }>;
}

export interface MindMapWorkerContract {
    // Note: Most mind map logic is UI-bound, but AI expansion delegates to WebLLM
    expandNode(nodeText: string, context: string): Promise<string[]>;
    saveState(sessionId: string, state: MindMapGraphState): Promise<void>;
    loadState(sessionId: string): Promise<MindMapGraphState | null>;
}
```

---

## 6. Invariants (All Phase 6 Plugins)
1. Each plugin is a separate, independently lazy-loaded module — the Geo, CAD, and Crypto workspaces do not load each other's WASM engines.
2. All plugins share the same `WorkerManager` Singleton registry.
3. CAD and Geo files may be large (hundreds of MB) — streaming registration via `WorkerManager` is mandatory.
4. Cryptographic private keys must **never** be stored in `localStorage`, `sessionStorage`, or wa-sqlite.
