# Phase 1: AI Insights Specification

## 1. Overview
This specification outlines the optional, consent-gated cloud AI features for Phase 1. True to LocalMind's privacy-first principles, raw data never leaves the device. Only locally-computed statistics and aggregated summaries are sent to the AI provider to generate natural language insights.

## 2. Core Principles
- **Cloud is Optional**: AI features are disabled by default.
- **Explicit Consent**: A user must explicitly approve the payload before every network request to an AI provider.
- **No PII**: Raw rows and personally identifiable information are explicitly stripped before aggregation.
- **Bring Your Own Key (BYOK)**: To maintain a completely serverless and private architecture, interactions with AI providers are executed directly from the browser using user-provided API keys.

## 3. Core Features

### 3.1 Global AI Configuration & Opt-Out
- **Settings UI**: A global settings panel will be introduced, allowing users to:
  - Toggle AI features on or off (`aiEnabled`).
  - Input their API Key for an OpenAI-compatible endpoint (`aiApiKey`).
  - Configure the AI Model (`aiModel`, defaulting to `gpt-4o-mini` or similar low-cost models).
  - Configure the Endpoint URL (`aiEndpoint`, defaulting to OpenAI's standard endpoint).
- **Opt-Out**: When `aiEnabled` is false, all AI-related UI elements (Text-to-SQL, Generate Insights) are completely hidden from the interface.

### 3.2 Aggregated Insight Generation
- **Workflow**:
  1. DuckDB computes aggregations locally. The system will automatically attempt to identify a categorical column and a numeric column to perform a basic aggregation (e.g., `SUM(numeric)` grouped by `categorical` order by sum descending limit 10). If none are found, basic table statistics are used.
  2. The application formats these statistics into a structured JSON payload according to the Cloud AI API Contract.
  3. A consent dialog presents the exact payload to the user for review.
  4. Upon consent, the payload is sent directly from the browser to the configured AI provider.
  5. The AI returns a plain-language summary.

### 3.3 Natural Language to SQL (Text-to-SQL)
- **Workflow**:
  1. User types a question (e.g., "Show me the top 10 customers by revenue").
  2. Application constructs a payload containing ONLY the inferred schema (column names and data types) and the user's prompt.
  3. A consent dialog presents the exact payload to the user for review.
  4. Upon consent, the payload is sent directly from the browser to the configured AI provider.
  5. The AI returns a DuckDB-compatible SQL query.
  6. The returned SQL query populates the SQL Editor and is executed locally via DuckDB WASM.

## 4. Security & Compliance
- **Direct Browser-to-Cloud**: API keys and payloads are sent directly from the client to the LLM provider, ensuring LocalMind backend never sees or stores this data.
- **API Key Storage**: API keys are held **in-memory only** (a reactive Svelte store that is never written to `localStorage`, `sessionStorage`, IndexedDB, or any other persistent mechanism). Keys are lost when the tab is closed. This is intentional — it prevents browser extensions, XSS, and physical access from extracting stored credentials. The user must re-enter their key each session.
- **Non-sensitive settings** (e.g., `aiEnabled`, `aiModel`, `aiEndpoint`) may be persisted to `localStorage` as they contain no credentials.
- Payloads are encrypted in transit via standard HTTPS/TLS provided by the AI endpoint.

### 5. Future LLM/Provider Strategies
While Phase 1 strictly implements a **BYOK (Bring Your Own Key)** model, we have identified two additional paths to improve accessibility and privacy for different user cohorts in the future:
1. **LocalMind Proxy (Optional/Subscription)**: We could host a lightweight, stateless proxy (e.g., via Cloudflare Workers) that forwards requests using our own organizational API keys. Users would pay a simple subscription via Stripe to LocalMind to use this service, abstracting away the API keys entirely for non-technical users. The stateless proxy architecture ensures we retain the "no logging/no data storage" privacy guarantee.
2. **Local LLM (Phase 5)**: Aligning with "Phase 5: WebLLM Engine Setup", eventually users will be able to run smaller, optimized models directly within the browser via WebGPU. This completely eliminates the need for any cloud provider or external network requests, representing the ultimate privacy-first solution.
