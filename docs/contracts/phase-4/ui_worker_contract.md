# Phase 4: UI to Worker Message Contract

## 1. Overview
This contract defines message passing for Phase 4 workers: `treesitter` (code parsing and structure analysis). JSON/YAML validation and log analysis reuse the existing `duckdb` worker from Phase 1.

## 2. Message Envelope
Identical to Phase 1 (`docs/contracts/phase-1/ui_worker_contract.md`).

## 3. Tree-sitter Worker Actions

### 3.1 Initialize Tree-sitter
- **Action**: `INIT`
- **Request Payload**: `{ languages: string[] }` (e.g., `['typescript', 'python', 'rust']`)
- **Response Data**: `{ ready: boolean; loadedLanguages: string[] }`

### 3.2 Parse Source File
- **Action**: `PARSE`
- **Request Payload**: `{ sourceCode: string; language: string }`
- **Response Data**:
  ```typescript
  {
    functions: Array<{ name: string; startLine: number; endLine: number; params: string[] }>;
    classes: Array<{ name: string; startLine: number; endLine: number; methods: string[] }>;
    imports: Array<{ source: string; symbols: string[] }>;
    complexity: number; // McCabe cyclomatic complexity estimate
  }
  ```

### 3.3 Scan for Secrets
- **Action**: `SCAN_SECRETS`
- **Request Payload**: `{ content: string; filename: string }`
- **Response Data**:
  ```typescript
  {
    findings: Array<{
      type: string;       // e.g., 'AWS_ACCESS_KEY', 'GITHUB_TOKEN', 'GENERIC_API_KEY'
      match: string;      // The matched pattern (partially redacted for display)
      lineNumber: number;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    }>
  }
  ```

### 3.4 Decode JWT
- **Action**: `DECODE_JWT`
- **Request Payload**: `{ token: string }`
- **Response Data**:
  ```typescript
  {
    header: Record<string, any>;
    payload: Record<string, any>;
    isExpired: boolean;
    expiresAt?: string; // ISO 8601
    algorithm: string;
    signatureVerifiable: false; // Always false — we never have the private key. Display only.
  }
  ```

## 4. DuckDB Worker Reuse for Log Analysis
Log analysis reuses the Phase 1 `LOAD_FILE` and `EXECUTE_QUERY` actions via the existing `duckdb` worker. No new worker actions needed — logs are treated as structured data files (JSON/CSV log format).
