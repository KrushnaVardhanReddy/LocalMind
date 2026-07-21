# Task 4: Consent-Gated AI Insights (v2)

## Objective
Implement the "Bring Your Own Key" (BYOK) AI integration, ensuring that no data leaves the browser without explicit user consent and strict truncation.

## Prerequisites
- Review `docs/specs/phase-1/03_ai_insights_spec.md`.
- Ensure Task 3 is complete.

## Implementation Steps

### 1. LLM Worker Setup
- Create `src/lib/workers/llm.worker.ts`.
- Implement `setApiKey()` and `analyzeData()` using standard `fetch` calls to the OpenAI/Anthropic REST APIs.
- Expose the class via Comlink.

### 2. Add Settings Modal
- Add a settings gear icon in the UI.
- Create a modal where the user can paste their `OPENAI_API_KEY`. Save this key in `localStorage`.

### 3. Implement the Consent Flow
- Add an "Ask AI to Analyze" button next to the query results from Task 3.
- When clicked, do not send data immediately. Show a modal displaying the exact JSON string of the first 5 rows and the schema.
- Add an "I Consent, Send to AI" button.

### 4. Fetch and Render Insights
- Upon consent, pass the data to the LLM worker.
- Display a loading skeleton in the UI.
- Render the Markdown response returned from the worker.

## Definition of Done
- A user can enter their API key.
- The consent modal intercepts all outbound AI requests.
- The API call happens in a Web Worker, not the main thread.
- The UI safely renders the AI's markdown response.
