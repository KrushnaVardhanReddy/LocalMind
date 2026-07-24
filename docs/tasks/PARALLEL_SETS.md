# LocalMind Parallel Execution Sets (Strictly Conflict-Free)

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
- **[Plugins]** Task 1: Geo-Spatial Workspace 🔄 *(Running - Jules ID: 13997218633702669379)* (`docs/tasks/phase-6/task1_geospatial.md`)
  *Safe: Pure JS/UI (Leaflet/Turf).*
- **[Plugins]** Task 2: 3D CAD Workspace 🔄 *(Running - Jules ID: 6711618601940893187)* (`docs/tasks/phase-6/task2_cad.md`)
  *Safe: Pure JS/UI (Three.js/OCCT).*
- **[AI]** Task 3: Local AI Data Janitor 🔄 *(Running - Jules ID: 1432054905658099484)* (`docs/tasks/phase-5/task3_data_janitor.md`)
  *Safe: Uses existing LLM setup.*

---

## Set 12: Crypto, Whiteboard & End-to-End Tests
- **[Plugins]** Task 3: Security / Cryptography Workspace (`docs/tasks/phase-6/task3_crypto.md`)
  *Safe: Potential WorkerManager modifier (Crypto WASM).*
- **[Plugins]** Task 4: Infinite Whiteboard Integration (`docs/tasks/phase-8/task1_whiteboard.md`)
  *Safe: Pure JS/UI (Tldraw).*
- **[Plugins]** Task 5: Language Learning Workspace (`docs/tasks/phase-6/task5_language.md`)
  *Safe: Uses existing WebLLM and Whisper workers.*
- **[Testing]** Task 9, 4, 7: E2E Testing for Phase 1, 2, 4 (`docs/tasks/phase-1/task9_e2e.md`, etc.)
  *Safe: Playwright setup only.*

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
- **[Plugins]** Task 9: AI Speech & Articulation Coach (`docs/tasks/phase-6/task9_speech_coach.md`)
  *Safe: Uses existing Whisper and WebLLM.*
- **[Plugins]** Task 10: Kids Learning & Reading Buddy (`docs/tasks/phase-6/task10_kids_learning.md`)
  *Safe: Uses existing Whisper and WebLLM.*
- **[DevTools]** Task 6: PII Data Sanitizer (`docs/tasks/phase-4/task6_pii_sanitizer.md`)
  *Safe: Uses existing WebLLM/DuckDB.*
- **[Media]** Task 5: Study Note & Flashcard Generator (`docs/tasks/phase-3/task6_study_notes.md`)
  *Safe: Uses existing Whisper and WebLLM.*
- **[Plugins]** Task 11: Offline Voice Journal (`docs/tasks/phase-6/task11_voice_journal.md`)
  *Safe: Uses existing Whisper and WebLLM.*
- **[Plugins]** Task 12: Local Recipe Vault & Grocery Planner (`docs/tasks/phase-6/task12_recipe_vault.md`)
  *Safe: Uses existing OCR, DuckDB, WebLLM.*
