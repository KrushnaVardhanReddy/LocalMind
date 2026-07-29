# LocalMind Post-MVP1 Roadmap

## Strategic Context

MVP1 delivers: a polished Analytics workspace (BI Pivot, ECharts, Filters, Report Export, Template Gallery, Workspace Routing, Command Palette) with a full E2E test suite.

Post-MVP1 has three strategic goals in priority order:

1. **Sessions** — The `project.lm` portable workspace. This is the biggest product differentiator missing from any competitor. It also enables the viral loop (static HTML export already done in UX-3).
2. **Docs Workspace** — Activates HR/Legal/Healthcare users. All WASM workers (OCR, MuPDF, Semantic Search, OpenCV) are already built. This is pure UI surfacing.
3. **Plugin Polish + Revenue** — Complete the currently-running plugins, open the ecosystem, then gate the Pro tier (Tauri).

---

## What Already Exists (Don't Rebuild)

| Category | Done |
|---|---|
| WASM Workers | DuckDB, FFmpeg, Whisper, Tesseract, MuPDF, OpenCV, tree-sitter, WebLLM, wa-sqlite, Transformers.js |
| AI | WebLLM engine, Local Chat, AI Data Janitor |
| Media | FFmpeg, Whisper, Video Clipper |
| Plugins (done) | Geo-Spatial, AI Data Janitor, Video Clipper |
| Plugins (running) | 3D CAD, Crypto, Whiteboard, Language Learning |
| Docs WASM | OCR, PDF Manipulation, OpenCV, PII Redaction, Bulk Parse, MD Export, Semantic Search, Resume Screener |
| DevTools | Formatters, Converters, tree-sitter, Pipelines, Git, Log Parser, PCAP, HAR, Visual Regression, Test Data Gen, Mock Server |

---

## MVP2: Sessions + Docs Workspace Activation

**Why first:** Sessions is the stickiness layer — once users can save/share workspaces, retention improves dramatically. Docs Workspace is already 90% built at the WASM layer; it just needs UI routing and integration.

### MVP2 Wave A: Sessions Core & Docs Routing (Parallel, no overlap)
*Sessions touches OPFS/wa-sqlite. Docs touches new `/docs` route. Zero file overlap.*

- **[Sessions]** Session-1: Core Session Schema & Local Export
  - `src/lib/services/SessionManager.ts` — OPFS-backed `.lm` format
  - Serialize: active file, query history, pivot config, chart state, AI summaries
  - New task: `docs/tasks/cross_cutting/task_session1_core.md` ← **NEEDS CREATION**

- **[Docs]** Docs-1: Docs Workspace Route & Layout
  - Create `/docs` route with sidebar: file list, OCR queue, search panel
  - Wire existing Tesseract + MuPDF workers to the new UI
  - New task: `docs/tasks/phase-2/task_docs_workspace.md` ← **NEEDS CREATION**

### MVP2 Wave B: Sessions Import + Docs Search UI (Parallel)
*Session import touches SessionManager. Docs search touches `/docs` route only.*

- **[Sessions]** Session-4: Session Import (restore from `.lm` file)
  - Spec exists in TRACKER: `docs/tasks/cross_cutting/task_session4_import.md` ← **NEEDS CREATION**

- **[Docs]** Docs-2: Semantic Search UI
  - Visual search panel in `/docs` — uses existing Transformers.js embeddings
  - New task: `docs/tasks/phase-2/task_docs_search_ui.md` ← **NEEDS CREATION**

### MVP2 Wave C: Sessions PDF Export + Docs E2E (Parallel)
- **[Sessions]** Session-3: PDF Report Export (full workspace snapshot)
  - `docs/tasks/cross_cutting/task_session3_pdf_export.md` ← **NEEDS CREATION**
- **[Docs]** Docs E2E: End-to-End testing for the Docs workspace
  - Spec exists at `docs/tasks/phase-2/task_e2e.md` — needs expansion like Phase 1 E2E

---

## MVP3: Plugin Ecosystem + DevTools Completion

### MVP3 Wave A: Canvas Plugins (Parallel, no WorkerManager changes)
*All pure UI — reuse existing workers.*

