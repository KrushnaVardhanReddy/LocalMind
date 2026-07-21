# The WASM Engines

LocalMind achieves its "Zero Cloud" capabilities by running industry-standard C/C++/Rust applications compiled to WebAssembly (WASM). Here is the roster of engines powering the platform.

## 1. DuckDB WASM (`@duckdb/duckdb-wasm`)
- **Domain:** Analytics (Phase 1), DevTools (Phase 4).
- **Function:** An in-process SQL OLAP database. It can query CSV, JSON, and Parquet files at millions of rows per second.
- **Why we use it:** It's the core backbone of LocalMind. We stream files into DuckDB and use standard SQL to power the visual charts, data diffing, and log parsing.

## 2. SQLite WASM (`wa-sqlite`)
- **Domain:** Cross-Cutting Persistence.
- **Function:** A port of SQLite that uses the browser's Origin Private File System (OPFS) as a VFS (Virtual File System).
- **Why we use it:** IndexedDB is too slow and has arbitrary size limits. wa-sqlite provides a true, fast relational database for storing user workspaces, dashboard layouts, and AI embeddings across browser sessions.

## 3. Tesseract.js & MuPDF WASM
- **Domain:** Docs Engine (Phase 2).
- **Function:** Tesseract provides optical character recognition (OCR) for scanned images. MuPDF provides PDF rendering, splitting, merging, and text extraction.
- **Why we use it:** To index unsearchable documents entirely on-device.

## 4. Transformers.js (`@xenova/transformers`)
- **Domain:** Intelligence (Phase 2, 3, 5).
- **Function:** Runs ONNX-quantized AI models using the CPU or WebGL.
- **Use Cases:** 
  - `all-MiniLM-L6-v2` for Semantic Search embeddings.
  - `whisper-tiny` for Speech-to-Text transcription.
  - Token classification models for PII Redaction (NER).

## 5. FFmpeg WASM (`@ffmpeg/ffmpeg`)
- **Domain:** Media (Phase 3).
- **Function:** The gold standard for audio and video processing.
- **Why we use it:** Allows users to transcode videos, extract audio, and trim clips without uploading massive media files.

## 6. OpenCascade & gdal3.js
- **Domain:** Specialized Plugins (Phase 6).
- **Function:** Brings heavy engineering tools to the browser. OpenCascade handles 3D CAD (`.step`, `.iges`), and GDAL handles geospatial mapping data (`.shp`, `.geojson`).

## 7. WebLLM (`@mlc-ai/web-llm`)
- **Domain:** Intelligence (Phase 5).
- **Function:** Compiles LLaMA, Gemma, and Phi-3 models to WebGPU shaders.
- **Why we use it:** Achieves 40+ tokens per second for local chat AI directly on the user's GPU, completely air-gapped.
