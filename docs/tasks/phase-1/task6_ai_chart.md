# Task 6: AI-Assisted Chart Customization

## Objective
Extend the `ChartViewer` component with (1) a local chart suggestion heuristic and (2) natural language chart customization powered by the cloud AI (BYOK) or local LLM (Phase 5).

## Spec Reference
`docs/specs/phase-1/05_ai_chart_customization_spec.md`
`docs/contracts/phase-1/cloud_ai_contract.md` — §4 CHART_CUSTOMIZATION payload

## Prerequisites
- Phase 1 tasks 1–5 complete.
- AI settings (API key store) working.

## Implementation Steps

### Step 1: Expand Chart Types in ChartViewer.svelte
Add 5 new chart types to the existing 3:
- **Scatter**: `xAxisColumn` and `yAxisColumn` both numeric → `{ type: 'scatter', data: [[x, y], ...] }`
- **Area**: Line chart + `areaStyle: {}` on the series
- **Grouped Bar**: Accept a `groupByColumn` selector; run a pivot query via DuckDB to produce multi-series data
- **Horizontal Bar**: Swap `xAxis`/`yAxis` types in the ECharts option
- **Histogram**: Query DuckDB using `width_bucket(column, min, max, 20)` to compute bins; render as bar

Update the `<select id="chart-type">` to include all 8 options.

### Step 2: Local Chart Suggestion Heuristic
Create `src/lib/services/ChartSuggestion.ts`:
```typescript
export function suggestChart(schema: ColumnSchema[], data: any[]): SuggestedChart {
  // Implement heuristic rules from spec §2.2
  // Returns { chartType, xAxisColumn, yAxisColumn, groupByColumn? }
}
```
Call `suggestChart()` in `+page.svelte` immediately after a file loads. Apply the suggestion as the default chart config.

Show a subtle chip: `✨ AI suggested · Bar Chart` with a dismiss button.

### Step 3: Chart AI Input UI
In `ChartViewer.svelte`, add below the chart controls:
```html
<div class="chart-ai-bar">
  <input
    id="chart-ai-input"
    placeholder='e.g. "Make it a horizontal bar, sorted by value descending"'
    bind:value={chartAiPrompt}
    disabled={!aiEnabled}
  />
  <button id="chart-ai-submit" on:click={handleChartAiRequest}>Customize with AI</button>
  <button id="chart-explain-submit" on:click={handleExplainChart}>Explain Chart</button>
</div>
```
Hide the entire bar when `aiEnabled` is false.

### Step 4: Build CHART_CUSTOMIZATION Payload
In `AiService.ts`, add `buildChartCustomizationPayload()`:
- Include: `task: "CHART_CUSTOMIZATION"`, current schema, current ECharts option (type + axes only — no data), user's instruction string.
- **Exclude**: raw data rows, any PII column values.

### Step 5: Consent Dialog Integration
Reuse the existing consent dialog (same as Text-to-SQL flow). On approval, call the AI endpoint. On response:
1. Parse response JSON.
2. Validate with `validateEChartsOption()` (strip unsafe keys per spec §3.3).
3. Call `chartInstance.setOption(validatedOption, { notMerge: false })`.
4. On validation failure, show inline error: "AI returned an invalid chart config. Please try rephrasing."

### Step 6: Local LLM Shortcut (Phase 5 Bridge)
In `handleChartAiRequest()`:
```typescript
if (webllmWorker?.state === 'READY') {
  // Use local LLM — no consent dialog needed
  const option = await workerPool.get('webllm').send('CHAT', { messages: [...], stream: false });
  applyChartOption(option);
} else {
  // Fall back to cloud BYOK consent flow
  openConsentDialog(payload);
}
```
Show a `🔒 Local AI` badge on the chart panel when local LLM path is active.

### Step 7: "Explain This Chart" Feature
When the user clicks "Explain Chart":
1. Run the current chart's DuckDB query to get aggregated results (already computed).
2. Build a `SUMMARIZE_AGGREGATION` payload (reuses existing contract).
3. Show consent dialog.
4. On approval, render AI response as a text panel below the chart.

### Step 8: Update Cloud AI Contract
The `CHART_CUSTOMIZATION` payload type is defined in `docs/contracts/phase-1/cloud_ai_contract.md`.

## Acceptance Criteria
- [ ] All 8 chart types render correctly with the correct ECharts configuration.
- [ ] Local heuristic suggests the correct chart for time-series (line), categorical (bar), and distribution (pie) data from the `products.csv` fixture.
- [ ] Chart AI input sends a consent-gated payload containing schema and instruction but NO raw data rows.
- [ ] A malformed AI response (invalid JSON, banned keys) is rejected with a user-visible error.
- [ ] "Explain Chart" produces a text summary below the chart.
- [ ] The `🔒 Local AI` badge appears when WebLLM is active.
- [ ] Existing Phase 1 E2E tests continue to pass.
- [ ] axe-core passes at `serious` level on the chart panel.
