# Phase 4: UI-Worker Contract (Developer Workspace)

This contract defines communication for the Developer tooling workers.

## 1. Actions and Payloads

### 1.1 Code Parsing (tree-sitter WASM)
**Action**: `PARSE_CODE`
**Payload**:
```typescript
interface ParseCodePayload {
  code: string;
  language: 'javascript' | 'python' | 'go' | 'rust'; // etc
}
```
**Response Data**:
```typescript
interface ParseCodeResult {
  astJson: string;
  functions: { name: string; line: number }[];
  classes: { name: string; line: number }[];
}
```

### 1.2 Log Parsing (DuckDB WASM extension)
**Action**: `PARSE_LOGS`
**Payload**:
```typescript
interface ParseLogsPayload {
  logBuffer: ArrayBuffer;
  format: 'json' | 'nginx' | 'custom';
  regexPattern?: string; // If custom
}
```
**Response Data**:
```typescript
interface ParseLogsResult {
  tableName: string;
  rowCount: number;
}
```
