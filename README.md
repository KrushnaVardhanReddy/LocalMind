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

Instead of installing dozens of separate applications — spreadsheets, PDF tools, diagram editors, BI dashboards, AI chat — users open LocalMind once. Capabilities load on-demand as WASM modules. Everything runs locally.

This is not another online file converter. This is a **privacy-first local AI workspace.**

---

## Status

> 🔨 **Currently building — LocalMind Core MVP**

| Module | Scope | Status |
|---|---|---|
| **LocalMind Analytics** | CSV, Excel, DuckDB, BI Pivot, Charts | 🟢 MVP Focus |
| **UX & Polish** | Dashboards, Templates, Export | 🟢 MVP Focus |
| **LocalMind Docs** | PDF, DOCX, OCR, Search | ⏸ Deferred (Post-v1) |
| **LocalMind DevTools** | JSON Validators, Logs, APIs | ⏸ Deferred (Post-v1) |
| **Plugin Ecosystem** | Media, Intelligence, Special Apps | ⏸ Deferred (Post-v1) |

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
| **Offline-capable** | A PWA Service Worker caches the app shell so the tool works after first load — no internet required |
| **Accessible** | Core workflows meet WCAG 2.1 AA — keyboard navigable, screen-reader friendly, sufficient contrast |

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

## Core Product MVP

The core of LocalMind focuses strictly on data, documents, and developer utilities.

### 1. LocalMind Analytics
Process structured data at scale, directly in the browser.

| Format | Features |
|---|---|
| CSV, Excel, JSON, Parquet, SQLite (libSQL/Turso), Arrow/Feather | SQL queries via DuckDB WASM |
| | Pivot tables, charts, visualizations |
| | Data cleaning and validation |
| | Column statistics and profiling |
| | **Multi-File Auto-Joins** — drag and drop different files (e.g. CSV and Parquet) and join them visually without writing SQL |
| | **Visual Data Diffing** — compare two datasets and highlight added, removed, or modified rows locally |
| | **PII Detection & Masking** — auto-detect names, emails, SSNs, credit cards |
| | **Schema Inference** — generate TypeScript types, SQL DDL, or Pydantic models from any file |
| | **Archive Extraction** — locally extract `.zip`, `.rar`, and `.7z` datasets via libarchive WASM |
| | **Drag-and-Drop BI Pivot (Tableau-style)** — visually explore data by dragging dimensions and measures to generate charts without writing SQL |
| | **Python Notebook** — run pandas/numpy/polars locally via Pyodide WASM |
| | **Interactive Dashboards** — pin multiple charts to a grid, linked by global filters, saved locally via OPFS |
| | **AI Chart Customization** — describe a chart in plain English; AI returns an ECharts config applied instantly. |
| | Export results in multiple formats |
| | Optional AI insights (consent-gated) |

---

### 2. LocalMind Docs
Extract meaning from documents without cloud parsing APIs.

| Format | Features |
|---|---|
| PDF, DOCX, Images | OCR via Tesseract WASM |
| | **Auto-Deskew & Enhance** — clean up scanned documents via OpenCV WASM before OCR for higher accuracy |
| | Full-text search |
| | Side-by-side document comparison |
| | Structured data extraction |
| | **Bulk Document Parsing** — drop hundreds of invoices/resumes to extract structured JSON/CSV offline via OCR + AI |
| | **Everyday PDF Tools** — compress, unlock/decrypt, merge, split, and redact via MuPDF WASM |
| | **Universal conversion** — Markdown → DOCX → PDF → HTML via Pandoc WASM |
| | **Browser-Based PII Redaction** — auto-detect names, SSNs, and addresses via local AI (OCR + NER) and visually redact them before saving |
| | **Semantic search** — find paragraphs by meaning using local embeddings |
| | **Local AI Resume Screener** — drop a job description and a folder of PDF/DOCX resumes to rank candidates offline via semantic search without leaking PII |
| | Optional AI summaries (consent-gated) |

---

### 3. LocalMind DevTools
Utilities for engineers and QA testers working with structured formats, network logs, and testing.

