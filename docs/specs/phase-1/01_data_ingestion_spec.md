# Phase 1: Data Ingestion Specification

## 1. Overview
The Data Ingestion module is responsible for safely, securely, and efficiently loading structured datasets (CSV, Excel, JSON, Parquet) directly into the browser without uploading any data to a remote server. This relies on modern web APIs like the File System Access API and memory-efficient streaming to handle gigabyte-scale files locally.

## 2. Core Features

### 2.1 Local File Access
- **API**: Use the File System Access API (`showOpenFilePicker`).
- **Behavior**: Prompt the user to select local files. Read files as streams or ArrayBuffers depending on size and format.
- **Privacy**: Raw file bytes remain strictly inside the browser tab and are never sent over the network.

### 2.2 Format Support & Parsing
- **CSV / TSV**: Stream parsing, auto-detect delimiters.
- **Excel (.xlsx, .xls)**: Parse locally using **SheetJS (xlsx)**. Convert to CSV in-memory before handing off to DuckDB WASM. SheetJS is chosen because it runs purely in JS with no native dependencies, handles both `.xlsx` and legacy `.xls`, and does not require a WASM compilation step.
- **JSON**: Stream parsing for large JSON arrays.
- **Parquet**: Process directly using DuckDB WASM.

### 2.3 PII Detection & Masking
- **Behavior**: Auto-scan a sample of incoming rows to identify Personally Identifiable Information (PII) such as Names, Emails, SSNs, and Credit Card numbers.
- **Sample Size**: Sample the **first 1,000 rows** for PII detection and schema inference. This is enough to achieve >95% accuracy on common PII patterns without blocking the UI for more than ~100ms even on large files. For files under 1,000 rows, the entire file is scanned.
- **Masking**: Provide the user with the option to mask or redact these columns before they become part of the active workspace or before any summaries are generated.

### 2.4 Schema Inference
- **Behavior**: Analyze the **first 1,000 rows** to determine column data types (String, Integer, Float, Date, Boolean). Same sample window as PII detection — both operations run in a single pass.
- **Output**: Generate local SQL DDL statements, TypeScript types, or Pydantic models from the inferred schema.

### 2.5 Workspace Persistence
- **Engine**: `wa-sqlite` running in the DuckDB Web Worker.
- **Behavior**: After a file is successfully loaded, persist the table name, inferred schema, and file metadata to the local `wa-sqlite` database stored in OPFS. On next app load, restore the last active workspace automatically.
- **Saved Queries**: SQL queries executed by the user are saved to `wa-sqlite` and presented in a "Saved Queries" panel for reuse across sessions.

## 3. Non-Functional Requirements & Limits
- **Performance**: Must initiate parsing of a 100MB file in under 2 seconds.
- **Memory & Limits**: 
  - **Web Version (Free):** Hard limit of 500MB per file to prevent browser OOM (Out of Memory) crashes.
  - **Desktop Version (Pro):** Bypasses browser limits via Tauri; supports up to 10GB files using chunked streaming directly from the OS filesystem.
- **UI Responsiveness**: Main thread must never be blocked during ingestion (use Web Workers).

## 4. Resolved Decisions
- **Excel parsing library**: SheetJS (`xlsx`) — pure JS, no WASM, handles `.xlsx` and `.xls`. (Resolved)
- **Sample size for PII / Schema Inference**: 1,000 rows — single-pass over the first 1,000 rows covers both operations. (Resolved)
- **Persistence**: `wa-sqlite` in OPFS for workspace state and saved queries. (Resolved)
