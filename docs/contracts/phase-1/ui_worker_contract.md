# Phase 1: UI to Worker Message Contract

## 1. Overview
This contract defines the structured message passing protocol between the Main Thread (SvelteKit UI) and the Web Workers (specifically the DuckDB WASM worker). Since data cannot be passed by reference between threads, strict serialization or zero-copy transfers (SharedArrayBuffer/Transferable Objects) must be used.

## 2. Message Format

All messages should follow a standard envelope:

```typescript
type WorkerMessage<T = any> = {
  id: string;          // Unique request ID (UUID)
  action: ActionType;  // E.g., 'INIT', 'LOAD_FILE', 'EXECUTE_QUERY'
  payload: T;          // Action-specific data
};

type WorkerResponse<T = any> = {
  id: string;          // Matches the request ID
  status: 'SUCCESS' | 'ERROR';
  data?: T;            // Result payload on success
  error?: string;      // Error message on failure
};
```

## 3. Supported Actions

### 3.1 Initialize Worker
- **Action**: `INIT`
- **Request Payload**: `{ config?: { memoryLimit?: number } }`
- **Response Data**: `{ version: string, ready: boolean }`

### 3.2 Load Data File
- **Action**: `LOAD_FILE`
- **Request Payload**:
  ```typescript
  {
    tableName: string;
    fileFormat: 'CSV' | 'JSON' | 'PARQUET';
    file: File | ArrayBuffer; // Ideally passed as Transferable
  }
  ```
- **Response Data**: `{ rowCount: number, schema: ColumnSchema[] }`

### 3.3 Execute SQL Query
- **Action**: `EXECUTE_QUERY`
- **Request Payload**: `{ query: string, params?: any[] }`
- **Response Data**: `{ rows: any[], durationMs: number }`
  *(Note: Consider returning Arrow IPC format for large result sets to optimize serialization overhead).*

### 3.4 Cancel Query
- **Action**: `CANCEL_QUERY`
- **Request Payload**: `{ targetQueryId: string }`
- **Response Data**: `{ cancelled: boolean }`

### 3.5 Get Column Statistics
- **Action**: `GET_COLUMN_STATS`
- **Request Payload**: `{ tableName: string, columnName: string }`
- **Response Data**:
  ```typescript
  {
    min: number | string | null;
    max: number | string | null;
    mean: number | null;
    nullCount: number;
    uniqueValues: number;
  }
  ```