| Format | Features |
|---|---|
| JSON, YAML, Logs, OpenAPI, CSV, HAR | Schema validation and formatting |
| | **Transformation Pipelines** — chain operations together (e.g., Base64 Decode → Gunzip → Format JSON) visually |
| | Side-by-side diff |
| | Log statistics and pattern analysis |
| | Local SQL on any structured file |
| | OpenAPI linting and visualization |
| | **Code structure analysis** — parse source files, extract functions/classes via tree-sitter WASM |
| | **Git History Analyzer** — drop a `.git` folder to instantly visualize code churn and commit stats locally |
| | **Visual Flowcharts & ER Diagrams** — drop a SQL schema or write markdown to generate offline Mermaid.js architecture diagrams |
| | **PCAP Network Analyzer** — parse and visualize Wireshark packet captures securely without cloud uploads |
| | **Visual Log Parser & Anomaly Detector** — highlight text in unstructured test/app logs to auto-generate regex for DuckDB parsing, group similar errors via embeddings |
| | **Regex playground** — test regex patterns against local file content live |
| | **Secret scanner** — detect accidentally exposed API keys, tokens, passwords |
| | **Binary/Hex inspector** — view binary files in structured hex format |
| | **JWT & certificate inspector** — decode and validate tokens and SSL certs locally |
| | **HAR File Analyzer** — drop a `.har` network export to parse and visualize API waterfalls without leaking tokens |
| | **Visual Regression Diffing** — drop expected/actual screenshots to generate pixel-by-pixel diffs locally |
| | **Test Data Generator** — drop a JSON/SQL schema to instantly generate 100k rows of mock data via WASM faker |
| | **Local Mock Server** — load an OpenAPI spec to mock API responses in-browser via Service Worker |

---

## Plugin Ecosystem (Post-MVP)

LocalMind is built on a **Plugin SDK** that allows professional vertical solutions to extend the platform without polluting the core product. All plugins run entirely locally using the existing WASM runtime.

**Professional Plugin Verticals (Planned):**
- **LocalMind Intelligence:** Fully local AI (Phi-3, Llama 3) via WebGPU, semantic search, and clustering.
- **LocalMind Media:** Transcode and process audio/video via FFmpeg + Whisper WASM. Summarize meetings and podcasts offline.
- **LocalMind Canvas:** Infinite whiteboard (Excalidraw) for investigation mapping and data flow diagrams.
- **LocalMind Annotate (Image Workspace):** A lightweight Paint-style annotation workspace. Draw, highlight, annotate screenshots, crop images, and export to PNG/SVG/PDF — entirely offline via canvas and WASM. AI can auto-label objects or generate alt-text for accessibility.
- **LocalMind Diagrams:** AI-powered diagram generation from code, databases, or plain English. Generate UML class diagrams from source files via tree-sitter, ER diagrams from SQLite schemas via DuckDB, and architecture diagrams from OpenAPI specs — all rendered offline via Mermaid.js or D3 and exported to PNG/SVG/PDF.
- **Engineering Plugins:** 3D CAD viewer (OpenCascade.js), Geospatial analysis (gdal3.js), Code Interpreter (Pyodide).
- **Security Plugins:** Cryptography workspace (libsodium), Threat intelligence, Secrets & API key auditor.
- **Legal Plugins:** Contract analyzer, Deposition summarizer, Legal case research vault.
- **Finance Plugins:** Personal finance & tax workspace, Stock backtester, Insurance policy simplifier.
- **Education Plugins:** Academic paper summarizer, Citation builder, Plagiarism checker.

