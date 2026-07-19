# Phase 1: AI Insights Specification

## 1. Overview
This specification outlines the optional, consent-gated cloud AI features for Phase 1. True to LocalMind's privacy-first principles, raw data never leaves the device. Only locally-computed statistics and aggregated summaries are sent to the AI provider to generate natural language insights.

## 2. Core Principles
- **Cloud is Optional**: AI features are disabled by default.
- **Explicit Consent**: A user must explicitly approve the payload before every network request to an AI provider.
- **No PII**: Raw rows and personally identifiable information are explicitly stripped before aggregation.

## 3. Core Features

### 3.1 Aggregated Insight Generation
- **Workflow**:
  1. DuckDB computes aggregations locally (e.g., total sales per month, top 5 categories).
  2. The application formats these statistics into a structured JSON payload or Markdown string.
  3. A dialog presents the exact payload to the user for review.
  4. Upon consent, the payload is sent to the Cloud AI provider.
  5. The AI returns a plain-language summary (e.g., "Revenue dropped by 8% this month, primarily driven by a decrease in Category X").

### 3.2 Natural Language to SQL (Text-to-SQL)
- **Workflow**:
  1. User types a question (e.g., "Show me the top 10 customers by revenue").
  2. Application sends ONLY the inferred schema (column names and data types) to the Cloud AI.
  3. Cloud AI returns a DuckDB-compatible SQL query.
  4. DuckDB WASM executes the query locally against the raw data.

### 3.3 Opt-Out & Global Disable
- Provide a global setting to completely disable all AI features and hide AI-related UI elements for highly sensitive workspaces.

## 4. Security & Compliance
- Ensure payloads are encrypted in transit (HTTPS/TLS).
- Do not log or store the generated AI prompts on any backend server owned by LocalMind; requests should pass directly to the LLM provider (or via a stateless proxy if hiding API keys).
