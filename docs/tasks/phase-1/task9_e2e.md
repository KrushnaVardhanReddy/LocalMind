# Task 5: End-to-End Testing (Phase 1)

## Objective
Establish the Playwright test suite for Phase 1 to guarantee that data ingestion, WASM workers, and AI consent flows work properly across Chrome, Firefox, and WebKit without regressions.

## Prerequisites
- Tasks 1 through 4 must be fully complete and merged.

## Implementation Steps

### 1. Playwright Setup
- Run `bun create playwright` if not already installed.
- Configure `playwright.config.ts` to spin up the local Vite dev server before running tests.

### 2. Worker & DuckDB Tests
- Write a test to upload a sample 1MB CSV via the mock file picker.
- Assert that the virtual file is successfully registered in DuckDB.
- Write a SQL query via the UI, submit it, and assert that the Data Grid renders the expected rows.

### 3. AI Consent Flow Tests
- Mock the `localStorage` to inject a fake OpenAI API key.
- Click the "Ask AI" button.
- Assert that the network request is BLOCKED and the Consent Modal appears.
- Click "I Consent" and mock the outbound network request to return a fake summary.
- Assert the summary renders on the screen.

## Definition of Done
- `bun run test:e2e` passes across all 3 major browser engines.
- The UI-to-Worker communication is thoroughly validated.
