# Task 5: End-to-End Testing (Phase 1)

## Objective
Implement robust, non-mocked End-to-End (E2E) tests for the Data Workspace using Playwright, ensuring the complete pipeline works from file selection to AI insights.

## Prerequisites
- Completion of Tasks 1-4.

## Implementation Steps

### 1. Playwright Setup
- Ensure Playwright is installed and configured in the project (`npm init playwright@latest`).
- Configure tests to run against the local development server.

### 2. Test: File Ingestion & Query Execution
- Create a test that:
  1. Opens the application.
  2. Uses Playwright's file chooser to upload a sample CSV file (provided in a `tests/fixtures/` directory).
  3. Verifies the schema is inferred and displayed correctly.
  4. Types a SQL query into the editor (e.g., `SELECT COUNT(*) FROM test_file`).
  5. Executes the query and verifies the result in the data table.

### 3. Test: Visualization & Profiling
- Create a test that:
  1. Loads a dataset.
  2. Verifies that column statistics are generated and displayed.
  3. Interacts with the charting UI to create a basic bar chart.
  4. Verifies the chart canvas is rendered.

### 4. Test: AI Consent Flow (Real Network, Real UI)
- Create a test that:
  1. Enables AI features in settings.
  2. Submits a natural language query for Text-to-SQL.
  3. **Verifies the Consent Dialog appears and displays the correct schema payload.**
  4. Uses the real AI provider API (Ensure API keys are securely provided via CI secrets).
  5. Approves the consent dialog.
  6. Verifies the returned SQL is populated in the editor.

## Acceptance Criteria
- [ ] Playwright E2E test suite runs successfully locally and in CI.
- [ ] Core workflows (Ingestion, Query, Charting, Consent) are covered by automated tests.
- [ ] AI testing explicitly validates the presence and content of the consent dialog using the real AI provider API.
