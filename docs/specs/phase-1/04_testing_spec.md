# Phase 1: End-to-End Testing Specification

## 1. Overview
This specification defines the End-to-End (E2E) testing requirements for Phase 1 of the Data Workspace. We will use Playwright to ensure the UI correctly interacts with local file ingestion, local DuckDB querying, basic visualizations, and AI consent workflows.

## 2. Testing Framework and Setup
- **Framework:** Playwright (already initialized).
- **Environment:** Tests will run against the local SvelteKit dev server (`http://localhost:5173/`).
- **Test Data:** A standard `products.csv` file located in `tests/fixtures/` will be used as the test dataset.

## 3. Test Scenarios

### 3.1 Data Ingestion and Query Execution
- **Pre-condition:** Engine is initialized.
- **Action:** Upload the `products.csv` fixture via the file input.
- **Verification:**
  1. The dataset schema (columns and types) is displayed.
  2. The table name `products` is inferred and displayed as the active dataset.
  3. A default query (`SELECT * FROM products LIMIT 100`) executes and displays results in the data table.
  4. Custom SQL execution: Enter `SELECT COUNT(*) as cnt FROM products;` in the SQL Editor and verify the result row displays `cnt: 5`.

### 3.2 Visualization & Profiling
- **Pre-condition:** `products.csv` is uploaded and active.
- **Action:** Inspect the Column Statistics and Chart Viewer UI.
- **Verification:**
  1. Column statistics are generated for the active schema.
  2. The charting UI is rendered (e.g., canvas or SVG presence).
  3. The chart can switch between bar and pie chart types based on available columns.

### 3.3 AI Consent Flow (Text-to-SQL)
- **Pre-condition:** `products.csv` is uploaded and active.
- **Action:** Enable AI features via the AI Settings modal. Enter a query in the Text-to-SQL input and trigger generation.
- **Verification:**
  1. The "Consent Review" modal appears.
  2. The displayed payload contains the exact schema of the dataset.
  3. The payload does *not* contain raw row data, adhering to the `cloud_ai_contract.md`.
  4. Approving the consent modal attempts to generate the SQL (mocked or real LLM behavior).

## 4. Acceptance Criteria
- All Playwright test scenarios are explicitly defined and pass successfully against the local build.
- UI elements may be selected via existing text, aria roles, or basic CSS selectors.
