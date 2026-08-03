TASK: Phase 6 — Task 8: Medical & Health Insights (Plugin)

═══════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════
Build an offline health dashboard. Users can upload medical lab reports (PDF/Image) to be scanned by OCR and explained by WebLLM in plain English. Users can also upload Apple Health or Google Fit CSV exports to be charted using DuckDB.

═══════════════════════════════════════════════════════════════
CONSTRAINTS & RULES (CONFLICT-FREE CONTRACT)
═══════════════════════════════════════════════════════════════
- NO WorkerManager Modifications: Do NOT modify `src/lib/workers/WorkerManager.ts`.
- Reuse Existing Workers: Rely strictly on the DuckDB, OCR, and WebLLM singletons.
- UI Component Isolation: You MUST NOT create any generic components in `src/lib/components/ui/`. If you need generic components, create them locally in `src/lib/components/plugins/medical/ui/`.
- Purely Offline: Medical data is highly sensitive. No API calls are allowed.

═══════════════════════════════════════════════════════════════
IMPLEMENTATION TIPS
═══════════════════════════════════════════════════════════════
1. **Lab Report Jargon Translator:**
   - Provide a Dropzone for uploading blood work or lab reports (Images/PDFs).
   - Use the OCR worker to extract the text.
   - Send the text to WebLLM with the prompt: "Act as a compassionate doctor. Explain these lab results in plain, simple English. Highlight any values that seem out of normal range, but include a disclaimer that you are an AI and not a substitute for professional medical advice."
2. **Health CSV Analytics:**
   - Allow uploading Apple Health/Google Fit CSV files. 
   - Load the CSV into DuckDB. 
   - Execute queries like `SELECT date, steps FROM health_data ORDER BY date DESC LIMIT 30` and render the output in a simple HTML table or using a basic SVG chart if possible.
3. **State Management:** Svelte 5 `$state()` runes must be used.

═══════════════════════════════════════════════════════════════
DELIVERABLES
═══════════════════════════════════════════════════════════════
1. NEW: `src/routes/plugins/medical/+page.svelte`
2. NEW: `src/lib/components/plugins/medical/LabReportTranslator.svelte`
3. NEW: `src/lib/components/plugins/medical/HealthMetricsViewer.svelte`

Commit: "feat: Phase 6 Task 8 Medical and Health Insights"
Target branch: feature/task8-health
