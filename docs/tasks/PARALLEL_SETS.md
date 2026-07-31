# LocalMind Parallel Execution Sets (Strictly Conflict-Free)

> [!CAUTION]
> **MVP FOCUS: ANALYTICS ONLY**
> We are currently focusing 100% on the Analytics Workspace (Data Ingestion, Pivot, Dashboards) and UX Polish for our v1 launch. 
> **DO NOT schedule or execute any tasks related to Docs, DevTools, Media, AI Plugins, or Commercial tiers until v1 is shipped.**
> Only execute tasks from the "Active Sets" section below.

## 🟢 ACTIVE SETS (MVP Phase 1)

> [!TIP]
> **How to parallelize:** The tasks below are grouped into "Waves" so they touch completely disjoint files. You can trigger all tasks within a single Wave simultaneously in different terminal tabs. **Merge all PRs from a Wave before starting the next.**

### Wave 1: The Foundation
*Zero overlap. These touch `+page.svelte`, `PivotBuilder.svelte`, and `+layout.svelte` independently.*
- **[UX]** UX-1: Landing Dashboard & Workspace Routing ✅ *(Completed - PR #59)* (`docs/tasks/cross_cutting/task_ux1_dashboard_routing.md`)
- **[Analytics]** Task 7.1: BI Pivot Builder - ECharts Visualization ✅ *(Completed - PR #57)* (`docs/tasks/phase-1/task7_1_bi_chart_selector.md`)
- **[UX]** UX-2: Command Palette (⌘K) ✅ *(Completed - PR #55)* (`docs/tasks/cross_cutting/task_ux2_command_palette.md`)

### Wave 2: BI Middle & Export
*Safe because UX-3 targets the newly created `/analytics` route from Wave 1, while 7.2 targets `PivotBuilder.svelte`.*
- **[Analytics]** Task 7.2: BI Pivot Builder - True Pivot, Filters & SQL Panel ✅ *(Completed)* (`docs/tasks/phase-1/task7_2_bi_pivot_filters.md`)
- **[UX]** UX-3: Static HTML Report Export ✅ *(Completed)* (`docs/tasks/cross_cutting/task_ux3_report_export.md`)

### Wave 3: BI Table & Templates
*Safe because 7.3 polishes the internal table of `PivotBuilder`, while UX-4 adds templates to the outer `/analytics` layout.*
- **[Analytics]** Task 7.3: BI Pivot Builder - Table Polish (`docs/tasks/phase-1/task7_3_bi_table_polish.md`) ✅
- **[UX]** UX-4: Template Gallery (`docs/tasks/cross_cutting/task_ux4_template_gallery.md`) ✅

### Wave 4: The Great Refactor
*Must run entirely alone. This takes the heavily-modified monolithic `PivotBuilder.svelte` and breaks it apart into a clean component tree.*
- **[Analytics]** Task 7.4: BI Pivot Builder - Component Architecture & Premium UI (`docs/tasks/phase-1/task7_4_bi_component_architecture.md`) ✅

### Wave 5: Validation (End-to-End Tests)
*Must run after all Phase 1 UI and architecture changes are merged. No mocking allowed.*
- **[Testing]** Task 9: End-to-End Testing ✅ *(Completed)* (`docs/tasks/phase-1/task9_e2e.md`)

### Wave 6: Advanced Visualization (Parallel)
*These tasks push the BI Pivot Builder to world-class status. They can be executed concurrently as they touch different parts of the UI stack (chart config vs grid config).*
- **[Analytics]** Task 10: Advanced BI Polish (Treemaps, Heatmaps, Cross-filtering) ✅ *(Completed - PR #69)* (`docs/tasks/phase-1/task10_advanced_bi.md`)
- **[Analytics]** Task 11: High-Performance Data Grid Upgrade ✅ *(Completed - PR #72)* (`docs/tasks/phase-1/task11_data_grid.md`)

### Wave 7: LocalMind OS Macro-Shell
*Must run alone. Refactors `+layout.svelte` to implement the 4-pane unified OS layout and Command Palette.*
- **[UX]** Task 1: Macro-Shell Layout & Command Palette ✅ *(Completed - PR #76)* (`docs/tasks/phase-9/task1_macro_shell.md`)
- **[UX]** Task 2: OPFS File Explorer Sidebar & Top Nav (`docs/tasks/phase-9/task2_explorer.md`)

---

## 🔒 ROBUSTNESS WAVE (Ship With or Right After MVP1 Launch)

> [!IMPORTANT]
> These tasks protect the product's launch quality and user trust. CI/CD and CSP should ideally land **before** the public launch. Error Boundary, Onboarding, and a11y can ship as fast-follow PRs in the first week.

### Robustness Wave A: Infrastructure & Security (Parallel)
*No shared files. CI touches `.github/`. CSP touches `vite.config.ts` and `_headers`. SW versioning touches `vite.config.ts` (different section — if conflict risk, run alone).*
- **[Infra]** CI-1: GitHub Actions CI/CD Pipeline (`docs/tasks/cross_cutting/task_ci_pipeline.md`) ✅
- **[Security]** CI-2: Content Security Policy (`docs/tasks/cross_cutting/task_csp.md`) ✅
- **[Infra]** CI-3: Service Worker Cache Versioning (`docs/tasks/cross_cutting/task_sw_versioning.md`) ✅

### Robustness Wave B: UX Quality (Parallel)
*Error boundary touches `+layout.svelte` and `WorkerManager.ts`. Onboarding touches `/analytics/+page.svelte`. a11y is additive across all routes.*
- **[UX]** CI-4: Worker Error Boundary & Crash Recovery ✅ *(Completed - PR #74)* (`docs/tasks/cross_cutting/task_worker_error_boundary.md`)
- **[UX]** CI-5: First-Run Onboarding & Empty State ✅ *(Completed - PR #73)* (`docs/tasks/cross_cutting/task_onboarding.md`)
- **[UX]** CI-6: Accessibility (a11y) Audit & Remediation (`docs/tasks/cross_cutting/task_a11y_audit.md`)

---

## 🟡 ACTIVE SETS (MVP2 — Sessions + Docs Workspace)

> [!IMPORTANT]
> Start MVP2 only after Wave 5 (E2E tests) is merged and green. Goal: make LocalMind sticky with Sessions and open the Docs workspace to unlock HR/Legal users.

### MVP2 Wave A: Sessions Core + Docs Route (Parallel)
*Zero overlap: Sessions touches OPFS/wa-sqlite. Docs creates a new `/docs` route. No shared files.*
- **[Sessions]** Session-1: Core Session Schema & Local Export (`docs/tasks/cross_cutting/task_session1_core.md`)
- **[Docs]** Docs-1: Docs Workspace Route & Layout (`docs/tasks/phase-2/task_docs_workspace.md`)

### MVP2 Wave B: Sessions Import + Docs Search UI (Parallel)
*Safe: Session import extends SessionManager. Docs search extends `/docs` route only.*
- **[Sessions]** Session-4: Session Import — restore from `.lm` file (`docs/tasks/cross_cutting/task_session4_import.md`)
- **[Docs]** Docs-2: Semantic Search UI in Docs workspace (`docs/tasks/phase-2/task_docs_search_ui.md`)

### MVP2 Wave C: Sessions PDF Export + Docs E2E (Parallel)
*Safe: PDF export is a pure CSS + print strategy. Docs E2E is Playwright-only.*
- **[Sessions]** Session-3: PDF Report Export (`docs/tasks/cross_cutting/task_session3_pdf_export.md`)
- **[Docs]** Docs E2E: End-to-End Testing for Docs Workspace (`docs/tasks/phase-2/task_e2e.md`)

---

## 🟡 ACTIVE SETS (MVP3 — Plugin Ecosystem Completion)

> [!IMPORTANT]
> Start MVP3 after MVP2 Wave A is merged (Sessions core and Docs route must exist for Annotate and Diagrams to link into the workspace launcher).

### MVP3 Wave A: Canvas Plugins + DevTools Completion (Parallel)
*All pure UI — no new WASM workers. Touch completely separate routes.*
- **[Plugin]** Task 14: LocalMind Annotate — Image & Screenshot Annotation (`docs/tasks/phase-6/task14_annotate.md`)
- **[Plugin]** Task 15: LocalMind Diagrams — AI Diagram Generation (`docs/tasks/phase-6/task15_diagrams.md`)
- **[DevTools]** Task 6: PII Data Sanitizer (JSON/CSV) (`docs/tasks/phase-4/task6_pii_sanitizer.md`)

### MVP3 Wave B: Media Plugins (Parallel, no new WorkerManager entries)
*Both use existing Whisper + WebLLM workers. Touch separate routes.*
- **[Media]** Task 4: Podcast & Meeting Summarizer (`docs/tasks/phase-3/task5_summarizer.md`)
- **[Media]** Task 5: Study Note & Flashcard Generator (`docs/tasks/phase-3/task6_study_notes.md`)

### MVP3 Wave C: Offline Code Interpreter (Alone — new WorkerManager entry)
*Must run alone because it adds `getPyodide()` to WorkerManager.ts.*
- **[Plugin]** Task 6: Offline Code Interpreter (Pyodide) (`docs/tasks/phase-6/task6_code_interpreter.md`)

### MVP3 Wave D: Niche Vertical Plugins (Parallel)
*All use existing DuckDB/WebLLM/OCR workers. Touch separate plugin routes.*
- **[Plugin]** Task 7: Personal Finance & Tax Workspace (`docs/tasks/phase-6/task7_finance.md`)
- **[Plugin]** Task 8: Medical & Health Insights (`docs/tasks/phase-6/task8_health.md`)
- **[Plugin]** Task 13: Vehicle Telemetry & CAN Bus Analyzer (`docs/tasks/phase-6/task13_telemetry.md`)

### MVP3 Wave E: Legal & Education Verticals (Parallel)
*All use existing MuPDF/WebLLM/Semantic Search workers.*
- **[Legal]** Task 1: Local Contract Analyzer (`docs/tasks/phase-13/task1_contract_analyzer.md`)
- **[Legal]** Task 2: Deposition Transcript Summarizer (`docs/tasks/phase-13/task2_deposition.md`)
- **[Legal]** Task 3: Legal Case Research Vault (`docs/tasks/phase-13/task3_case_vault.md`)
- **[Education]** Task 1: Academic Paper Summarizer (`docs/tasks/phase-14/task1_paper_summarizer.md`)
- **[Education]** Task 2: Citation & Bibliography Builder (`docs/tasks/phase-14/task2_citation_builder.md`)

---

## ⏸ DEFERRED SETS (Post-v1)
*The sets below are preserved for future use but should not be scheduled for the initial launch.*

After deep analysis of the task specifications, it is clear that **almost every new WASM engine task modifies `WorkerManager.ts`** to add a `getXYZ()` singleton getter. If multiple Jules instances run these tasks in parallel, they will inherently create Git merge conflicts on `WorkerManager.ts`.

To guarantee zero merge conflicts, the following sets are structured so that **no two tasks in the same set modify `WorkerManager.ts`**, and they touch completely separate routes.

> **Note:** Only trigger ONE set at a time. Merge all PRs from the set before proceeding to the next.

---

## Set 1: Analytics Data & OCR Engine
- **[Analytics]** Task 1.1: Data Ingestion and Local File Access (`task2.md`)
  *Safe because it only creates Analytics UI routes and calls existing `getDuckDB()`.*
- **[Docs]** Task 1: Local OCR Integration (`task1_ocr.md`)
  *Safe because it is the ONLY task in this set adding a new worker (`getTesseract()`) to `WorkerManager.ts`.*
- **[DevTools]** Task 1: Offline Data Formatters & Validators (`task1_formatters.md`)
  *Safe because it uses pure functions without workers.*

---

## Set 2: Analytics UI & PDF Engine
- **[Analytics]** Task 1.2: Query Execution and Data Visualization (`task3.md`)
  *Safe: Only touches ECharts and Analytics UI.*
- **[Docs]** Task 2: Local PDF Manipulation (`task2_pdf.md`)
  *Safe: ONLY task in this set modifying `WorkerManager.ts` (`getMuPDF()`).*
- **[DevTools]** Task 5.9: Local Mock API Server (`task5_9_mock_server.md`)
  *Safe: Modifies `/devtools/mock-api` without new workers.*

---

## Set 3: Advanced Charts & AST Engine
- **[Analytics]** Task 5: AI-Assisted Chart Customization (`task5_ai_chart.md`)
  *Safe: Extends LLM worker logic without adding new `WorkerManager` entries.*
- **[DevTools]** Task 2: Code Analysis with tree-sitter (`task2_treesitter.md`)
  *Safe: ONLY task modifying `WorkerManager.ts` (`getTreeSitter()`).*
- **[Docs]** Task 1.5: Browser-Based PII Redaction (`task1_5_redaction.md`)
  *Safe: Canvas-based UI features, uses existing NER/OCR workers.*

---

## Set 4: Media FFmpeg & Dashboard UI
- **[Media]** Task 1: FFmpeg WASM Integration (`task1_ffmpeg.md`)
  *Safe: ONLY task modifying `WorkerManager.ts` (`getFFmpeg()`).*
- **[Analytics]** Task 8: Interactive Dashboard Builder (`task8_dashboards.md`)
  *Safe: Touches Analytics dashboards.*
- **[Docs]** Task 2.5: Markdown to PDF/HTML Export (`task2_5_md_export.md`)
  *Safe: Touches Docs export UI.*

---

## Set 5: Whisper Engine & Data Generators
- **[Media]** Task 2: Whisper WASM Integration (`task2_whisper.md`)
  *Safe: ONLY task modifying `WorkerManager.ts` (`getWhisper()`).*
- **[DevTools]** Task 5.8: Test Data Generator (`task5_8_test_data.md`)
  *Safe: Pure JS data generation UI.*
- **[Analytics]** Task 6: Multi-File Auto-Joins & Visual Data Diffing (`task6_joins_diff.md`)
  *Safe: UI/DuckDB queries only.*

---

## Set 6: OpenCV Engine & Semantic Search
- **[Docs]** Task 1.2: OpenCV Image Enhancement (`task1_2_opencv.md`)
  *Safe: ONLY task modifying `WorkerManager.ts` (`getOpenCV()`).*
- **[Docs]** Task 3: Local Semantic Search (`task3_semantic_search.md`)
  *Safe: Uses existing WebLLM/Vector DB setup.*
- **[Analytics]** Task 7: Tableau-Style BI Pivot Builder (`task7_bi_pivot.md`)
  *Safe: UI/DuckDB queries only.*
- **[Analytics]** Task 7.1: BI Pivot Builder - ECharts Visualization & Chart Type Selector ✅ *(Completed - PR #57)* (`docs/tasks/phase-1/task7_1_bi_chart_selector.md`)
  *Safe: Pure JS/UI (ECharts/Svelte state).*
- **[Analytics]** Task 7.2: BI Pivot Builder - True Pivot, Filters & SQL Panel (`docs/tasks/phase-1/task7_2_bi_pivot_filters.md`)
  *Safe: Pure JS/UI (DuckDB PIVOT syntax, Svelte state).*
- **[Analytics]** Task 7.3: BI Pivot Builder - Table Polish (`docs/tasks/phase-1/task7_3_bi_table_polish.md`)
  *Safe: Pure JS/UI (client-side pagination, totals).*
- **[Analytics]** Task 7.4: BI Pivot Builder - Component Architecture & Premium UI (`docs/tasks/phase-1/task7_4_bi_component_architecture.md`)
  *Safe: Pure JS/UI (Svelte component refactor, CSS animations). Must run AFTER 7.1–7.3.*

---

## Set 7: Analyzers & Transformers
- **[DevTools]** Task 5.5: PCAP Network Analyzer (`task5_5_pcap.md`)
  *Safe: Potential WorkerManager modifier (WASM PCAP parser).*
- **[DevTools]** Task 1.5: Data Format Converters (`task1_5_converters.md`)
  *Safe: Pure JS/UI.*
- **[DevTools]** Task 3: Visual Transformation Pipelines (`task3_pipelines.md`)
  *Safe: UI/Logic only.*

---

## Set 8: Logs, Resumes, and Git
- **[DevTools]** Task 4: Git History Analyzer (`task4_git.md`)
  *Safe: Potential WorkerManager modifier (isomorphic-git/WASM).*
- **[Docs]** Task 3.5: Local AI Resume Screener & Ranker (`task3_5_resume_screener.md`)
  *Safe: Uses existing WebLLM setup.*
- **[DevTools]** Task 5: Visual Log Parser & Anomaly Detector (`task5_log_parser.md`)
  *Safe: Uses existing DuckDB/LLM setup.*

---

## Set 9: Remaining Batch Processing & Core Opt-In
- **[Core]** Task 1.4: AI Off By Default (Opt-in UI) (`docs/tasks/phase-1/task4_1_ai_opt_in.md`)
  *Safe: UI/Logic only for AI capability toggle.*
- **[Docs]** Task 1.8: Bulk Document Parsing (`task1_8_bulk_parse.md`)
  *Safe: Uses existing OCR/PDF workers.*
- **[DevTools]** Task 5.6: HAR File Analyzer (`task5_6_har_analyzer.md`)
  *Safe: Pure JS/UI parsing.*
- **[DevTools]** Task 5.7: Visual Regression Diffing (`task5_7_visual_diff.md`)
  *Safe: Canvas/UI manipulation.*

---

## Set 10: AI Core & Media Plugins *(Completed)*
- **[AI]** Task 1: WebLLM Engine Setup (`docs/tasks/phase-5/task1_webllm.md`) ✅
  *Safe: Dedicated WorkerManager modifier (LLM Engine).*
- **[AI]** Task 2: Local Chat Interface (`docs/tasks/phase-5/task2_chat_ui.md`) ✅
  *Safe: UI/Logic only.*
- **[Media]** Task 3: Instant Video Clipper (`docs/tasks/phase-3/task4_video_clipper.md`) ✅
  *Safe: Uses existing FFmpeg worker.*

---

## Set 11: Niche Workspaces & Data Janitor
- **[Plugins]** Task 1: Geo-Spatial Workspace ✅ *(Completed - PR #51)* (`docs/tasks/phase-6/task1_geospatial.md`)
  *Safe: Pure JS/UI (Leaflet/Turf).*
- **[Plugins]** Task 2: 3D CAD Workspace 🔄 *(Running - Jules ID: 6711618601940893187)* (`docs/tasks/phase-6/task2_cad.md`)
  *Safe: Pure JS/UI (Three.js/OCCT).*
- **[AI]** Task 3: Local AI Data Janitor ✅ *(Completed - PR #52)* (`docs/tasks/phase-5/task3_data_janitor.md`)
  *Safe: Uses existing LLM setup.*

---

## Set 12: Crypto, Whiteboard & End-to-End Tests
- **[Plugins]** Task 2: 3D CAD Workspace ✅ *(Completed)* (`docs/tasks/phase-6/task2_cad.md`)
- **[Plugins]** Task 3: Security / Cryptography Workspace ✅ *(Completed)* (`docs/tasks/phase-6/task3_crypto.md`)
- **[Plugins]** Task 4: Infinite Whiteboard Integration ✅ *(Completed)* (`docs/tasks/phase-8/task1_whiteboard.md`)
- **[Plugins]** Task 5: Language Learning Workspace ✅ *(Completed)* (`docs/tasks/phase-6/task5_language.md`)
  *Safe: Uses existing WebLLM and Whisper workers.*
- **[Testing]** Task 9, 4, 7: E2E Testing for Phase 1, 2, 4 (`docs/tasks/phase-1/task9_e2e.md`, etc.)
  *Safe: Playwright setup only.*

---

## Set 16: UX & Product Polish (Pre-Launch)
> [!IMPORTANT]
> These tasks are **critical for product launch**. They determine whether new users stay or leave. Prioritize before Set 13+ (commercial features).

- **[UX]** UX-1: Landing Dashboard & Workspace Routing ✅ *(Completed - PR #59)* (`docs/tasks/cross_cutting/task_ux1_dashboard_routing.md`)
  *Safe: Routes/UI only. Restructures existing +page.svelte into workspace routes. No WorkerManager changes.*
- **[UX]** UX-2: Command Palette (⌘K) ✅ *(Completed - PR #55)* (`docs/tasks/cross_cutting/task_ux2_command_palette.md`)
  *Safe: Pure UI component. Global keyboard listener in +layout.svelte.*
- **[UX]** UX-3: Static HTML Report Export (`docs/tasks/cross_cutting/task_ux3_report_export.md`)
  *Safe: Pure JS (HTML template generation). No workers.*
- **[UX]** UX-4: Template Gallery (`docs/tasks/cross_cutting/task_ux4_template_gallery.md`)
  *Safe: Pure UI + wa-sqlite storage. No WorkerManager changes.*

> [!NOTE]
> **Execution order:** UX-1 (Dashboard & Routing) must run first — it creates the route structure that UX-2, UX-3, and UX-4 plug into. UX-2/3/4 can run in parallel after UX-1 merges.

---

## Set 13: Desktop App (Pro Tier) & Monetization
> [!CAUTION]
> **GATE: PRIVATE REPOSITORY REQUIRED**
> Do not use Jules to implement these tasks in the public repository. These are proprietary open-core features. They must be developed in a separate, private repository and compiled to WASM plugins or distributed via a private Tauri build.

- **[Desktop]** Task 1: Tauri Desktop App Scaffolding (`docs/tasks/phase-9/task1_tauri_scaffold.md`)
- **[Desktop]** Task 2: Storage Quota Bypass (`docs/tasks/phase-9/task2_unlimited_storage.md`)
- **[Monetization]** Task 1: Cloudflare Proxy API for AI Credits (`docs/tasks/phase-11/task1_cf_proxy.md`)
- **[Monetization]** Task 2: Stripe Billing Integration (`docs/tasks/phase-11/task2_stripe.md`)

---

## Set 14: Enterprise & Security (On-Premise)
> [!CAUTION]
> **GATE: PRIVATE REPOSITORY REQUIRED**
> Do not use Jules to implement these tasks in the public repository. These are proprietary open-core features. They must be developed in a separate, private repository and compiled to WASM plugins or distributed via a private Tauri build.

- **[Enterprise]** Task 1: Headless API & SSO Authentication (SAML/Okta) (`docs/tasks/phase-10/task1_sso.md`)
  *Safe: Auth routes (SAML/OAuth2).*
- **[Enterprise]** Task 2: Team Workspaces & RBAC (`docs/tasks/phase-10/task2_rbac.md`)
  *Safe: Database schema / Middleware.*
- **[Enterprise]** Task 3: Audit Logging & Data Governance Middleware (`docs/tasks/phase-10/task3_audit.md`)
  *Safe: Hooks/Middleware.*
- **[Enterprise]** Task 4: Docker & Kubernetes On-Prem Configs (`docs/tasks/phase-10/task4_docker.md`)
  *Safe: DevOps configs.*
- **[Enterprise]** Task 5: SOC 2 Compliance Documentation (`docs/tasks/phase-10/task5_soc2.md`)
  *Safe: Documentation.*
- **[Desktop]** Task 3 & 4: Native FS and E2E Tests for Phase 9 (`docs/tasks/phase-9/task3_native_fs.md`)
  *Safe: Playwright/Tauri APIs.*

*(Note: Additional sets follow this exact pattern: ONE WorkerManager modifier + multiple independent UI tasks to maintain 100% conflict-free parallelism.)*

---

## Set 15: Advanced Niche Workspaces & Analyzers
- **[Media]** Task 4: Podcast & Meeting Summarizer (`docs/tasks/phase-3/task5_summarizer.md`)
  *Safe: Uses existing Whisper and WebLLM.*
- **[Plugins]** Task 6: Offline Code Interpreter (`docs/tasks/phase-6/task6_code_interpreter.md`)
  *Safe: Potential WorkerManager modifier (Pyodide WASM).*
- **[Plugins]** Task 7: Personal Finance & Tax Workspace (`docs/tasks/phase-6/task7_finance.md`)
  *Safe: Uses existing OCR and DuckDB.*
- **[Plugins]** Task 8: Medical & Health Insights (`docs/tasks/phase-6/task8_health.md`)
  *Safe: Uses existing DuckDB and WebLLM.*
- **[DevTools]** Task 6: PII Data Sanitizer (`docs/tasks/phase-4/task6_pii_sanitizer.md`)
  *Safe: Uses existing WebLLM/DuckDB.*
- **[Media]** Task 5: Study Note & Flashcard Generator (`docs/tasks/phase-3/task6_study_notes.md`)
  *Safe: Uses existing Whisper and WebLLM.*
- **[Plugins]** Task 13: Vehicle Telemetry & CAN Bus Analyzer (`docs/tasks/phase-6/task13_telemetry.md`)
  *Safe: Uses existing DuckDB and WebLLM.*

> [!NOTE]
> Tasks 9–12 (Speech Coach, Kids Learning, Voice Journal, Recipe Vault) have been removed from all parallel sets. See Deferred Appendix.

---

## Set 17: Mobile Ecosystem
- **[Mobile]** Task 1: LocalMind "Lite" Mobile App (`docs/tasks/phase-12/task1_mobile_lite.md`)
  *Safe: Tauri Mobile configuration only. Restricts heavy workers to preserve battery.*

---

## Set 18: Legal Plugins
- **[Legal]** Task 1: Local Contract Analyzer (`docs/tasks/phase-13/task1_contract_analyzer.md`)
  *Safe: Uses existing WebLLM and MuPDF.*
- **[Legal]** Task 2: Deposition Transcript Summarizer (`docs/tasks/phase-13/task2_deposition.md`)
  *Safe: Uses existing WebLLM.*
- **[Legal]** Task 3: Legal Case Research Vault (`docs/tasks/phase-13/task3_case_vault.md`)
  *Safe: Uses existing Semantic Search and DuckDB.*

---

## Set 19: Education & Research Plugins
- **[Education]** Task 1: Academic Paper Summarizer (`docs/tasks/phase-14/task1_paper_summarizer.md`)
  *Safe: Uses existing WebLLM and MuPDF.*
- **[Education]** Task 2: Citation & Bibliography Builder (`docs/tasks/phase-14/task2_citation_builder.md`)
  *Safe: Pure JS/UI with WebLLM.*
- **[Education]** Task 3: Offline Plagiarism Checker (`docs/tasks/phase-14/task3_plagiarism_checker.md`)
  *Safe: Uses existing DuckDB and Semantic Search.*

---

## Set 20: Construction, Cybersecurity & Creatives
- **[Construction]** Task 1: Blueprint & Technical Drawing OCR (`docs/tasks/phase-15/task1_blueprint_ocr.md`)
  *Safe: Uses existing Tesseract OCR.*
- **[Cybersecurity]** Task 1: Offline Threat Intelligence Parser (`docs/tasks/phase-16/task1_threat_intel.md`)
  *Safe: Uses existing DuckDB and WebLLM.*
- **[Creative]** Task 1: Offline Screenwriting Assistant (`docs/tasks/phase-17/task1_screenwriting.md`)
  *Safe: Pure JS/UI with WebLLM.*

---

## Set 21: Finance, Insurance & Remaining Niche Tasks
- **[Finance]** Task 1: Insurance Policy Simplifier (`docs/tasks/phase-18/task1_insurance.md`)
  *Safe: Uses existing MuPDF and WebLLM.*
- **[Finance]** Task 2: Offline Stock Backtester (`docs/tasks/phase-18/task2_backtester.md`)
  *Safe: Uses existing DuckDB.*
- **[Cybersecurity]** Task 2: Offline Secrets & API Key Auditor (`docs/tasks/phase-16/task2_secrets_auditor.md`)
  *Safe: Uses existing tree-sitter.*
- **[Construction]** Task 2: Safety Incident Log Analyzer (`docs/tasks/phase-15/task2_incident_log.md`)
  *Safe: Uses existing DuckDB and WebLLM.*
- **[Creative]** Task 2: Brand Style Guide Analyzer (`docs/tasks/phase-17/task2_brand_analyzer.md`)
  *Safe: Uses existing OCR and DuckDB.*

---

## Set 22: Real Estate & HOA
- **[Real Estate]** Task 1: HOA CC&R Analyzer & Auditor (`docs/tasks/phase-19/task1_hoa_analyzer.md`)
  *Safe: Uses existing MuPDF, WebLLM, and DuckDB.*

---

## ⏸ Deferred Appendix — Revisit Post-MVP

> [!NOTE]
> Valid LocalMind use case but deprioritized. Only schedule after core five-pillar workspaces are complete.

| Task | Reason |
|---|---|
| Task 9: AI Speech & Articulation Coach | Strong offline privacy angle; Whisper already in stack; professional self-coaching use case |

---

## ⛔ Deleted — Out of Scope

> [!CAUTION]
> These tasks have been **permanently removed** from the LocalMind roadmap. Wrong audience, no architectural fit, no meaningful reuse of the LocalMind stack. Do not re-add to any set.
> If ever pursued, they must be entirely separate standalone products.

| Task | Reason |
|---|---|
| Task 10: Kids Learning & Reading Buddy | Wrong audience; requires gamification & parental controls — different product discipline |
| Task 11: Offline Voice Journal | Consumer journaling app; no data-processing value |
| Task 12: Local Recipe Vault & Grocery Planner | Off-mission; wrong persona; no architectural fit |
