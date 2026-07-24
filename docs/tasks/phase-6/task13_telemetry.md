# LocalMind Vehicle Telemetry & CAN Bus Analyzer

## 1. Goal
Provide an offline workspace for automotive engineers and mechanics to ingest massive vehicle telemetry logs (CAN bus, PCAP, OBD-II) and analyze them instantly without an internet connection.

## 2. Technical Stack
- **DuckDB (Existing Worker):** Used to ingest massive CSV/JSON telemetry logs (millions of rows) instantly.
- **WebLLM (Existing Worker):** Used to interpret OBD-II Diagnostic Trouble Codes (DTC) and suggest mechanical fixes.
- **Svelte UI / ECharts:** A dashboard route (`/auto-telemetry`) for plotting time-series data (e.g., Engine RPM vs. Coolant Temp).

## 3. Conflict-Free Execution (Parallel Sets)
- **Safe:** This task relies entirely on *existing* workers (`getDuckDB` and `getWebLLM`). It does **not** need to modify `WorkerManager.ts`. 

## 4. Acceptance Criteria
- [ ] Implement a `/auto-telemetry` route with a drag-and-drop file uploader.
- [ ] Connect DuckDB to parse the dropped CSV/JSON log file.
- [ ] Use ECharts to plot 2-3 selectable metrics over time.
- [ ] Provide an input box where a user can enter an OBD-II code (e.g., "P0300") and have WebLLM explain the misfire and suggest diagnostic steps.
