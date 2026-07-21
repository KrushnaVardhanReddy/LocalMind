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

*(Note: Additional sets follow this exact pattern: ONE WorkerManager modifier + multiple independent UI tasks to maintain 100% conflict-free parallelism.)*
