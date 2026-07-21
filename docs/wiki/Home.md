# LocalMind Wiki

Welcome to the **LocalMind** project wiki! This is the central hub for understanding the architecture, philosophy, and capabilities of the LocalMind ecosystem.

## 🌟 What is LocalMind?
LocalMind is a privacy-first, browser-native operating system for your data. It brings enterprise-grade data analytics, document processing, media manipulation, and AI intelligence directly to your device. 

**Zero cloud. Zero data egress. Unlimited capabilities.**

By leveraging cutting-edge WebAssembly (WASM), WebGPU, and the Origin Private File System (OPFS), LocalMind eliminates the need to upload your sensitive data (invoices, code, network logs, medical records) to third-party servers.

---

## 📚 Core Concepts

### [1. The Local-First Philosophy](./Philosophy.md)
Why we built LocalMind. Understanding the shift from Cloud computing back to Edge/Local computing, and why privacy shouldn't be an opt-in feature.

### [2. Architecture Overview](./Architecture.md)
How LocalMind works under the hood. A deep dive into SvelteKit, Bun, Web Workers, Comlink, and our zero-copy data pipeline.

### [3. The WASM Engines](./Engines.md)
The heavy lifters of LocalMind. Learn about how we run DuckDB, FFmpeg, OpenCV, Transformers.js, and OpenCascade locally in the browser.

---

## 🚀 Workspaces (Phases)

LocalMind is divided into modular workspaces (Phases), each dedicated to a specific domain:

- **[Phase 1: Analytics & BI](../specs/phase-1/)** — Multi-GB DuckDB SQL engine, ECharts, visual joins, and Tableau-style pivoting.
- **[Phase 2: Docs Engine](../specs/phase-2/01_docs_engine_spec.md)** — Offline OCR, PDF manipulation, and PII redaction.
- **[Phase 3: Media Engine](../specs/phase-3/01_media_engine_spec.md)** — FFmpeg video transcoding and Whisper speech-to-text.
- **[Phase 4: DevTools](../specs/phase-4/01_devtools_engine_spec.md)** — tree-sitter code analysis, HAR/PCAP parsing, and mock servers.
- **[Phase 5: Intelligence](../specs/phase-5/01_intelligence_spec.md)** — Local WebLLM (Phi-3, Llama 3) via WebGPU.
- **[Phase 6: Specialized Plugins](../specs/phase-6/01_specialized_plugins_spec.md)** — GeoSpatial (GDAL), 3D CAD (OpenCascade), and Cryptography (libsodium).
- **[Phase 8: Whiteboard](../specs/phase-8/01_whiteboard_spec.md)** — Infinite offline canvas via Excalidraw.

---

## 🏢 Enterprise & Deployment

- **[Phase 9: Tauri Desktop App](../specs/phase-9/01_tauri_desktop_spec.md)** — Bypassing browser limits for unlimited OS storage and native filesystem access.
- **[Phase 10: Enterprise Tier](../specs/phase-10/01_enterprise_spec.md)** — SSO, RBAC, Audit Logging, and On-Premise Docker deployments.
- **[Phase 11: Monetization Proxy](../specs/phase-11/01_monetization_proxy_spec.md)** — Cloudflare-backed stateless proxy for AI API billing.

---

## 🛠️ Contributing

LocalMind enforces a strict **Spec-First** and **Contract-First** development cycle.
1. Read the specs in `docs/specs/`.
2. Review the TypeScript interfaces in `docs/contracts/`.
3. Pick up a task from the Tracker.
4. Ensure all WASM components are executed inside Web Workers to keep the main thread fluid.
