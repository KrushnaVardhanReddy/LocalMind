# LocalMind Architecture Tracker

> **Last updated:** 2026-07-29 · Product Focus Review — Consumer lifestyle features deferred

## 1. LocalMind Core (The Platform Engine)
*The foundational OS layer that all vertical apps plug into.*
- [x] Task 1: Core Scaffolding & WorkerPool Abstraction ✅ *(Completed - Jules ID: 14075293772290182711)*
- [x] Task 2: wa-sqlite Workspace Persistence ✅ *(Completed - PR #12)* (`docs/tasks/cross_cutting/task_wa_sqlite.md`)
- [x] Task 3: Production COOP/COEP Headers ✅ *(Completed - PR #11)* (`docs/tasks/cross_cutting/task_production_headers.md`)
- [x] Task 4: PWA & Offline Support ✅ *(Completed - PR #14)* (`docs/tasks/cross_cutting/task_pwa.md`)
- [x] Task 5: Custom WASM Plugin Runtime ✅ *(Completed - PR #15)* (`docs/tasks/phase-7/task1_plugin_runtime.md`)

### UX & Product Polish (Cross-Cutting)
*Critical for first impression, onboarding, and retention.*
- [x] UX-1: Landing Dashboard & Workspace Routing ✅ *(Completed - PR #59)* (`docs/tasks/cross_cutting/task_ux1_dashboard_routing.md`)
- [x] UX-2: Command Palette (⌘K) ✅ *(Completed - PR #55)* (`docs/tasks/cross_cutting/task_ux2_command_palette.md`)
- [x] UX-3: Static HTML Report Export ✅ *(Completed - PR #60)* (`docs/tasks/cross_cutting/task_ux3_report_export.md`)
- [x] UX-4: Template Gallery ✅ *(Completed - PR #63)* (`docs/tasks/cross_cutting/task_ux4_template_gallery.md`)

### Platform Robustness (Cross-Cutting)
*Non-functional requirements that determine production quality and user trust.*
- [x] CI-1: GitHub Actions CI/CD Pipeline ✅ *(Completed - PR #67)* (`docs/tasks/cross_cutting/task_ci_pipeline.md`)
- [x] CI-2: Content Security Policy (CSP) ✅ *(Completed - PR #65)* (`docs/tasks/cross_cutting/task_csp.md`)
- [x] CI-3: Service Worker Cache Versioning & WASM Update Strategy ✅ *(Completed - PR #66)* (`docs/tasks/cross_cutting/task_sw_versioning.md`)
- [x] CI-4: Worker Error Boundary & Crash Recovery ✅ *(Completed - PR #74)* (`docs/tasks/cross_cutting/task_worker_error_boundary.md`)
- [x] CI-5: First-Run Onboarding & Empty State ✅ *(Completed - PR #73)* (`docs/tasks/cross_cutting/task_onboarding.md`)
- [x] CI-6: Accessibility (a11y) Audit & Remediation ✅ *(Completed - PR #83)* (`docs/tasks/cross_cutting/task_a11y_audit.md`)

### Sessions (Workspace Snapshots) 📋
*A portable `.lm` workspace file that captures queries, charts, AI conversations, notes, and files in a single shareable artifact. Core differentiator.*
- [x] Session-1: Core Session Schema & Local Export ✅ *(Completed - PR #82)* (`docs/tasks/cross_cutting/task_session1_core.md`)
- [ ] Session-2: Static HTML Report Export (self-contained, no LocalMind required) (`docs/tasks/cross_cutting/task_ux3_report_export.md`)
- [x] Session-3: PDF Report Export (full workspace snapshot) ✅ *(Completed - PR #86)* (`docs/tasks/cross_cutting/task_session3_pdf_export.md`)
- [x] Session-4: Session Import — restore workspace from `.lm` file ✅ *(Completed - PR #85)* (`docs/tasks/cross_cutting/task_session4_import.md`)
- [ ] Session-5: *(Future / Pro)* Read-only share link via Cloudflare R2 (`docs/tasks/cross_cutting/task_session5_share_link.md`)

---

## 2. Core Product MVP (The Focus)
*The primary value proposition: A privacy-first local AI workspace.*

### Version 1: LocalMind Analytics 🔨 (Sole Focus for Initial Launch)
*Data Ingestion, SQL, Pivot, & Visualization*
- [x] Task 1.1: Data Ingestion and Local File Access (v2 Streams API) ✅ *(Completed - PR #16)*
- [x] Task 1.2: Query Execution and Data Visualization (v2) ✅ *(Completed - PR #21)*
- [x] Task 1.3: Consent-Gated AI Insights ✅ *(Completed - PR #13)* (`docs/tasks/phase-1/task4.md`)
- [x] Task 1.4: AI Off By Default (Opt-in UI) ✅ *(Completed)* (`docs/tasks/phase-1/task4_1_ai_opt_in.md`)
- [x] Task 5: AI-Assisted Chart Customization ✅ *(Completed - PR #23)* (`docs/tasks/phase-1/task5_ai_chart.md`)
- [x] Task 6: Multi-File Auto-Joins & Visual Data Diffing ✅ *(Completed - PR #28)* (`docs/tasks/phase-1/task6_joins_diff.md`)
- [x] Task 7: Tableau-Style BI Pivot Builder ✅ *(Completed - PR #31)* (`docs/tasks/phase-1/task7_bi_pivot.md`)
- [x] Task 7.1: BI Pivot Builder - ECharts Visualization & Chart Type Selector ✅ *(Completed - PR #57)* (`docs/tasks/phase-1/task7_1_bi_chart_selector.md`)
- [x] Task 7.2: BI Pivot Builder - True Pivot, Filters & SQL Panel ✅ *(Completed - PR #61)* (`docs/tasks/phase-1/task7_2_bi_pivot_filters.md`)
- [x] Task 7.3: BI Pivot Builder - Table Polish (Totals, Pagination, Empty State) ✅ *(Completed - PR #62)* (`docs/tasks/phase-1/task7_3_bi_table_polish.md`)
- [x] Task 7.4: BI Pivot Builder - Component Architecture & Premium UI ✅ *(Completed - PR #64)* (`docs/tasks/phase-1/task7_4_bi_component_architecture.md`)
- [x] Task 8: Interactive Dashboard Builder ✅ *(Completed)* (`docs/tasks/phase-1/task8_dashboards.md`)
- [x] Task 9: End-to-End Testing (Phase 1 Full Surface) ✅ *(Completed)* (`docs/tasks/phase-1/task9_e2e.md`)
- [x] Task 10: Advanced BI Polish (Treemaps, Heatmaps, Cross-filtering) ✅ *(Completed - PR #69)* (`docs/tasks/phase-1/task10_advanced_bi.md`)
- [x] Task 11: High-Performance Data Grid Upgrade ✅ *(Completed - PR #72)* (`docs/tasks/phase-1/task11_data_grid.md`)
- [x] Task 13: Network & Graph Visualizer ✅ *(Completed - PR #89)* (`docs/tasks/phase-1/task13_network_graph.md`)
- [x] Task 14: Offline HTML Table Extractor ✅ *(Completed - PR #88)* (`docs/tasks/phase-1/task14_html_extractor.md`)
- [x] Task 16: Advanced Chart Inspector (UI + JSON Overrides) ✅ *(Completed)* (`docs/tasks/phase-1/task16_chart_inspector.md`)
- [x] Task 17: Analytics E2E V2 (Coverage for Tasks 10-16) ✅ *(Completed)* (`docs/tasks/phase-1/task17_analytics_e2e_v2.md`)

---

## 3. Deferred to Post-v1 (Focusing on Analytics MVP First)
*To ensure a high-quality initial launch, all non-Analytics workspaces and plugins have been deferred. We are focusing 100% on making the data processing and visualization experience exceptional.*

### Version 2: LocalMind Docs 🔨
*Local Document Processing*
- [x] Task 1: Local OCR Integration ✅ *(Completed - PR #18)* (`docs/tasks/phase-2/task1_ocr.md`)
- [x] Task 1.2: OpenCV Image Enhancement ✅ *(Completed - PR #33)* (`docs/tasks/phase-2/task1_2_opencv.md`)
- [x] Task 1.5: Browser-Based PII Redaction ✅ *(Completed)* (`docs/tasks/phase-2/task1_5_redaction.md`)
- [x] Task 1.8: Bulk Document Parsing ✅ *(Completed)* (`docs/tasks/phase-2/task1_8_bulk_parse.md`)
- [x] Task 2: Local PDF Manipulation ✅ *(Completed - PR #20)* (`docs/tasks/phase-2/task2_pdf.md`)
- [x] Task 2.5: Markdown to PDF/HTML Export ✅ *(Completed)* (`docs/tasks/phase-2/task2_5_md_export.md`)
- [x] Task 3: Local Semantic Search ✅ *(Completed - PR #32)* (`docs/tasks/phase-2/task3_semantic_search.md`)
- [x] Docs-2: Semantic Search UI in Docs workspace ✅ *(Completed - PR #84)* (`docs/tasks/phase-2/task_docs_search_ui.md`)
- [x] Task 3.5: Local AI Resume Screener & Ranker ✅ *(Completed)* (`docs/tasks/phase-2/task3_5_resume_screener.md`)
- [ ] Task 7: Offline Chat-with-Docs (Local RAG) ➡️ *(Superseded by Universal Document Q&A Workspace)* (`docs/tasks/phase-2/task7_local_rag.md`)
- [ ] Task 8: Document Comparison (Redline Diffing) (`docs/tasks/phase-2/task8_doc_diff.md`)
  *Genuine standalone — lawyer-grade redline diffing between two doc versions has no equivalent in the generic Q&A tool.*
- [x] Task 4: End-to-End Testing ✅ *(Completed - PR #87)* (`docs/tasks/phase-2/task_e2e.md`)
- [ ] Task 5: Mermaid.js Diagram Integration (`docs/tasks/phase-2/task5_mermaid.md`)
- [ ] Task 6: Excalidraw Local Whiteboard (`docs/tasks/phase-2/task6_excalidraw.md`)

### Version 3: LocalMind DevTools
*Offline Utilities for Developers*
- [x] Task 1: Offline Data Formatters & Validators (JSON, JWT, Base64) ✅ *(Completed - PR #17)* (`docs/tasks/phase-4/task1_formatters.md`)
- [x] Task 1.5: Data Format Converters (JSON <-> YAML <-> XML) ✅ *(Completed)* (`docs/tasks/phase-4/task1_5_converters.md`)
- [x] Task 2: Code Analysis with tree-sitter ✅ *(Completed)* (`docs/tasks/phase-4/task2_treesitter.md`)
- [x] Task 3: Visual Transformation Pipelines ✅ *(Completed)* (`docs/tasks/phase-4/task3_pipelines.md`)
- [x] Task 4: Git History Analyzer ✅ *(Completed)* (`docs/tasks/phase-4/task4_git.md`)
- [x] Task 5: Visual Log Parser & Anomaly Detector ✅ *(Completed)* (`docs/tasks/phase-4/task5_log_parser.md`)
- [x] Task 5.5: PCAP Network Analyzer ✅ *(Completed)* (`docs/tasks/phase-4/task5_5_pcap.md`)
- [x] Task 5.6: HAR File Analyzer ✅ *(Completed)* (`docs/tasks/phase-4/task5_6_har_analyzer.md`)
- [x] Task 5.7: Visual Regression Diffing ✅ *(Completed)* (`docs/tasks/phase-4/task5_7_visual_diff.md`)
- [x] Task 5.8: Test Data Generator ✅ *(Completed - PR #29)* (`docs/tasks/phase-4/task5_8_test_data.md`)
- [x] Task 5.9: Local Mock API Server ✅ *(Completed - PR #19)* (`docs/tasks/phase-4/task5_9_mock_server.md`)
- [x] Task 6: PII Data Sanitizer (JSON/CSV) ✅ *(Completed - PR #91)* (`docs/tasks/phase-4/task6_pii_sanitizer.md`)
- [ ] Task 10: Offline API Client (Postman Alternative) (`docs/tasks/phase-4/task10_api_client.md`)
- [ ] Task 11: Offline Regex Tester & Debugger (`docs/tasks/phase-4/task11_regex_tester.md`)
- [ ] Task 12: JSONPath & `jq` Query Sandbox (`docs/tasks/phase-4/task12_jq_sandbox.md`)
- [ ] Task 7: End-to-End Testing (`docs/tasks/phase-4/task_e2e.md`)

---

### Future Plugin Ecosystem
*Specialized apps to be built as external plugins rather than core features. This prevents scope creep and keeps the core product focused.*

### LocalMind Intelligence (Core AI API)
- [x] Task 1: WebLLM Engine Setup ✅ *(Completed - PR #47)* (`docs/tasks/phase-5/task1_webllm.md`)
- [x] Task 2: Local Chat Interface ✅ *(Completed - PR #48)* (`docs/tasks/phase-5/task2_chat_ui.md`)
- [x] Task 3: Local AI Data Janitor ✅ *(Completed - PR #52)* (`docs/tasks/phase-5/task3_data_janitor.md`)
- [ ] Task 4: Local Vision Chat (Multimodal) (`docs/tasks/phase-5/task4_vision_chat.md`)

### Media Plugins
- [x] Task 1: FFmpeg WASM Integration ✅ *(Completed)* (`docs/tasks/phase-3/task1_ffmpeg.md`)
- [x] Task 2: Whisper WASM Integration ✅ *(Completed - PR #30)* (`docs/tasks/phase-3/task2_whisper.md`)
- [x] Task 3: Instant Video Clipper ✅ *(Completed - PR #49)* (`docs/tasks/phase-3/task4_video_clipper.md`)
- [x] Task 4: Podcast & Meeting Summarizer ✅ *(Completed - PR #95)* (`docs/tasks/phase-3/task5_summarizer.md`)
- [x] Task 5: Study Note & Flashcard Generator ✅ *(Completed - PR #94)* (`docs/tasks/phase-3/task6_study_notes.md`)
- [ ] Task 7: AI Background Removal (Image & Video) (`docs/tasks/phase-3/task7_background_removal.md`)
- [ ] Task 8: Subtitle & SRT Editor (`docs/tasks/phase-3/task8_subtitle_editor.md`)

### Specialized Niche Plugins
- [x] Task 1: Geo-Spatial Workspace ✅ *(Completed - PR #51)* (`docs/tasks/phase-6/task1_geospatial.md`)
- [x] Task 2: 3D CAD Workspace ✅ *(Completed)* (`docs/tasks/phase-6/task2_cad.md`)
- [x] Task 3: Security / Cryptography Workspace ✅ *(Completed)* (`docs/tasks/phase-6/task3_crypto.md`)
- [x] Task 4: Infinite Whiteboard Integration ✅ *(Completed)* (`docs/tasks/phase-8/task1_whiteboard.md`)
- [x] Task 5: Language Learning Workspace ✅ *(Completed)* (`docs/tasks/phase-6/task5_language.md`)
- [x] Task 6: Offline Code Interpreter (Pyodide) ✅ *(Completed - PR #96)* (`docs/tasks/phase-6/task6_code_interpreter.md`)
- [x] Task 7: Personal Finance & Tax Workspace ✅ *(Completed - PR #97)* (`docs/tasks/phase-6/task7_finance.md`)
- [x] Task 14: LocalMind Annotate — Image & Screenshot Annotation Workspace ✅ *(Completed - PR #93)* (`docs/tasks/phase-6/task14_annotate.md`)
  *Canvas-based Paint-style workspace. Freehand draw, shapes, text, arrows, highlights, image crop, AI auto-label. Export PNG/SVG/PDF. No new WASM workers needed (canvas + magick-wasm).*
- [x] Task 15: LocalMind Diagrams — AI Diagram Generation Workspace ✅ *(Completed - PR #92)* (`docs/tasks/phase-6/task15_diagrams.md`)
  *Generate UML/ER/architecture diagrams from code (tree-sitter), SQL schemas (DuckDB), OpenAPI specs, or plain English. Render via Mermaid.js / D3. Export PNG/SVG/PDF. Uses existing worker stack.*
- [ ] Task 16: Advanced Scientific & Network Visualizations (`docs/tasks/phase-6/task16_advanced_vis.md`)
  *Dedicated workspace for complex data relationships. Network graphs (Cytoscape.js), custom hierarchies (D3.js), interactive data exploration (Observable Plot), and scientific charting (Plotly.js).*

> [!NOTE]
> **Tasks 9–12 below have been deferred.** See Section 5 for rationale.
- [ ] Task 9: Full PII Redaction Implementation (`docs/tasks/phase-1/task9_pii.md`)
- [ ] Task 12: Offline Document Analysis (`docs/tasks/phase-1/task12_docs.md`)

---

### Phase 9: LocalMind OS (The Macro-Shell) 🖥️
*A unified modern AI workspace shell integrating the Explorer, Command Palette, and Context Panels.*
- [x] Task 1: Macro-Shell Layout & Global Store ✅ *(Completed - PR #76)* (`docs/tasks/phase-9/task1_macro_shell.md`)
- [x] Task 2: OPFS File Explorer Sidebar & Top Nav ✅ *(Completed - PR #78)* (`docs/tasks/phase-9/task2_explorer.md`)
- [x] Task 3: Command Palette Integration ✅ *(Completed - PR #76)* (`docs/tasks/phase-9/task3_command_palette.md`)
- [x] Task 4: Dynamic Right Inspector Panel ✅ *(Completed - PR #79)* (`docs/tasks/phase-9/task4_inspector.md`)
- [x] Task 5: Workspace Migration ✅ *(Completed - PR #80)* (`docs/tasks/phase-9/task5_migration.md`)

---

### Universal Document Plugins (Consolidated MVP Features)
*Replacing all specific niche document and research plugins (Legal, Education, Construction, Real Estate, etc.) with powerful generic workspaces.*
- [ ] Task 1: Universal Document Q&A Workspace 🔄 *(Running - Jules ID: 18178515751619385141)* (`docs/tasks/phase-13/task1_universal_doc_qa.md`)
  *Upload any PDF (Contracts, Lab Reports, Blueprints, Papers) and use WebLLM to extract, summarize, or query.*
- [ ] Task 2: Local Directory Semantic Search 🔄 *(Running - Jules ID: 16193627081754385087)* (`docs/tasks/phase-13/task2_directory_search.md`)
  *Embed folders of PDFs/Docs to search case law, technical specs, or personal archives offline using DuckDB VSS.*

---


---

## 6. Deleted — Out of Scope

> [!CAUTION]
> These features target consumer lifestyle use cases with no meaningful fit to LocalMind's platform mission. They require different product disciplines, different audiences, and provide no architectural reuse. **Do not schedule or implement these as LocalMind features.**
> If ever pursued, they must be entirely separate products.

| Feature | Reason for Deletion |
|---|---|
| Medical & Health Insights | High liability (AI medical advice); duplicated by general Q&A |
| Vehicle Telemetry Analyzer | Extreme niche; duplicated by DuckDB Analytics |
| Citation & Bibliography Builder | Trivial for standard chat UI; redundant UI bloat |
| Niche Document Analyzers (Legal/Edu) | Consolidated into Universal Document Q&A |
| AI Speech & Articulation Coach | Consumer wellness tool; no data-processing value; standalone product territory |
| Docs Task 7: Chat-with-Docs RAG | Superseded by the Universal Document Q&A Workspace plugin |
| Task 10: Kids Learning & Reading Buddy | Wrong audience; requires gamification, parental controls |
| Task 11: Offline Voice Journal | Consumer journaling app; no data-processing value |
| Task 12: Local Recipe Vault & Grocery Planner | Off-mission; wrong persona |

---

## 4. Commercial Tiers

> [!CAUTION]
> **GATE: PRIVATE REPOSITORY REQUIRED**
> Do not implement any tasks in Section 4 in the public open-source repository. All Pro, Enterprise, and Monetization features must be implemented in a separate private repository and shipped either via WASM Plugins or a proprietary Desktop build.

### Pro Tier (Tauri Desktop App)
- [ ] Task 1: Tauri Desktop App Scaffolding (`docs/tasks/phase-9/task1_tauri_scaffold.md`)
- [ ] Task 2: Storage Quota Bypass (`docs/tasks/phase-9/task2_unlimited_storage.md`)
- [ ] Task 3: Native File System Integration (`docs/tasks/phase-9/task3_native_fs.md`)
- [ ] Task 4: End-to-End Testing (`docs/tasks/phase-9/task_e2e.md`)

### Enterprise Tier (On-Premise & Governance)
- [ ] Task 1: Headless API & SSO Authentication (SAML/Okta) (`docs/tasks/phase-10/task1_sso.md`)
- [ ] Task 2: Team Workspaces & RBAC (`docs/tasks/phase-10/task2_rbac.md`)
- [ ] Task 3: Audit Logging & Data Governance Middleware (`docs/tasks/phase-10/task3_audit.md`)
- [ ] Task 4: Docker & Kubernetes On-Prem Configs (`docs/tasks/phase-10/task4_docker.md`)
- [ ] Task 5: SOC 2 Compliance Documentation (`docs/tasks/phase-10/task5_soc2.md`)
- [ ] Task 6: **Real-Time Streaming Analytics** (`docs/tasks/phase-10/task6_streaming.md`)
  - WebSockets / Server-Sent Events integration for live data.
  - High-speed grid rendering via Perspective (for DevOps/Finance verticals).

### Phase 11: Monetization Strategy & Sync Infrastructure
*Leveraging the local-first architecture to drive revenue via E2EE sync, API proxies, and team licensing.*
- [ ] Task 1: **LocalMind Sync (E2EE)** (`docs/tasks/phase-11/task1_localmind_sync.md`)
  - End-to-end encrypted `.lm` file syncing across devices.
  - Zero-knowledge architecture (LocalMind servers cannot decrypt user data).
- [ ] Task 2: **LocalMind Pro (Cloudflare Proxy)** (`docs/tasks/phase-11/task2_cf_proxy.md`)
  - Proxy API for accessing heavy cloud LLMs (GPT-4o/Claude) via a flat monthly subscription.
  - Unlimited workspace limits and white-labeled PDF export.
- [ ] Task 3: **Plugin & Model Marketplace** (`docs/tasks/phase-11/task3_marketplace.md`)
  - In-app store for developers to sell custom chart types, parsers, or fine-tuned local LLMs.
- [ ] Task 4: **Stripe Billing Integration** (`docs/tasks/phase-11/task4_stripe.md`)
  - Subscription management and marketplace payouts.

### Phase 13: Mobile Ecosystem (Capacitor Mobile)
- [x] Task 1: LocalMind "Lite" Mobile iOS/Android App ✅ *(Completed - UI Refactored, Capacitor scaffold delegated to Jules)* (`docs/tasks/phase-12/task1_mobile_lite.md`)
