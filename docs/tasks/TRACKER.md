# LocalMind Task Tracker

> **Last updated:** 2026-07-19 · Phase 1 v2 Rewrite in progress

## Cross-Cutting (Do Before Phase 2)
- [ ] WorkerPool Abstraction Layer (`docs/tasks/cross_cutting/task_worker_pool.md`)
- [ ] wa-sqlite Workspace Persistence (`docs/tasks/cross_cutting/task_wa_sqlite.md`)
- [ ] Production COOP/COEP Headers (`docs/tasks/cross_cutting/task_production_headers.md`)
- [ ] PWA & Offline Support (`docs/tasks/cross_cutting/task_pwa.md`)

## Phase 1: Data Ingestion & Analytics (v2 Architecture Rewrite) 🔨
- [ ] Task 1: Scaffolding and Web Worker Integration (v2) 🔄 *(In Progress - Jules ID: 14075293772290182711)*
- [ ] Task 2: Data Ingestion and Local File Access (v2 Streams API)
- [ ] Task 3: Query Execution and Data Visualization (v2)
- [ ] Task 4: Consent-Gated AI Insights (v2)
- [ ] Task 5: End-to-End Testing (Phase 1)
- [ ] Task 6: AI-Assisted Chart Customization (`docs/tasks/phase-1/task6_ai_chart.md`)
- [ ] Task 7: Multi-File Auto-Joins & Visual Data Diffing (`docs/tasks/phase-1/task7_joins_diff.md`)
- [ ] Task 8: Interactive Dashboard Builder (`docs/tasks/phase-1/task8_dashboards.md`)
- [ ] Task 9: Tableau-Style BI Pivot Builder (`docs/tasks/phase-1/task9_bi_pivot.md`)


## Phase 2: Document Workspace 🔨
- [x] Task 1: Local OCR Integration (`docs/tasks/phase-2/task1_ocr.md`)
- [ ] Task 1.2: OpenCV Image Enhancement (`docs/tasks/phase-2/task1_2_opencv.md`)
- [ ] Task 1.5: Browser-Based PII Redaction (`docs/tasks/phase-2/task1_5_redaction.md`)
- [ ] Task 1.8: Bulk Document Parsing (`docs/tasks/phase-2/task1_8_bulk_parse.md`)
- [ ] Task 2: Local PDF Manipulation (`docs/tasks/phase-2/task2_pdf.md`)
- [ ] Task 3: Local Semantic Search (`docs/tasks/phase-2/task3_semantic_search.md`)
- [ ] Task 3.5: Local AI Resume Screener & Ranker (`docs/tasks/phase-2/task3_5_resume_screener.md`)
- [ ] Task 4: End-to-End Testing (`docs/tasks/phase-2/task_e2e.md`)

## Phase 3: Media Workspace
- [ ] Task 1: FFmpeg WASM Integration (`docs/tasks/phase-3/task1_ffmpeg.md`)
- [ ] Task 2: Whisper WASM Integration (`docs/tasks/phase-3/task2_whisper.md`)
- [ ] Task 3: Image Processing Integration (`docs/tasks/phase-3/task3_images.md`)
- [ ] Task 4: Instant Video Clipper (`docs/tasks/phase-3/task4_video_clipper.md`)
- [ ] Task 4.5: Audio Stem Separation (`docs/tasks/phase-3/task4_5_audio_stems.md`)
- [ ] Task 5: End-to-End Testing (`docs/tasks/phase-3/task_e2e.md`)

## Phase 4: Developer & QA Workspace
- [ ] Task 1: Formatting and Validation Tools (`docs/tasks/phase-4/task1_formatters.md`)
- [ ] Task 2: Code Analysis with tree-sitter (`docs/tasks/phase-4/task2_treesitter.md`)
- [ ] Task 3: Visual Transformation Pipelines (`docs/tasks/phase-4/task3_pipelines.md`)
- [ ] Task 4: Git History Analyzer (`docs/tasks/phase-4/task4_git.md`)
- [ ] Task 5: Visual Log Parser & Anomaly Detector (`docs/tasks/phase-4/task5_log_parser.md`)
- [ ] Task 5.5: PCAP Network Analyzer (`docs/tasks/phase-4/task5_5_pcap.md`)
- [ ] Task 5.6: HAR File Analyzer (`docs/tasks/phase-4/task5_6_har_analyzer.md`)
- [ ] Task 5.7: Visual Regression Diffing (`docs/tasks/phase-4/task5_7_visual_diff.md`)
- [ ] Task 5.8: Test Data Generator (`docs/tasks/phase-4/task5_8_test_data.md`)
- [ ] Task 5.9: Local Mock API Server (`docs/tasks/phase-4/task5_9_mock_server.md`)
- [ ] Task 7: End-to-End Testing (`docs/tasks/phase-4/task_e2e.md`)

## Phase 5: Intelligence Workspace
- [ ] Task 1: WebLLM Engine Setup (`docs/tasks/phase-5/task1_webllm.md`)
- [ ] Task 2: Local Chat Interface (`docs/tasks/phase-5/task2_chat_ui.md`)
- [ ] Task 3: Local AI Data Janitor (`docs/tasks/phase-5/task3_data_janitor.md`)
- [ ] Task 4: UMAP Embedding Visualization (`docs/tasks/phase-5/task4_umap.md`)
- [ ] Task 5: YouTube Local Summary (`docs/tasks/phase-5/task5_youtube.md`)
- [ ] Task 6: End-to-End Testing (`docs/tasks/phase-5/task_e2e.md`)

## Phase 6: Specialized Workspaces
- [ ] Task 1: Geo-Spatial Workspace (`docs/tasks/phase-6/task1_geospatial.md`)
- [ ] Task 2: 3D CAD Workspace (`docs/tasks/phase-6/task2_cad.md`)
- [ ] Task 3: Security / Cryptography Workspace (`docs/tasks/phase-6/task3_crypto.md`)
- [ ] Task 4: 3D Printer G-Code Viewer (`docs/tasks/phase-6/task4_3d_printing.md`)

## Phase 7: Custom WASM Plugin Runtime
- [ ] Task 1: WASM Plugin Runtime (`docs/tasks/phase-7/task1_plugin_runtime.md`)

## Phase 8: Canvas Workspace
- [ ] Task 1: Infinite Whiteboard Integration (`docs/tasks/phase-8/task1_whiteboard.md`)

## Future Architecture & Monetization Pointers
*These are strategic placeholders so we don't forget the repository and business architecture as the project scales.*

- [ ] **Create `localmind-proxy` (Private Repo)**: Create this *after* Phase 2 when we are ready to implement "AI Credits". This will hold the Cloudflare Worker, Stripe billing logic, and our org-level OpenAI keys for non-technical users.
- [ ] **Create Tauri Desktop App (Public Repo/Directory)**: Create this when we are hitting the 500MB browser storage limits. This remains open-source/public, offering unrestricted local processing and syncing features as the "Pro" tier.
- [ ] **Create `localmind-enterprise` (Private Repo)**: Create this *only when* we have our first enterprise pilot ready to sign. This will hold SSO (SAML/Okta), audit logs, SOC 2 compliance docs, and Docker configs for on-prem deployment.
