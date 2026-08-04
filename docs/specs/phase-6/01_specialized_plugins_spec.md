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

## 7. Plugin E: Annotate Workspace (Task 14)

### 7.1 Engine
`Fabric.js` or HTML5 Canvas (No WASM required).

### 7.2 Supported Operations
- **Image Import:** Load PNG/JPG/WebP from local file system.
- **Annotation:** Draw rectangles, circles, arrows, and text.
- **Redaction:** Blur specific rectangular regions of the image.
- **Export:** Export the annotated image as a single flattened PNG.

### 7.3 Constraints
- Must remain a purely client-side UI tool.
- Images must not be transmitted off-device.

---

## 8. Plugin F: Diagrams Workspace (Task 15)

### 8.1 Engine
Reuses the existing `WebLLMWorker` for AI generation and `mermaid` for rendering.

### 8.2 Supported Operations
- **Prompt to Diagram:** User types a prompt ("Create an architecture diagram of a web server"). The LLM outputs Mermaid.js syntax.
- **Live Render:** The Mermaid syntax is parsed and rendered visually in real-time.
- **Export:** Export the rendered diagram as SVG or PNG.

### 8.3 Contracts
Delegates to the existing `LLMWorkerContract`. No new WASM engine is registered.

---

## 9. Acceptance Criteria & E2E Test Scenarios

### AC-6.1 Geo-Spatial Workspace
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User navigates to `/geo` | Map renders (tiles visible) |
| AC-2 | User uploads a GeoJSON file | Markers/polygons appear on the map |
| AC-3 | User clicks a map feature | Popup/info panel shows feature properties |

### AC-6.2 3D CAD Workspace
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads a `.stl` or `.step` file | 3D model renders in the WebGL viewport |
| AC-2 | User rotates the model (click+drag) | Model rotates interactively |
| AC-3 | User clicks "Export as OBJ" | File download is triggered |

### AC-6.3 Cryptography Workspace
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User hashes a string with SHA-256 | Output shows the correct hex digest |
| AC-2 | User generates an RSA key pair | Public and private keys appear in PEM format |
| AC-3 | User encrypts text then decrypts it | Decrypted output matches original plaintext |

### AC-6.4 Finance & Tax Workspace
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads a transactions CSV | Summary table/chart renders |
| AC-2 | User applies a date filter | Table updates to show filtered results |

### AC-6.5 Annotate Workspace
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User uploads an image | Image renders on the canvas |
| AC-2 | User selects rectangle tool and drags | Annotation shape appears |
| AC-3 | User clicks "Export" | Annotated image downloads |

### AC-6.6 Diagrams AI Workspace (Task 15)
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User enters "UML diagram for User and Order" | Mermaid SVG with "User" and "Order" nodes renders |
| AC-2 | User clicks "Export as SVG" | SVG file downloads |

### AC-6.7 Code Interpreter (Pyodide)
| # | Scenario | Expected Result |
|---|---|---|
| AC-1 | User navigates to the workspace | "Pyodide ready" indicator appears within 60s |
| AC-2 | User types `print("hello")` and runs | Output panel shows `hello` |
| AC-3 | User types `1/0` and runs | Error/traceback shown in output — no crash |
