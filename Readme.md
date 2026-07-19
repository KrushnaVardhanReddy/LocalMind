# LocalMind

> **Your files stay with you. Your insights don't have to.**

A browser-native, privacy-first workspace for processing data, documents, and media — entirely on your device.

[![Status](https://img.shields.io/badge/status-building%20MVP-orange)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Stack](https://img.shields.io/badge/stack-SvelteKit%20%2B%20WASM-blueviolet)]()

---

## What Is LocalMind?

LocalMind is a browser application that performs heavy computation directly on the user's device using modern web technologies — WebAssembly, Web Workers, IndexedDB, and the File System Access API.

You can query gigabyte-scale CSVs with SQL, parse PDFs, transcode video, run OCR, and get AI-generated insights — **without uploading a single byte to a server.**

This is not another online file converter. This is a **privacy-first computing platform.**

---

## Status

> 🚧 **Currently building MVP — Phase 1: Data Workspace**

| Phase | Scope | Status |
|---|---|---|
| Phase 1 — Data | CSV, Excel, JSON, SQL, Charts | 🔨 In Progress |
| Phase 2 — Documents | PDF, DOCX, OCR, Search | 📋 Planned |
| Phase 3 — Media | Image, Audio, Video conversion | 📋 Planned |
| Phase 4 — Developer | Logs, OpenAPI, YAML, Diff | 📋 Planned |
| Phase 5 — Intelligence | Local LLM, Transcription, Semantic Search | 🔬 Research |
| Phase 6 — Specialized | 3D CAD, Geo-Spatial, Cryptography | 💡 Idea |
| Phase 7 — Plugins | Custom User WASM Execution Runtime | 💡 Idea |

---

## The Problem

Most tools force users to:

- **Upload files to a server** — creating privacy risk and compliance exposure
- **Wait for round-trip processing** — slow for large files
- **Trust a third party** with sensitive financial, medical, or legal data
- **Pay for backend compute** — costs passed to users
- **Install native applications** — friction and update overhead

This is the wrong default in 2025. Browsers are now capable enough to process large files locally, in milliseconds.

---

## Our Solution

Build a workspace that inverts the default: **local first, cloud optional.**

### Core Principles

| Principle | What It Means |
|---|---|
| **Local-first** | All standard processing runs in the browser — no uploads required |
| **Privacy-first** | Files never leave the device unless the user explicitly consents |
| **Fast by default** | WASM engines (DuckDB, FFmpeg) process data in near-native speed |
| **Transparent AI** | Users review exactly what is shared before any cloud request fires |
| **Cloud is optional** | AI features are an enhancement, not a dependency |

---

## How AI Works (The Consent Model)

This is what separates LocalMind from every other "AI-powered" tool.

Instead of sending raw files to an AI provider, LocalMind:

1. **Processes the file locally** — extracts statistics, structures, and summaries
2. **Generates an aggregated payload** — no PII, no raw records
3. **Presents a consent dialog** — user reviews exactly what will be sent
4. **Sends only the approved summary** — e.g., revenue trends, not transaction records
5. **Displays the AI-generated insight** — explained in plain language

**Example — instead of sending:**
> ❌ Customer names, emails, 50,000 transaction rows

**LocalMind sends:**
> ✅ Revenue: −8% MoM · Churn: +12% · Top SKU: Product A · AOV: $145

Users can disable AI features entirely. Local processing is always available, regardless of AI usage.

**Trust is a product feature.**

---

## Product Modules

### 1. Data Workspace
Process structured data at scale, directly in the browser.

| Format | Features |
|---|---|
| CSV, Excel, JSON, Parquet | SQL queries via DuckDB WASM |
| | Pivot tables, charts, visualizations |
| | Data cleaning and validation |
| | Column statistics and profiling |
| | **Data Diff** — compare two datasets, see what changed |
| | **PII Detection & Masking** — auto-detect names, emails, SSNs, credit cards |
| | **Schema Inference** — generate TypeScript types, SQL DDL, or Pydantic models from any file |
| | **Archive Extraction** — locally extract `.zip`, `.rar`, and `.7z` datasets via libarchive WASM |
| | **Python Notebook** — run pandas/numpy/polars locally via Pyodide WASM |
| | Export results in multiple formats |
| | Optional AI insights (consent-gated) |

---

### 2. Document Workspace
Extract meaning from documents without cloud parsing APIs.

| Format | Features |
|---|---|
| PDF, DOCX, Images | OCR via Tesseract WASM |
| | Full-text search |
| | Side-by-side document comparison |
| | Structured data extraction |
| | **Everyday PDF Tools** — compress, unlock/decrypt, merge, split, and redact via MuPDF WASM |
| | **Universal conversion** — Markdown → DOCX → PDF → HTML via Pandoc WASM |
| | **Semantic search** — find paragraphs by meaning using local embeddings |
| | Optional AI summaries (consent-gated) |

---

### 3. Media Workspace
Convert, compress, and transform media without uploads.

| Format | Features |
|---|---|
| Images, Audio, Video | Format conversion via FFmpeg WASM |
| | Compression and resizing |
| | Crop, watermark, thumbnail generation |
| | Batch processing |
| | **Background Removal** — instant, local AI cutout via rembg (WebGPU) |
| | **SVG Vectorizer** — convert PNG/JPG logos to crisp SVG paths via potrace-wasm |
| | **Auto-Subtitles** — generate `.srt` or `.vtt` captions from video files locally via Whisper WASM |
| | **Advanced image processing** — filters, compositing, RAW conversion via magick-wasm |
| | **Audio transcription** — convert any audio/video to text locally via Whisper WASM |
| | **EXIF/Metadata inspector** — view or strip metadata from images and videos |
| | **Barcode & QR reader** — decode any barcode from an image via ZXing WASM |

---

### 4. Developer Workspace
Utilities for engineers working with structured formats and logs.

| Format | Features |
|---|---|
| JSON, YAML, Logs, OpenAPI, CSV | Schema validation and formatting |
| | Side-by-side diff |
| | Log statistics and pattern analysis |
| | Local SQL on any structured file |
| | OpenAPI linting and visualization |
| | **Code structure analysis** — parse source files, extract functions/classes via tree-sitter WASM |
| | **Regex playground** — test regex patterns against local file content live |
| | **Secret scanner** — detect accidentally exposed API keys, tokens, passwords |
| | **Binary/Hex inspector** — view binary files in structured hex format |
| | **JWT & certificate inspector** — decode and validate tokens and SSL certs locally |

---

### 5. Intelligence Workspace *(Phase 5 — Research)*
Fully local AI — no cloud, no API keys, no data ever leaves the device.

This module flips the default AI model entirely. Instead of the consent-gated cloud bridge, Intelligence Workspace runs small language models directly in the browser using WebGPU acceleration.

| Capability | Engine | What It Does |
|---|---|---|
| **Local LLM Chat** | WebLLM (WebGPU) | Run Phi-3, Gemma 2B, Llama 3.2 locally — OpenAI-compatible API, zero cloud calls |
| **Audio Transcription** | Whisper WASM | Transcribe meeting recordings, interviews, dictation — entirely offline |
| **Semantic Search** | Transformers.js + ONNX | Embed documents locally, search by meaning across your entire workspace |
| **Text Classification** | Transformers.js | Sentiment analysis, topic classification, intent detection — no API |
| **Local Translation** | Transformers.js | Translate documents between languages without cloud APIs |
| **Named Entity Recognition** | Transformers.js | Extract people, orgs, dates, locations from documents locally |

> **Hardware note:** Local LLM requires a device with WebGPU support and ≥8GB RAM. Smaller models (1B–3B params) work well on modern laptops. The transcription and NLP features run on CPU via WASM and work on any device.

---

### 6. Specialized Workspaces *(Phase 6)*
Tools for highly proprietary, industry-specific file formats that cannot be uploaded to cloud platforms.

| Workspace | Engine | What It Does |
|---|---|---|
| **Geo-Spatial** | gdal3.js | Convert proprietary shapefiles (.shp) to GeoJSON, reproject maps locally. |
| **3D CAD** | OpenCascade.js | View unreleased product designs (.step, .iges), convert to .stl for printing. |
| **Security/Crypto** | libsodium.js | File encryption, key generation, hash validation — zero risk of key leakage. |

---

### 7. Custom WASM Plugin Runtime *(Phase 7)*
Turning LocalMind into an extensible platform.

| Capability | What It Does |
|---|---|
| **BYOW (Bring Your Own WASM)** | Users compile their own C++/Rust scripts to `.wasm` and load them into LocalMind. |
| **Data Pipelines** | Drop a proprietary file, select your custom WASM module, and process it locally. |
| **Marketplace** | A community-driven library of open-source WASM modules for niche data formats. |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser Tab                           │
│                                                              │
│  ┌─────────────┐   ┌──────────────────────────────────────┐  │
│  │    UI       │   │          Web Workers Pool            │  │
│  │  (Svelte)   │◄──►                                      │  │
│  │             │   │  DuckDB WASM    │  FFmpeg WASM        │  │
│  │  Svelte     │   │  Tesseract WASM │  Whisper WASM       │  │
│  │  Stores     │   │  ONNX Runtime   │  Pyodide WASM       │  │
│  └─────────────┘   │  MuPDF WASM     │  tree-sitter WASM   │  │
│                    │  magick-wasm    │  wa-sqlite WASM     │  │
│                    │  ZXing WASM     │  WebLLM (WebGPU)    │  │
│                    │  gdal3.js       │  OpenCascade.js     │  │
│                    │  libsodium.js   │  Custom User WASM   │  │
│                    │  libarchive.js  │  potrace-wasm       │  │
│                    └──────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 Local Storage Layer                    │  │
│  │  IndexedDB  │  OPFS  │  File System Access API         │  │
│  │  wa-sqlite (workspace state, saved queries)            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   AI Bridge — two modes                                │  │
│  │                                                        │  │
│  │  LOCAL MODE:  WebLLM / Whisper WASM / Transformers.js  │  │
│  │  ─────────── No data leaves the device, ever           │  │
│  │                                                        │  │
│  │  CLOUD MODE:  Consent-gated summary → AI provider      │  │
│  │  ─────────── User reviews payload before every request │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
               (cloud mode only, with user consent)
                              ▼
                ┌─────────────────────────┐
                │   AI Provider (Cloud)   │
                │   Receives: summary     │
                │   Returns: insight      │
                └─────────────────────────┘
```

**Key invariants:**
- Raw file bytes never leave the browser unless the user explicitly uses the File System Access API to save output
- AI requests carry only aggregated, user-reviewed payloads
- All WASM engines run in isolated Web Workers — UI thread stays responsive

---

## Technology Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | SvelteKit + Svelte + TypeScript |
| Styling | Tailwind CSS |
| State | Svelte Stores + SvelteKit load functions |

### Browser Runtime
| API | Purpose |
|---|---|
| WebAssembly (WASM) | Near-native computation in the browser |
| Web Workers | Off-main-thread processing — non-blocking UI |
| SharedArrayBuffer | Zero-copy data transfer between workers |
| File System Access API | Read/write local files without upload |
| IndexedDB + OPFS | Persistent local storage for large datasets |
| Streams API | Memory-efficient processing of large files |
| WebCrypto | Encryption at rest for sensitive workspaces |
| WebGPU *(optional)* | GPU acceleration for ML inference |

### Processing Engines
| Engine | Handles |
|---|---|
| DuckDB WASM | SQL queries, analytical processing of CSV/Parquet/JSON |
| FFmpeg WASM | Video/audio conversion, compression, thumbnail generation |
| Tesseract WASM | OCR on images and scanned PDFs |
| ONNX Runtime Web | Local ML inference (classification, embeddings, NER) |
| Apache Arrow | Columnar in-memory data format for zero-copy interchange |
| **WebLLM** *(new)* | Local LLM inference via WebGPU — Phi-3, Gemma, Llama 3.2 |
| **Whisper WASM** *(new)* | Offline speech-to-text transcription (tiny/base/small models) |
| **Transformers.js** *(new)* | Hugging Face NLP/vision tasks via ONNX — embeddings, translation, sentiment |
| **Pyodide** *(new)* | Full CPython runtime in the browser — pandas, numpy, polars, scikit-learn |
| **wa-sqlite** *(new)* | SQLite WASM for persistent workspace state, saved queries, and user preferences |
| **MuPDF WASM** *(new)* | Advanced PDF operations — merge, split, redact, annotate |
| **tree-sitter WASM** *(new)* | Incremental code parsing for 40+ languages — structure extraction, complexity analysis |
| **magick-wasm** *(new)* | ImageMagick in the browser — advanced image filters, format conversion, compositing |
| **ZXing WASM** *(new)* | Barcode and QR code detection and decoding from images |
| **libarchive.js** *(new)* | Archive extraction in the browser (ZIP, RAR, 7z, TAR) |
| **rembg (WebGPU)** *(new)* | AI-powered image background removal (U2Net/RMBG models) |
| **potrace-wasm** *(new)* | Tracing bitmap images (PNG/JPG) to scalable vector graphics (SVG) |
| **gdal3.js** *(new)* | Geospatial conversion (Shapefile to GeoJSON) and coordinate reprojection |
| **OpenCascade.js** *(new)* | High-performance 3D CAD viewing and manipulation (.step, .iges, .stl) |
| **libsodium.js** *(new)* | Cryptographic primitives — secure encryption, hashing, and key generation |
| **Custom WASM** *(new)* | User-provided WASM modules for proprietary data processing |

### Visualization
| Library | Use Case |
|---|---|
| Apache ECharts | Data dashboards and pivot charts |
| D3.js | Custom visualizations and graph layouts |
| Chart.js | Lightweight chart widgets |

---

## Development Methodology: Spec-First & Contract-First

LocalMind is built with strict adherence to a **Spec-First and Contract-First approach**. Before any code is written for a new feature, its behavior, UI constraints, and threading models must be fully specified. Furthermore, because the architecture relies heavily on Web Workers and privacy-preserving API boundaries, all data structures passing between threads or leaving the device must be defined in strict contracts.

All specifications, contracts, and actionable tasks live in the `docs/` directory:

- **`docs/specs/`**: Contains detailed feature specifications (e.g., Data Ingestion, AI Insights).
- **`docs/contracts/`**: Contains the JSON/TypeScript data structures for message passing.
  - *UI-Worker Contracts*: Defines how the Svelte main thread communicates with WASM Web Workers.
  - *Cloud AI Contracts*: Defines the exact, aggregated payloads permitted to be sent to external AI providers.
- **`docs/tasks/`**: Contains granular, actionable development tasks mapped directly back to the specs and contracts.

When contributing to LocalMind, always consult the `docs/` folder first, and ensure any architectural changes are reflected in the contracts before implementation.

---

## Getting Started

> Prerequisites: Node.js 20+, npm 9+

```bash
# Clone the repository
git clone https://github.com/your-org/localmind.git
cd localmind

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Some APIs (SharedArrayBuffer, OPFS, WebLLM) require specific cross-origin isolation headers. The dev server configures these automatically via `vite.config.ts` (COOP/COEP headers).

---

## Privacy Principles

Our commitment:

- ✅ Files stay on your device by default
- ✅ Core features never require an upload
- ✅ AI features are completely optional and can be disabled globally
- ✅ Every cloud request shows you exactly what will be sent before it fires
- ✅ No telemetry or usage tracking on free tier without explicit opt-in

---

## Target Users & Use Cases

Every segment has the same core problem: they have sensitive files, they need to extract value, and every existing tool either requires a risky cloud upload or complex local installation. LocalMind solves this by letting them "just drop it in the browser."

### Phase 1 — Early Adopters *(Launch criteria: Data Workspace complete)*
**Developers & Data Analysts**
* **The Pain:** Need to query huge CSVs, inspect JSON logs, or profile datasets without uploading to an online formatter or spinning up a local Python environment.
* **The Solution:** Drop a 10M row CSV or 500MB JSON file into LocalMind, run SQL queries via DuckDB, and chart results instantly. 
* **Why they pay:** Saved queries, schema persistence, and local code structure analysis.

**Startup Founders & Finance Teams**
* **The Pain:** Handling sensitive cap tables, burn rate Excel files, or raw Stripe exports that cannot be uploaded to random third-party tools.
* **The Solution:** Drag in the file, get instant charts and pivot tables, entirely offline.
* **Why they pay:** AI Credits to generate the board report narrative (via the consent-gated cloud bridge).

### Phase 2 — Professional Expansion *(Launch criteria: Document Workspace + 1,000 MAU)*
**HR & Legal Teams**
* **The Pain:** Processing highly confidential salary data, employee reviews, NDAs, and discovery documents. Uploading these to cloud PDF/CSV tools is a privacy violation.
* **The Solution:** Compare NDA versions via local OCR, or process payroll CSVs to find anomalies — zero upload risk.
* **Why they pay:** Enterprise tier for team workspaces and audit logs.

**Marketing Teams**
* **The Pain:** Struggling with massive campaign exports and customer segment CSVs in Excel (which crashes) or Tableau (which requires expensive licenses).
* **The Solution:** Instant pivot tables and charts right in the browser. 
* **Why they pay:** AI Credits for "write me a summary of this campaign performance."

### Phase 3 — Regulated Industries *(Launch criteria: Enterprise tier live + SOC 2 initiated)*
**Healthcare & Education**
* **The Pain:** HIPAA and FERPA compliance means zero cloud tools allowed for patient records, clinical trials, or student data.
* **The Solution:** Run SQL or Python (Pyodide) on datasets locally, or OCR scanned medical forms without any data leaving the device.
* **Why they pay:** Enterprise compliance docs and fully offline/air-gapped deployment.

**Manufacturing & Hardware Startups**
* **The Pain:** QA reports, sensor data logs, and unreleased 3D CAD models (.step, .stl) are highly proprietary. Uploading CAD files to online viewers risks IP theft.
* **The Solution:** Drop the sensor CSV to chart trends offline, or view/convert 3D models using OpenCascade.js in the browser.
* **Why they pay:** On-premise tier and advanced CAD processing capabilities.

**Urban Planning & Logistics**
* **The Pain:** Proprietary land use shapefiles and routing data cannot be sent to public Google Maps APIs.
* **The Solution:** Convert and map geospatial data locally via gdal3.js.
* **Why they pay:** Enterprise data privacy guarantees.

**Security Engineering**
* **The Pain:** Need to encrypt files or generate hashes, but pasting keys into online tools is a security violation.
* **The Solution:** File encryption and hashing using libsodium.js, entirely client-side.
* **Why they pay:** Trusted, auditable local toolset.

---

## Business Model

### Free
- Local processing — all modules
- Basic SQL, charts, and exports
- Standard file size limits (up to 500MB)

### Pro — *$12/month*
- Advanced analytics and visualizations
- Saved workspaces and automation
- Large file support (up to 10GB)
- Workspace templates and sharing
- Priority processing

### AI Credits
Cloud AI features (summaries, report generation, natural language queries) are billed per-use, because they incur real inference costs. Local processing remains fully available regardless of AI credit balance.

### Enterprise
- SSO and team workspaces
- Audit logs and data governance
- On-premise deployment
- Custom integrations and SLAs
- Security review and compliance documentation

---

## Success Metrics

### Product Health
- Time to first insight (target: < 5s for a 100MB CSV)
- Max file size supported without degradation
- P99 processing latency in Web Workers
- AI opt-in rate vs. opt-out rate

### Business Health
- Monthly Active Users (MAU)
- Free → Pro conversion rate
- Enterprise customers
- AI credit consumption per user
- 30-day and 90-day retention

---

## Non-Goals

LocalMind is **not** trying to:

- Replace DuckDB, FFmpeg, Tesseract, or ONNX Runtime
- Build proprietary WASM engines from scratch
- Become a general-purpose cloud storage or collaboration tool

Instead, LocalMind combines proven browser technologies into a cohesive, privacy-first user experience that makes these tools accessible to non-engineers.

---

## Design Principles

Every feature must answer yes to at least four of these five questions:

1. Can this run locally?
2. Can we avoid uploading data?
3. Does the experience remain fast?
4. Can users understand what is happening?
5. Is AI strictly optional here?

If fewer than four answers are "yes," reconsider the feature scope before building.

---

## Contributing

This project is in early development. Contribution guidelines will be published when the MVP Data Workspace reaches beta.

In the meantime, feel free to open issues for:
- Feature requests
- Privacy model feedback
- WASM engine integration ideas

---

## License

MIT © LocalMind Contributors