> **Deferred (post-MVP):** AI Speech & Articulation Coach — valid offline privacy use case (Whisper-based), revisit after core workspaces ship.
>
> **Out of scope permanently:** Consumer lifestyle apps (kids learning, voice journals, recipe vaults, grocery planners) are not LocalMind features. If pursued, they must be entirely separate products built on top of the Plugin SDK.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser Tab                           │
│                                                              │
│  ┌─────────────┐   ┌──────────────────────────────────────┐  │
│  │    UI       │   │     WorkerPool Manager               │  │
│  │  (Svelte)   │◄──►  (src/lib/services/WorkerPool.ts)    │  │
│  │             │   │  Routes typed messages, manages       │  │
│  │  Svelte     │   │  lifecycle (init/ready/busy/error)    │  │
│  │  Stores     │   │                                      │  │
│  └─────────────┘   │  DuckDB WASM    │  FFmpeg WASM        │  │
│                    │  Tesseract WASM │  Whisper WASM       │  │
│                    │  ONNX Runtime   │  Pyodide WASM       │  │
│                    │  MuPDF WASM     │  tree-sitter WASM   │  │
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
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   PWA Service Worker                                   │  │
│  │   Caches app shell + WASM bundles for offline use      │  │
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
- AI API keys are held **in-memory only** during the session — never written to `localStorage` or any persistent store
- The `WorkerPool` manager is the single point of contact between the UI and all WASM workers — no direct Worker instantiation in components

### Lazy-Loaded WASM & Caching (Bundle Size Management)
To prevent a massive initial payload (since compiling DuckDB, FFmpeg, and Tesseract into one app could easily exceed 100MB), LocalMind uses strict Just-in-Time (JIT) lazy loading:
- **Core UI Load:** The initial Svelte app load is tiny (~200KB).
- **JIT Loading:** WASM engines are downloaded *only* when the user triggers a workflow that requires them (e.g., dropping a CSV lazy-loads DuckDB; dropping a video lazy-loads FFmpeg).
- **Service Worker Caching:** Once a WASM bundle is downloaded, the PWA Service Worker caches it permanently. Subsequent loads—even after refreshing or going offline—are instant because the heavy WASM files are served directly from the browser's Cache Storage.

---

## Deployment Strategy (Web vs. Desktop)

LocalMind operates on a dual-deployment model to balance zero-friction acquisition with power-user performance.

### 1. Web Version (The Default)
* **Access:** `localmind.dev`
* **Why it exists:** Zero friction. Users do not need to install software or get IT approval. The browser's security sandbox guarantees to the user that we cannot scan their hard drive.
* **Limitations:** Browser memory limits (typically 2GB–4GB max per tab) restrict the size of files that can be processed.
* **Offline:** A PWA Service Worker caches the app shell and WASM bundles so the tool continues to work offline after first load.

> ⚠️ **Production Hosting Requirement:** LocalMind requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers to enable `SharedArrayBuffer` (required by DuckDB WASM). These headers **must be configured at the hosting layer** (e.g., Cloudflare Pages `_headers` file, Vercel `vercel.json`, or Nginx config) — not just in the dev server. Failure to set these headers will cause the DuckDB worker to silently fail in production.

### 2. Desktop Version (Pro / Enterprise)
* **Access:** Portable Executable (packaged via **Tauri**).
* **Why it exists:** Power users. When a user needs to query a 50GB log file or run Llama 3.2 locally, the browser sandbox becomes a bottleneck.
* **Capabilities:** The Tauri app uses the exact same SvelteKit UI and WASM architecture, but removes browser memory limits, enables direct filesystem read/write (no "Save As" prompts), and allows full hardware utilization (unrestricted WebGPU/CPU access).
* **Zero IT Friction:** Shipped as a portable `.exe` / `.app` / `AppImage`. It runs instantly from a USB drive or Downloads folder without requiring Administrator privileges or an installer.

---

## Technology Stack

### Frontend & Shell
| Layer | Technology |
|---|---|
| Web Framework | SvelteKit + Svelte + TypeScript |
| Desktop Shell | Tauri (Rust) for native OS access |
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
| **OpenCV WASM** *(new)* | Image enhancement and auto-deskewing for scanned documents |
| **magick-wasm** *(new)* | ImageMagick in the browser — advanced image filters, format conversion, compositing |
| **ZXing WASM** *(new)* | Barcode and QR code detection and decoding from images |
| **libarchive.js** *(new)* | Archive extraction in the browser (ZIP, RAR, 7z, TAR) |
| **rembg (WebGPU)** *(new)* | AI-powered image background removal (U2Net/RMBG models) |
| **potrace-wasm** *(new)* | Tracing bitmap images (PNG/JPG) to scalable vector graphics (SVG) |
| **gdal3.js** *(new)* | Geospatial conversion (Shapefile to GeoJSON) and coordinate reprojection |
| **OpenCascade.js** *(new)* | High-performance 3D CAD viewing and manipulation (.step, .iges, .stl) |
| **libsodium.js** *(new)* | Cryptographic primitives — secure encryption, hashing, and key generation |
| **Custom WASM** *(new)* | User-provided WASM modules for proprietary data processing |
| **Mock Service Worker** *(new)* | Intercepts network requests to run a mock API server directly in the browser |
| **pixelmatch** *(new)* | High-performance, pixel-level image diffing for visual regression testing |

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

