# Task 5: Visual Log Parser & Anomaly Detector

## Objective
Implement a local log parsing and anomaly detection tool where users drop raw log files, highlight a line to auto-generate a regex, parse the log into a structured DuckDB table, and detect anomalous log patterns using local ONNX embeddings — no cloud required.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md` (Section 3.4).
- Review `docs/contracts/phase-4/devtools_worker_contracts.md` (LogParserWorkerContract).
- Phase 1 DuckDB worker and Phase 2 Embeddings worker must be complete.

## Implementation Steps

### 1. Create the Log Parser Worker
- Create `src/lib/workers/log-parser.worker.ts`.
- Implement `LogParserWorkerContract` strictly.
- `loadLog(file)`: registers the file with DuckDB as a `raw_lines` table via the streaming file registration path.
- `suggestPattern(sampleLine)`: use heuristics to identify:
  - ISO/epoch timestamps → `(?P<timestamp>[\\d-T:.Z]+)`
  - Log levels (INFO, WARN, ERROR, DEBUG) → `(?P<level>INFO|WARN|ERROR|DEBUG)`
  - Remaining text → `(?P<message>.+)`
  - Return a suggested `LogPattern` with pre-filled regex.
- `applyPattern(pattern)`: runs `SELECT REGEXP_EXTRACT(raw_line, pattern.regex, capture_groups) FROM raw_lines` via DuckDB.
- `clusterAnomalies()`: embed 1,000 sampled lines → k-means (k=8) → return clusters sorted by size; flag clusters with < 5% of total lines as anomalies.
- Call `expose(new LogParserService())`.

### 2. Register with WorkerManager
- Add `WorkerManager.getLogParser()`.

### 3. Build the Log Parser UI
- Create `src/routes/devtools/logs/+page.svelte`.
- Raw log viewer: display first 500 lines in a virtualized list (use `svelte-virtual-list`).
- **Highlight to Pattern:** User selects a log line → a tooltip appears: "Generate pattern from this line". On click, `suggestPattern()` runs and populates the regex editor.
- Regex editor: editable field showing the suggested pattern with named group labels.
- "Apply Pattern" button → runs `applyPattern()` → renders structured grid below.
- SQL panel: exposes the parsed DuckDB table for custom queries.

### 4. Anomaly Visualization
- "Detect Anomalies" button → runs `clusterAnomalies()`.
- Render clusters as a bar chart (cluster size distribution).
- Anomalous clusters highlighted in red/orange with a sample log line shown.
- "Export Anomalies" → downloads anomalous lines as a `.txt` file.

## Definition of Done
- Dropping a 100MB nginx access log loads within 5 seconds.
- Highlighting a log line generates a useful regex suggestion.
- Applying the regex produces a structured grid with timestamp, level, and message columns.
- Anomaly detection identifies error spikes correctly in a test log fixture.
- **No mocks.** Real DuckDB parses logs; real ONNX embeddings cluster them.