- **[Plugin]** Task 14: LocalMind Annotate (Image & Screenshot Workspace)
  - `docs/tasks/phase-6/task14_annotate.md` ← **NEEDS CREATION**
- **[Plugin]** Task 15: LocalMind Diagrams (AI Diagram Generation)
  - `docs/tasks/phase-6/task15_diagrams.md` ← **NEEDS CREATION**
- **[DevTools]** Task 6: PII Data Sanitizer (JSON/CSV)
  - Spec exists: `docs/tasks/phase-4/task6_pii_sanitizer.md`

### MVP3 Wave B: Media + Vertical Plugins (Parallel)
- **[Media]** Task 4: Podcast & Meeting Summarizer (Whisper + WebLLM — no new workers)
- **[Media]** Task 5: Study Note & Flashcard Generator (Whisper + WebLLM — no new workers)
- **[Plugin]** Task 6: Offline Code Interpreter (Pyodide — NEW WorkerManager entry, so runs alone if grouped with non-WorkerManager tasks)

> **Conflict note:** Pyodide adds a new `getPyodide()` to WorkerManager.ts. Run it alone or pair with pure-UI tasks only.

### MVP3 Wave C: Remaining Niche Plugins (Parallel)
*All use existing DuckDB/WebLLM/OCR workers. No WorkerManager changes.*

- **[Plugin]** Task 7: Personal Finance & Tax Workspace
- **[Plugin]** Task 8: Medical & Health Insights
- **[Plugin]** Task 13: Vehicle Telemetry & CAN Bus Analyzer

### MVP3 Wave D: Legal & Education Vertical Plugins (Parallel)
- **[Legal]** Contract Analyzer, Deposition Summarizer, Case Research Vault
- **[Education]** Paper Summarizer, Citation Builder, Plagiarism Checker

---

## MVP4: Pro Tier (Private Repo Gate)

> ⚠️ These tasks must NOT be submitted to Jules against the public repo.

### MVP4 Wave A: Tauri Scaffolding (runs alone)
- Pro-1: Tauri Desktop App Scaffolding
- Pro-2: Storage Quota Bypass (native FS, no 2GB browser limit)

### MVP4 Wave B: Enterprise (runs alone, private repo)
- Ent-1: SSO (SAML/Okta)
- Ent-2: RBAC & Team Workspaces
- Ent-3: Audit Logging

---

## Task Files That Need to Be Created

| Task | File | Priority |
|---|---|---|
| Session-1: Core Schema & Local Export | `docs/tasks/cross_cutting/task_session1_core.md` | 🔴 High |
| Session-3: PDF Report Export | `docs/tasks/cross_cutting/task_session3_pdf_export.md` | 🔴 High |
| Session-4: Session Import | `docs/tasks/cross_cutting/task_session4_import.md` | 🔴 High |
| Docs-1: Docs Workspace Route | `docs/tasks/phase-2/task_docs_workspace.md` | 🔴 High |
| Docs-2: Semantic Search UI | `docs/tasks/phase-2/task_docs_search_ui.md` | 🟡 Medium |
| Task 14: LocalMind Annotate | `docs/tasks/phase-6/task14_annotate.md` | 🟡 Medium |
| Task 15: LocalMind Diagrams | `docs/tasks/phase-6/task15_diagrams.md` | 🟡 Medium |

---

## Jules Submit IDs (Proposed)

| ID | Task |
|---|---|
| 91 | Session-1: Core Session Schema & Local Export |
| 93 | Session-3: PDF Report Export |
| 94 | Session-4: Session Import |
| 101 | Docs-1: Docs Workspace Route & Layout |
| 102 | Docs-2: Semantic Search UI |
| 114 | Task 14: LocalMind Annotate |
| 115 | Task 15: LocalMind Diagrams |
| 46 | Task 6: PII Data Sanitizer (DevTools) |
| 34 | Media Task 4: Podcast & Meeting Summarizer |
| 35 | Media Task 5: Study Note Generator |
| 56 | Plugin Task 6: Offline Code Interpreter (Pyodide) |
| 57 | Plugin Task 7: Personal Finance |
| 58 | Plugin Task 8: Medical & Health |
| 513 | Plugin Task 13: Vehicle Telemetry |
