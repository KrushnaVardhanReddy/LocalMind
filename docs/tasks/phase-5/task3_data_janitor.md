# Task 3: Local AI Data Janitor

## Objective
Implement an AI-assisted data cleaning tool that accepts DuckDB query results or raw text blobs, generates SQL transformation suggestions using the local LLM, and applies them after user review — all locally, with zero data leaving the device.

## Prerequisites
- Review `docs/specs/phase-5/01_intelligence_spec.md` (Section 5.2).
- Tasks 1 (WebLLM) and 2 (Chat UI) must be complete.
- Phase 1 DuckDB worker must be complete.

## Implementation Steps

### 1. Build the Data Janitor UI
- Create `src/routes/intelligence/janitor/+page.svelte`.
- Two input modes:
  - **From Workspace:** Dropdown to select a registered DuckDB table from the current workspace.
  - **Paste Raw Text:** A textarea for CSV or JSON text.
- "Load Data" button → displays a preview grid of the first 20 rows.

### 2. Problem Scanner
- After loading, run automated DuckDB checks to surface common data quality issues:
  - Null counts per column.
  - Duplicate row count.
  - Columns with mixed types (e.g., some rows are numbers, others are strings).
  - Phone numbers not matching a standard format.
  - Dates in multiple formats.
- Display findings as a "Issues Found" list with severity tags.

### 3. LLM-Suggested Fixes
- For each detected issue, call the WebLLM worker with a structured prompt:
  ```
  "The column 'phone_number' in this table has mixed formats (some are '+1-555-1234', 
   some are '5551234'). Write a DuckDB SQL UPDATE or SELECT expression to normalize all 
   values to E.164 format (+{country_code}{number}). Return only the SQL."
  ```
- Display the suggested SQL in a read-only code panel.
- "Apply Fix" button: executes the SQL via DuckDB worker, refreshes the preview grid.

### 4. Fix History
- Maintain a "Changes Applied" log showing each SQL fix that was run, with an "Undo" option (re-runs the original query to show the pre-fix state).

### 5. Export
- "Download Cleaned Data" → exports the current DuckDB table state as CSV.

## Definition of Done
- Dropping a CSV with mixed phone number formats → "Issues Found" surfaces the phone inconsistency.
- The LLM generates a SQL normalization expression within 30 seconds on a Phi-3-mini model.
- Clicking "Apply Fix" updates the preview grid with the corrected data.
- **No mocks.** Real WebLLM generates the SQL; real DuckDB applies it.
- No data is sent outside the browser at any step.

---

# Phase 5: End-to-End Testing

## Objective
Validate all Phase 5 Intelligence features (model loading, chat, data janitor) via Playwright E2E. Because WebLLM requires WebGPU, these tests run only on Chrome with `--enable-features=Vulkan`.

## Prerequisites
- All Phase 5 tasks must be complete.
- **No mocking rule:** Real WebLLM must be loaded. Model downloads are pre-cached in CI fixtures.

## Test Cases (`tests/phase-5/`)

```typescript
// webllm.spec.ts
test('Model loads successfully and reports loaded state', async ({ page }) => {
    // Navigate to /intelligence/chat
    // Select Llama-3.2-1B (smallest model)
    // Click "Load Model"
    // Wait up to 120 seconds for loading to complete
    // Assert: "Model loaded" status is visible
});

// chat.spec.ts
test('Chat returns a streaming response', async ({ page }) => {
    // Load model (pre-loaded from previous test via shared state)
    // Type "Say 'hello' and nothing else." in the chat input
    // Press Ctrl+Enter
    // Assert: assistant message appears with content containing "hello" within 30 seconds
    // Assert: privacy badge is visible throughout
});

// janitor.spec.ts
test('Data janitor detects null columns', async ({ page }) => {
    // Navigate to /intelligence/janitor
    // Paste a CSV with null values in a column
    // Click "Load Data"
    // Assert: "Issues Found" section shows a null count warning
});
```

## Definition of Done
- Tests pass on Chrome with WebGPU enabled.
- Model is pre-downloaded in CI to avoid download timeout failures.
- Privacy badge is asserted in every chat test.
