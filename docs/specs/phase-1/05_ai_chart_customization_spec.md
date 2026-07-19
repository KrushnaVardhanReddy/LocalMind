# Phase 1 (Enhancement): AI-Assisted Chart Customization Specification

## 1. Overview
This specification defines how AI — both cloud (consent-gated BYOK) and local (Phase 5 WebLLM) — integrates with the `ChartViewer` component to let users customize, annotate, and generate charts using natural language.

The feature has **two tiers**:
- **Tier 1 — Chart Suggestion (no AI required):** Purely local heuristic that automatically recommends the best chart type and axes based on column types and cardinality.
- **Tier 2 — Natural Language Chart Customization (AI-powered):** User describes what they want in plain English; AI returns an ECharts configuration object that is applied directly.

## 2. Tier 1 — Local Chart Suggestion (No AI, No Consent)

### 2.1 Behavior
When a dataset is loaded, LocalMind automatically recommends a chart configuration using the inferred schema from the DuckDB worker. No AI call is made — this is a local heuristic.

### 2.2 Heuristic Rules
| Data shape | Recommended chart | Reasoning |
|---|---|---|
| 1 categorical + 1 numeric column | Bar chart | Classic category comparison |
| 1 date/timestamp + 1 numeric | Line chart | Time-series data |
| 1 categorical + 1 numeric, ≤ 8 categories | Pie chart | Share of total |
| 2+ numeric columns | Scatter plot | Correlation analysis |
| 1 categorical, many numeric aggregates | Grouped bar chart | Multi-metric comparison |
| Result set has 1 row, many columns | Horizontal bar | Profile/summary view |

### 2.3 UX
- The suggested chart is applied immediately when a dataset first loads.
- A subtle "AI suggested this chart" indicator is shown with a "Change" button to open manual controls.
- The user can always override manually.

## 3. Tier 2 — Natural Language Chart Customization (AI-Powered)

### 3.1 Overview
The user types a natural language instruction into a "Chart AI" input box and the AI returns a partial or complete ECharts `option` object that is merged into the current chart configuration.

**Examples of what a user can say:**
- *"Change this to a stacked bar chart grouped by category"*
- *"Add a trend line"*
- *"Make it a horizontal bar chart, sorted by value descending"*
- *"Use a blue and orange color palette"*
- *"Add a title: Q4 Revenue by Region"*
- *"Show the top 10 only"* ← This triggers a DuckDB query modification, not just a visual change

### 3.2 Two Execution Paths

#### Path A — Cloud AI (BYOK, consent-gated)
Same consent flow as Text-to-SQL:
1. User types instruction.
2. App builds a `CHART_CUSTOMIZATION` payload (schema + current chart config + instruction — **no raw data rows**).
3. Consent dialog shows the exact payload.
4. User approves → payload sent to AI provider.
5. AI returns a partial ECharts `option` JSON.
6. App validates and merges the returned option into the current chart.

#### Path B — Local LLM (Phase 5, zero cloud)
When Phase 5's WebLLM worker is initialized:
- The same instruction is sent to the local LLM in the WebLLM worker.
- No consent dialog required (nothing leaves the device).
- A "Local AI" badge is shown on the chart panel when this path is active.
- Falls back to Path A (with a prompt) if WebLLM is not initialized.

### 3.3 ECharts Option Validation
The AI response MUST be validated before being applied:
- Parse as JSON. If invalid JSON, show error: "AI returned an invalid chart configuration."
- Strip any keys that are not in the ECharts `option` allowlist (prevent XSS via function injection).
- **Blocked keys**: `formatter` (if it contains a function string), any key containing `<script>`, `javascript:`, `eval(`, `Function(`.
- Apply via `chartInstance.setOption(validatedOption, { notMerge: false })` (merge mode, not replace).

### 3.4 "Fix This Chart" Mode
A secondary AI action: "Explain this chart" — the AI generates a one-paragraph natural language summary of what the chart shows, using the same aggregated data payload as the `SUMMARIZE_AGGREGATION` task. This appears as a text panel below the chart.

## 4. New Chart Types to Unlock
To make AI chart customization meaningful, extend `ChartViewer.svelte` from 3 to 8 chart types:

| Chart Type | ECharts type | Use case |
|---|---|---|
| Bar | `bar` | Already exists |
| Line | `line` | Already exists |
| Pie | `pie` | Already exists |
| **Scatter** | `scatter` | Correlation between two numeric columns |
| **Area** | `line` + `areaStyle` | Cumulative/stacked trends |
| **Grouped Bar** | `bar` + multiple series | Multi-metric comparison |
| **Horizontal Bar** | `bar` + `xAxis/yAxis swap` | Ranking lists |
| **Histogram** | DuckDB `width_bucket()` + `bar` | Distribution analysis |

## 5. Architecture

```
User types instruction
         │
         ├──► [Local LLM available?] ──► WebLLM Worker → ECharts option JSON
         │
         └──► [Cloud AI] ──► Build CHART_CUSTOMIZATION payload
                                      │
                                      ▼
                              Consent Dialog (user reviews)
                                      │
                                      ▼
                              AI Provider → ECharts option JSON
                                      │
                              Validate + Sanitize
                                      │
                              chartInstance.setOption(option)
```

## 6. Non-Functional Requirements
- Chart AI input must not block the UI — run in a microtask.
- Local suggestion heuristic must run in < 50ms.
- AI chart response must be applied within 500ms of receiving the API response.
- Invalid AI responses must show a clear error with the ability to retry.

## 7. Privacy Invariants
- Raw data rows are **never** included in the `CHART_CUSTOMIZATION` payload.
- The payload contains: schema (column names + types), current chart config (type, axes, colors), and the user's instruction string.
- If the instruction implies a data change (e.g., "show top 10 only"), a separate `TEXT_TO_SQL` call is made first to modify the query, then the chart is re-rendered on the new result set.

## 8. Task Reference
See `docs/tasks/phase-1/task6_ai_chart.md`.
