TASK: Phase 6 — Task 13: Vehicle Telemetry & CAN Bus Analyzer (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline diagnostics tool for car enthusiasts and mechanics. Users will upload OBD-II or CAN bus CSV logs. The app will use DuckDB to aggregate the telemetry data and WebLLM to analyze potential diagnostic trouble codes (DTCs).

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- Reuse Existing Workers: Use DuckDB and WebLLM singletons.
- UI Component Isolation: You MUST NOT create any generic components in `src/lib/components/ui/`. If you need generic components, create them locally in `src/lib/components/plugins/telemetry/ui/`.
- Purely Offline: Works perfectly inside a garage with no Wi-Fi.

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
1. **DuckDB Log Analysis:**
   - Accept large CSV logs containing RPM, Speed, Engine Load, and Timestamps.
   - Use DuckDB to ingest the file and find maximums/averages (e.g., `SELECT MAX(RPM), AVG(Speed) FROM telemetry`).
2. **DTC (Diagnostic Trouble Code) Analyzer:**
   - Provide a text input for the user to enter error codes (e.g., "P0171").
   - Send the code to WebLLM with the prompt: "Act as an expert mechanic. Explain what this OBD-II code means, common causes, and potential fixes."
3. **Data Grid:**
   - Display the raw telemetry data using a paginated HTML table powered by DuckDB `LIMIT` and `OFFSET` queries.
4. **State Management:** Svelte 5 `$state()` runes must be used.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/telemetry/+page.svelte`
2. NEW: `src/lib/components/plugins/telemetry/TelemetryGrid.svelte`
3. NEW: `src/lib/components/plugins/telemetry/DTCAnalyzer.svelte`

Commit: "feat: Phase 6 Task 13 Vehicle Telemetry Analyzer"
Target branch: feature/task13-telemetry
