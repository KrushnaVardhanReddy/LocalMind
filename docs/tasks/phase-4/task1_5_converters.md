# Task 1.5: Data Format Converters (JSON ↔ YAML ↔ XML)

## Objective
Implement bidirectional data format converters (JSON ↔ YAML ↔ XML) that process large files via streaming, running entirely in a Web Worker so the UI never blocks on multi-megabyte conversions.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.2).
- Task 1 (Formatters) UI scaffold must be complete.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add js-yaml fast-xml-parser
```

### 2. Create the Converter Worker
- Create `src/lib/workers/converter.worker.ts`.
- Implement the following methods via Comlink:

  ```typescript
  export interface ConverterResult {
      success: boolean;
      data?: string | Uint8Array;
      error?: string;
  }

  interface ConverterWorkerContract {
      jsonToYaml(jsonText: string): Promise<ConverterResult>;
      yamlToJson(yamlText: string): Promise<ConverterResult>;
      jsonToXml(jsonText: string, rootElement?: string): Promise<ConverterResult>;
      xmlToJson(xmlText: string): Promise<ConverterResult>;
      gzip(data: string | Uint8Array): Promise<ConverterResult>;
      gunzip(data: Uint8Array): Promise<ConverterResult>;
      formatJson(jsonText: string): Promise<ConverterResult>;
      minifyJson(jsonText: string): Promise<ConverterResult>;
  }
  ```

- `jsonToYaml`: `JSON.parse()` → `js-yaml.dump()`.
- `yamlToJson`: `js-yaml.load()` → `JSON.stringify(null, 2)`.
- `jsonToXml`: `JSON.parse()` → `fast-xml-parser.parse()` → XML string builder.
- `xmlToJson`: `fast-xml-parser.XMLParser()` → `JSON.stringify(null, 2)`.
- All conversions must handle errors gracefully and return a typed error response (not throw).
- Call `expose(new ConverterService())`.

### 3. Register with WorkerManager
- Add `WorkerManager.getConverter()`.

### 4. Build the Converter UI
- Create `src/routes/devtools/converters/+page.svelte`.
- Source format selector (JSON / YAML / XML) — dropdown.
- Target format selector — dropdown (auto-excludes same format as source).
- Input: `<textarea>` or file drop zone (`.json`, `.yaml`, `.yml`, `.xml`).
- Output: read-only formatted panel.
- "Convert" button — triggers the worker call.
- "Swap" button — swaps source and target formats.
- "Download Output" button — downloads the converted text as a file with the correct extension.

### 5. Large File Streaming
- For files > 1MB, show a progress bar during conversion.
- The worker should process YAML/XML in chunks using `js-yaml`'s document stream API for large inputs.

## Definition of Done
- Converting a 5MB JSON file to YAML completes without blocking the UI.
- Converting malformed XML shows a descriptive error message, not an unhandled exception.
- Round-trip conversion (JSON → YAML → JSON) produces semantically identical output.
- **No mocks.** Real conversion libraries run in the Worker thread.
- "Download Output" produces a file with the correct `.yaml` / `.json` / `.xml` extension.
