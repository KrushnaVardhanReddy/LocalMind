# Contract: UI ↔ Worker Communication (v2)

## 1. Overview
Instead of traditional `postMessage` passing which requires complex switch statements and serialization manually, LocalMind (v2) uses **Comlink** to wrap Web Workers in ES6 Proxies.

This file defines the strict TypeScript interfaces that the UI and Workers must adhere to.

## 2. DuckDB Worker Contract

```typescript
// docs/contracts/phase-1/duckdb_worker_contract.ts

export interface QueryResult {
    columns: string[];
    rows: any[];
    executionTimeMs: number;
}

export interface DuckDBWorkerContract {
    /**
     * Initializes the WASM engine. Called once.
     */
    init(): Promise<void>;

    /**
     * Registers a local File object directly with DuckDB.
     */
    registerFile(file: File, tableName: string): Promise<void>;

    /**
     * Executes a SQL query against the registered tables.
     * Returns a max of 1000 rows by default to prevent UI freezing.
     */
    query(sql: string, limit?: number): Promise<QueryResult>;

    /**
     * Returns schema information (column names and types) for a given table.
     */
    getSchema(tableName: string): Promise<Record<string, string>>;
}
```

## 3. Invariants for Jules
1. The Svelte UI **must only** import this type interface. It must never import the actual implementation from the worker file to avoid pulling WASM dependencies into the main UI bundle.
2. The Worker **must** implement this interface strictly.
3. Only primitive values, JSON-serializable objects, and `File`/`Blob` objects can be passed across the Comlink boundary. No DOM nodes or Svelte stores.
