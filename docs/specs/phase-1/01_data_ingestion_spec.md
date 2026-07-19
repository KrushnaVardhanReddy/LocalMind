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
- **Excel (.xlsx, .xls)**: Parse locally using a lightweight WASM or JS library.
- **JSON**: Stream parsing for large JSON arrays.
- **Parquet**: Process directly using DuckDB WASM.

### 2.3 PII Detection & Masking
- **Behavior**: Auto-scan a sample of incoming rows to identify Personally Identifiable Information (PII) such as Names, Emails, SSNs, and Credit Card numbers.
- **Masking**: Provide the user with the option to mask or redact these columns before they become part of the active workspace or before any summaries are generated.

### 2.4 Schema Inference
- **Behavior**: Analyze the first N rows to determine column data types (String, Integer, Float, Date, Boolean).
- **Output**: Generate local SQL DDL statements, TypeScript types, or Pydantic models from the inferred schema.

## 3. Non-Functional Requirements & Limits
- **Performance**: Must initiate parsing of a 100MB file in under 2 seconds.
- **Memory & Limits**: 
  - **Web Version (Free):** Hard limit of 500MB per file to prevent browser OOM (Out of Memory) crashes.
  - **Desktop Version (Pro):** Bypasses browser limits via Tauri; supports up to 10GB files using chunked streaming directly from the OS filesystem.
- **UI Responsiveness**: Main thread must never be blocked during ingestion (use Web Workers).

## 4. Open Questions
- What library should be used for initial Excel parsing before loading into DuckDB?
- How many rows should be sampled for accurate Schema Inference and PII detection without degrading performance?
