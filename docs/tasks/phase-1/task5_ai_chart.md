# Task 6: AI-Assisted Chart Customization (v2)

## Objective
Allow users to chat with their data to generate complex ECharts configurations dynamically using DuckDB's fast aggregation capabilities combined with LLM code generation.

## Prerequisites
- Review `docs/specs/phase-1/03_ai_insights_spec.md`.
- Ensure Task 4 (Consent AI) is complete.

## Implementation Steps

### 1. Expand the LLM Worker
- In `llm.worker.ts`, add a new method: `generateChartConfig(prompt: string, schema: Record<string, string>): Promise<any>`.
- Prompt the LLM to output ONLY a valid JSON ECharts configuration object based on the schema and the user's intent.

### 2. Chat UI Integration
- Add a text input below the basic chart (from Task 3) that says: *"Make this a pie chart grouped by Region."*
- Wire this input to the `generateChartConfig` method in the worker (triggering the consent modal if necessary, though we only send schema here, not row data).

### 3. ECharts Dynamic Rendering
- When the worker returns the JSON config, safely parse it and pass it directly to the ECharts component.
- Ensure any DuckDB queries required by the new chart (e.g., `GROUP BY`) are executed by the DuckDB worker before passing the series data to the chart.

## Definition of Done
- A user can type a natural language request to alter the chart.
- The LLM generates the ECharts configuration.
- DuckDB calculates the new aggregations if needed.
- The chart updates dynamically without blocking the UI thread.
