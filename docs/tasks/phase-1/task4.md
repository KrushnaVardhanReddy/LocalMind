# Task 4: Consent-Gated AI Insights

## Objective
Implement the optional, privacy-preserving AI features (Insights and Text-to-SQL) while strictly adhering to the consent model.

## Prerequisites
- Completion of Task 3 (Query Execution).
- Review `docs/specs/phase-1/03_ai_insights_spec.md`.
- Review `docs/contracts/phase-1/cloud_ai_contract.md`.

## Implementation Steps

### 1. Global AI Toggle
- Add a global settings toggle to enable/disable AI features entirely. Store this preference in `localStorage`.
- Ensure AI UI elements are completely hidden when disabled.

### 2. Text-to-SQL Feature
- Build an input field for natural language questions.
- When submitted, extract the current schema (columns/types).
- **Consent Dialog**: Display a modal showing the exact schema payload that will be sent to the AI provider. Ask for user confirmation.
- Upon consent, call the AI provider API to generate SQL.
- Automatically populate the SQL editor with the result and execute it.

### 3. Aggregated Insights
- Create a button to "Generate Insights" for the current dataset or query result.
- Calculate basic aggregated statistics locally via DuckDB (e.g., top categories, general trends).
- **Consent Dialog**: Display the aggregated JSON payload to the user for review. Ensure no raw rows are included.
- Upon consent, send the payload to the AI provider to generate a natural language summary.
- Display the generated summary in the UI.

## Acceptance Criteria
- [ ] AI features can be completely disabled globally.
- [ ] A consent dialog explicitly shows the exact payload before ANY network request is made to an AI provider.
- [ ] Text-to-SQL successfully translates natural language to queries using only schema data.
- [ ] Insights generation successfully uses locally aggregated data to provide plain-language summaries.