### AI Delegation Pipeline (Jules + OpenCode + Antigravity)

We use a three-tier AI delegation strategy for rapid development:
- **Jules:** Handles asynchronous PR generation for new WASM workers, unit tests, and isolated logic (via `jules_submit.py`).
- **OpenCode (Local LLM):** Handles quick config tweaks and minor localized edits.
- **Antigravity:** Handles complex debugging, merge conflict resolution, and architectural integration.

---

## Getting Started

> Prerequisites: Bun v1.1+

```bash
# Clone the repository
git clone https://github.com/your-org/localmind.git
cd localmind

# Install dependencies
bun install

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Some APIs (SharedArrayBuffer, OPFS, WebLLM) require specific cross-origin isolation headers. The dev server configures these automatically via `vite.config.ts` (COOP/COEP headers).

---

## LocalMind Sessions

LocalMind introduces a fundamentally different way to save and share work.

Instead of scattering disconnected files across your filesystem — a PDF here, a spreadsheet there, a SQL script somewhere else — LocalMind wraps everything into a **Session**: a single portable workspace snapshot.

A session can contain:
- SQL queries and their result sets
- Charts and dashboard layouts
- Annotated images and diagrams
- AI conversation history
- Uploaded files (or references to local paths in the Desktop version)
- Notes and workspace state

**Sharing is user-controlled:**

| Method | How |
|---|---|
| **Local export** | Save as `workspace.lm` — open the complete environment on any LocalMind installation |
| **Static report** | Export as a self-contained HTML file — no LocalMind required to view |
| **PDF export** | Snapshot the full workspace as a printable PDF report |
| *(Future)* **Read-only link** | Optional cloud share for team review — nothing stored server-side by default |

> **Privacy note:** Sessions exported locally never leave your device. Cloud sharing is always opt-in and user-initiated.

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
* **The Pain:** Processing highly confidential candidate resumes, salary data, NDAs, and discovery documents. Uploading a batch of resumes to a cloud AI screener is a direct violation of candidate data privacy (GDPR/CCPA).
* **The Solution:** Use the Local Resume Screener to rank hundreds of PDFs against a job description instantly in the browser. Compare NDA versions via local OCR — zero upload risk.
* **Why they pay:** Enterprise tier for team workspaces, auditable local compliance, and custom local embedding models.

**Marketing Teams**
* **The Pain:** Struggling with massive campaign exports and customer segment CSVs in Excel (which crashes) or Tableau (which requires expensive licenses).
* **The Solution:** Instant pivot tables and charts right in the browser. 
* **Why they pay:** AI Credits for "write me a summary of this campaign performance."

### Phase 3 — Regulated Industries *(Launch criteria: Enterprise tier live + SOC 2 initiated)*
**Clinical Research & Healthcare (HIPAA)**
* **The Pain:** Clinical data managers analyzing drug trials or hospital records cannot upload patient datasets to cloud BI tools due to massive HIPAA compliance penalties.
* **The Solution:** Drop patient CSVs into the browser to run SQL or Python (Pyodide) locally. Extract text from scanned medical forms via local OCR, ensuring zero data ever leaves the device.
* **Why they pay:** Guaranteed HIPAA compliance, audit logs, and the ability to process sensitive health data locally.

**Defense & Intelligence (Air-Gapped Environments)**
* **The Pain:** Defense contractors and intelligence analysts work in SCIFs (secure rooms with absolutely zero internet access). They are entirely cut off from modern SaaS data tools.
* **The Solution:** Deploy the LocalMind Tauri Desktop App. Analysts can query massive datasets, format intercepted JSON, and summarize offline intel using local LLMs.
* **Why they pay:** High-ticket enterprise licensing for offline-capable, air-gapped deployments.

**Film & VFX Production**
* **The Pain:** Editors work with massive 4K/8K raw video files. Uploading these to a cloud service just to generate a lightweight MP4 proxy or extract an audio stem takes hours.
* **The Solution:** Drop the massive video file into LocalMind. It uses FFmpeg WASM to instantly transcode a 1080p proxy or extract the audio offline, utilizing the local CPU.
* **Why they pay:** Pure speed. Bypassing upload/download bandwidth bottlenecks entirely.

**Manufacturing & Hardware Startups**
* **The Pain:** QA reports, sensor data logs, and unreleased 3D CAD models (.step, .stl) are highly proprietary. Uploading CAD files to online viewers risks IP theft.
* **The Solution:** Drop the sensor CSV to chart trends offline, or view/convert 3D models using OpenCascade.js in the browser.
* **Why they pay:** On-premise tier and advanced CAD processing capabilities.

**Urban Planning & Logistics**
* **The Pain:** Proprietary land use shapefiles and routing data cannot be sent to public Google Maps APIs.
* **The Solution:** Convert and map geospatial data locally via gdal3.js.
* **Why they pay:** Enterprise data privacy guarantees.

**Automotive & Telemetry Engineering**
* **The Pain:** Engineers generate massive CAN bus and OBD-II telemetry logs (CSV/JSON) during pre-release vehicle testing. Uploading these leaks unreleased IP. While they *could* use Tableau Desktop, it requires expensive licenses, heavy local installation, and slow IT approval just for quick, ad-hoc log checks.
* **The Solution:** Drop the massive telemetry log straight into the browser. Use DuckDB to instantly chart engine RPM vs. battery temperature offline, with zero installation required.
* **Why they pay:** High-performance, offline data visualization that bypasses IT friction and complies with strict IP security.

**Investigative Journalism & Legal Defense**
* **The Pain:** Receiving massive data dumps (like the Panama Papers) or secret audio recordings. Using cloud AI transcription or summarizers risks exposing anonymous sources to subpoenas or tech companies.
* **The Solution:** Drop 50 hours of audio and 10,000 leaked PDFs into LocalMind. Use local Whisper WASM to transcribe and Transformers.js to make the archive semantically searchable—completely offline (even air-gapped).
* **Why they pay:** Absolute guarantee of source protection.

**Financial Auditors (M&A Due Diligence)**
* **The Pain:** Reviewing raw General Ledger exports (millions of rows) during Mergers & Acquisitions. Uploading a target company's financials to third-party cloud tools before the deal is public carries severe insider trading risks.
* **The Solution:** Drop the ledger CSV to run SQL locally, hunting for fraudulent anomalies in a completely isolated "Clean Room" browser environment.
* **Why they pay:** Guaranteed data isolation during high-stakes corporate audits.

**Security Engineering**
* **The Pain:** Need to encrypt files or generate hashes, but pasting keys into online tools is a security violation.
* **The Solution:** File encryption and hashing using libsodium.js, entirely client-side.
* **Why they pay:** Trusted, auditable local toolset.

**Education & K-12 Administration**
* **The Pain:** Schools are bound by strict FERPA (US) and GDPR (EU) privacy laws. Teachers and administrators cannot legally upload student grades, attendance, or Individualized Education Programs (IEPs) to unvetted cloud AI tools. Furthermore, students on IT-locked Chromebooks cannot install data science tools like Python or PostgreSQL.
* **The Solution:** A principal can drag a massive CSV of student data into LocalMind to run pivot tables and charts securely in the browser without uploading any PII. Students can load LocalMind (even offline) to learn SQL and process media without ever installing desktop software.
* **Why they pay:** Guaranteed student data compliance and seamless access on restricted school hardware.

---

## Business Model (Open Core)

LocalMind operates on a Freemium / Open Core model to ensure privacy claims remain auditable while building a sustainable business.

> **Architecture Note:** All Pro, Enterprise, and Monetization features are maintained in a separate, private repository. These commercial features are shipped either as isolated WASM Plugins or baked into the proprietary Desktop build, ensuring the public open-source repository remains strictly focused on the core free tier.

### Free (Open Source)
- **Deployment:** Web app (`localmind.dev`)
- **Features:** Local processing (all modules), basic SQL, charts, and exports.
- **Limits:** Standard browser file size limits (up to 500MB).
- **Why:** Anyone can verify the code to ensure data never leaves the browser. 

### Pro — *$12/month*
- **Deployment:** Tauri Desktop App + Cloud Sync
- **Features:** 
  - **Desktop App:** Unlocks the OS sandbox for massive files (up to 10GB) and unthrottled CPU/GPU access.
  - **Cloud Sync:** Saved workspaces, templates, and team sharing across devices.
  - Advanced analytics and priority processing.

### Team / Business — *$45/user/month*
- **Deployment:** Tauri Desktop App + Team Cloud Sync
- **Features:**
  - Everything in Pro, plus centralized billing.
  - Shared team workspaces, query libraries, and custom dashboard templates.
  - Role-based access control (RBAC) and basic audit logs.
  - Shared AI Credit pool for the entire team.

### AI Credits
Cloud AI features (summaries, report generation, natural language queries) are billed per-use, because they incur real inference costs. Local processing remains fully available regardless of AI credit balance.

> **BYOK vs. LocalMind Proxy:** Phase 1 uses a strict Bring Your Own Key (BYOK) model — API keys are held in-memory and sent directly from the browser to the AI provider; LocalMind never sees them. A future **LocalMind Proxy** (hosted on Cloudflare Workers) will offer a subscription-funded alternative that removes BYOK friction for non-technical users. The proxy is stateless and logs nothing — see `docs/specs/proxy/01_cloudflare_proxy_spec.md` for the architecture.

### Enterprise — *Custom Pricing ($10k+/year)*
- SSO (Okta/SAML) and advanced data governance.
- Strict audit logs for compliance (HIPAA/SOC2).
- On-premise deployment options (air-gapped environments).
- Custom integrations and SLAs.
- Security review and compliance documentation.

### Plugin Marketplace (Future)
- Third-party developers can build and sell specialized plugins (Legal, Finance, Medical, Construction verticals) via the LocalMind Plugin SDK.
- **Revenue share:** 70/30 (developer keeps 70%).
- Plugins run entirely locally using the existing WASM runtime — no cloud infrastructure needed.
- This scales the platform into verticals without the core team building every niche tool.

### Sponsorships & Grants
- **GitHub Sponsors** — community-funded open source sustainability.
- **NLnet / Sovereign Tech Fund** — EU grants specifically fund privacy-first and open-source tools. LocalMind fits the criteria perfectly.
- **Google Summer of Code** — funded open-source contributors.

---

## Launch Strategy

### Phase 1: Community Launch
1. Ship polished Analytics workspace (Pivot Builder + ECharts + Templates).
2. Create a beautiful landing page with embedded demo.
3. Launch on **Product Hunt** and **Hacker News** — the pitch: *"Tableau but everything runs in your browser. Zero cloud. Zero uploads."*

### Phase 2: First Revenue
4. Launch **Tauri Desktop Pro tier** at $12/month.
5. Desktop users get unlimited storage, native file system access, and no browser tab limitations.

### Phase 3: Ecosystem
6. Open the **Plugin SDK** and marketplace.
7. Let vertical specialists (lawyers, accountants, security analysts) build on top of LocalMind.
8. Take a revenue share on plugin sales.

> **The moat:** Privacy-first gets stronger over time as data regulations tighten (GDPR, HIPAA, CCPA, state-level AI laws). Every new regulation makes LocalMind's architecture more valuable.


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

### Accessibility Standard
All UI components must meet **WCAG 2.1 AA** as a baseline:
- Full keyboard navigation (no mouse-only interactions)
- Semantic HTML with correct ARIA roles
- Minimum 4.5:1 color contrast ratio for body text
- Focus indicators on all interactive elements
- Screen reader announcements for async state changes (loading, error, success)

### Global Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Execute current query / primary action |
| `Ctrl+K` | Open file picker |
| `Ctrl+Shift+P` | Open command palette |
| `Escape` | Close active modal or panel |

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
