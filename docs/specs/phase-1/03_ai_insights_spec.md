# Spec: Consent-Gated AI Insights (v2)

## 1. Objective
LocalMind is a privacy-first platform. All AI interactions must be explicitly consent-gated. This spec defines how we summarize or analyze local data (like DuckDB query results) using an external LLM (via BYOK - Bring Your Own Key) without leaking PII.

## 2. Architecture
1. **The LLM Worker:** A dedicated Web Worker (`llm.worker.ts`) handles API calls to OpenAI/Anthropic.
2. **Consent UI:** Before any data leaves the browser, a modal must display exactly what JSON payload is being sent.
3. **Data Truncation:** We never send raw tables. We only send statistical aggregates (e.g., `MIN`, `MAX`, `AVG`, `COUNT`) or severely truncated sample rows (max 5 rows).

## 3. Worker Contract (`docs/contracts/phase-1/llm_worker_contract.ts`)
```typescript
export interface LLMWorkerContract {
    isAIEnabled(): Promise<boolean>;
    enableAI(): Promise<void>;
    setApiKey(key: string, provider: 'openai' | 'anthropic'): void;
    analyzeData(prompt: string, dataSample: string): Promise<string>;
}
```

## 4. UI Flow
1. User clicks "Ask AI".
2. UI dynamically iterates over all `uploadedTables`, runs `DESCRIBE <table>` to aggregate a combined active schema, and runs `SELECT * LIMIT 5` on the active query result via DuckDB.
3. UI presents a Modal: "LocalMind wants to send the following schema and 5 rows to OpenAI. Do you consent?"
4. If Yes, UI calls `WorkerManager.getLLM().analyzeData(...)`.
