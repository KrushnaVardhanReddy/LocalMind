# LocalMind Wiki

Welcome to the **LocalMind** project wiki! This is the central hub for understanding the architecture, philosophy, and capabilities of the LocalMind ecosystem.

## 🌟 What is LocalMind?
LocalMind is a **privacy-first local AI workspace** — a browser-native environment that brings enterprise-grade data analytics, document processing, diagram generation, image annotation, and AI intelligence directly to your device, entirely offline.

**Zero cloud. Zero data egress. One install. Every tool.**

By leveraging cutting-edge WebAssembly (WASM), WebGPU, and the Origin Private File System (OPFS), LocalMind eliminates the need to upload sensitive data to third-party servers. The **Session system** (`project.lm`) further unifies all workspace state into a single portable snapshot — so users share complete analytical environments, not disconnected files.

---

## 📚 Core Concepts

### [1. The Local-First Philosophy](./Philosophy.md)
Why we built LocalMind. Understanding the shift from Cloud computing back to Edge/Local computing, and why privacy shouldn't be an opt-in feature.

### [2. Architecture Overview](./Architecture.md)
How LocalMind works under the hood. A deep dive into SvelteKit, Bun, Web Workers, Comlink, our zero-copy data pipeline, the Session system, and platform robustness.

### [3. The WASM Engines](./Engines.md)
The heavy lifters of LocalMind. Learn about how we run DuckDB, FFmpeg, OpenCV, Transformers.js, and OpenCascade locally in the browser.

### [4. Sessions & Workspace Snapshots](./Sessions.md)
How the `.lm` portable workspace format works — SessionManager, OPFS persistence, import/export, and the Session sharing model.

### [5. Platform Robustness](./Robustness.md)
CI/CD pipeline, Content Security Policy, Worker Error Boundaries, WASM cache versioning, and our quality standards.

---

## 🚀 Workspaces

LocalMind is divided into modular workspaces, each dedicated to a specific domain:

### MVP1 (Current Focus)
- **Analytics Workspace** (`/analytics`) — Multi-GB DuckDB SQL engine, ECharts, BI Pivot Builder (Tableau-style), Template Gallery, Report Export. **[Active development]**

### MVP2 (Post-Launch)
- **Sessions** — Portable `.lm` workspace snapshots. Save/export/import complete analytical environments.
- **Docs Workspace** (`/docs`) — Offline OCR, PDF manipulation, PII redaction, and semantic search. All WASM workers already built.

### MVP3 (Ecosystem)
- **Annotate Workspace** (`/annotate`) — Canvas-based image & screenshot annotation.
- **Diagrams Workspace** (`/diagrams`) — AI-powered UML, ER, and architecture diagram generation from code/SQL/plain English.
- **Media Plugins** — FFmpeg video transcoding, Whisper speech-to-text.
- **DevTools** (`/devtools`) — tree-sitter code analysis, HAR/PCAP parsing, transformation pipelines.
- **Intelligence** — Local WebLLM (Phi-3, Llama 3) via WebGPU.
- **Vertical Plugins** — GeoSpatial (GDAL), 3D CAD (OpenCascade), Cryptography (libsodium), Personal Finance, Medical, Legal, Vehicle Telemetry.

### Pro Tier (Private Repo)
- **Tauri Desktop App** — Bypasses browser memory limits. Unlimited OS filesystem access.
- **Enterprise** — SSO (Okta/SAML), RBAC, audit logging, on-premise deployment.

---

## 🔮 Future Concepts (Incubation)

- **[Future Concepts (Post-MVP)](./Future_Concepts.md)** — Ideas currently in incubation for user validation: P2P Collaboration, Local RAG, Browser-Native ETL, and Canvas views.

---

## 🏢 Commercial Architecture

All Pro, Enterprise, and Monetization features are in a **separate private repository**. The public OSS repo contains only the free-tier core. See `README.md → Business Model` for full tier details.

---

## 🛠️ Contributing

LocalMind enforces a strict **Spec-First** and **Contract-First** development cycle:
1. Read the specs in `docs/specs/`.
2. Review the TypeScript interfaces in `docs/contracts/`.
3. Pick up a task from `docs/tasks/TRACKER.md`.
4. Check `docs/tasks/PARALLEL_SETS.md` before running parallel Jules sessions.
5. Ensure all WASM components execute inside Web Workers — the main thread is for UI only.
6. Every PR must pass CI: `bun run check`, `bun run test`, `bun run build`, bundle size guard, and axe a11y audit.

See `CLAUDE.md` for the full AI agent collaboration guide.
