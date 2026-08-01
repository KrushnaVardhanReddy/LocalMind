# Contract: Phase 4 — DevTools Worker Interfaces

## 1. tree-sitter Code Analysis Worker Contract

```typescript
// docs/contracts/phase-4/treesitter_worker_contract.ts

export type SupportedLanguage =
    | 'typescript' | 'javascript' | 'python'
    | 'go' | 'rust' | 'c' | 'cpp' | 'java';

export interface CodeSymbol {
    kind: 'function' | 'class' | 'method' | 'import' | 'variable';
    name: string;
    startLine: number;
    endLine: number;
    complexity?: number; // cyclomatic complexity, if available
}

export interface ParseResult {
    language: SupportedLanguage;
    symbols: CodeSymbol[];
    lineCount: number;
    parseErrors: number;
    executionTimeMs: number;
}

export interface TreeSitterWorkerContract {
    /**
     * Loads the tree-sitter WASM core and the grammar for the specified language.
     * Must be called before parse(). Grammars are lazy-loaded per language.
     */
    loadLanguage(lang: SupportedLanguage): Promise<void>;

    /**
     * Parses a source file and extracts its symbol table.
     */
    parse(sourceCode: string, lang: SupportedLanguage): Promise<ParseResult>;

    /**
     * Auto-detects the language from the file extension and parses it.
     */
    parseFile(fileContent: string, fileName: string): Promise<ParseResult>;
}
```

## 2. Log Parser Worker Contract

```typescript
// docs/contracts/phase-4/log_parser_worker_contract.ts

export interface LogPattern {
    id: string;
    name: string;
    regex: string; // Named capture groups, e.g. (?<timestamp>\d+)
    columns: string[]; // Column names derived from capture groups
}

export interface LogParseResult {
    rowCount: number;
    columns: string[];
    sample: Record<string, string>[]; // First 100 parsed rows
    unmatchedLines: number;
    executionTimeMs: number;
}

export interface AnomalyCluster {
    centroid: string; // Representative log line for this cluster
    size: number;
    isAnomaly: boolean; // true if cluster is significantly smaller than others
    sampleLines: string[];
}

export interface LogParserWorkerContract {
    /**
     * Loads a raw log file into DuckDB as a text table.
     * Each line becomes a row with a single 'raw_line' column.
     */
    loadLog(logFile: File): Promise<{ lineCount: number }>;

    /**
     * Applies a regex pattern to the loaded log, creating a structured DuckDB view.
     * Returns a sample of the parsed output.
     */
    applyPattern(pattern: LogPattern): Promise<LogParseResult>;

    /**
     * Generates a regex pattern by analyzing a user-highlighted sample line.
     * Uses heuristics to identify timestamps, log levels, and message bodies.
     */
    suggestPattern(sampleLine: string): Promise<LogPattern>;

    /**
     * Clusters log lines using local embeddings + k-means.
     * Returns clusters sorted by size, with anomaly flags.
     */
    clusterAnomalies(maxClusters?: number): Promise<AnomalyCluster[]>;
}
```

## 3. Regex Tester Worker Contract

```typescript
// docs/contracts/phase-4/regex_worker_contract.ts

export interface RegexMatch {
    match: string;
    index: number;
    groups: Record<string, string>; // Named or indexed capture groups
}

export interface RegexExecutionResult {
    matches: RegexMatch[];
    executionTimeMs: number;
    timeout: boolean; // True if execution was halted due to excessive backtracking
}

export interface RegexWorkerContract {
    /**
     * Evaluates a regex pattern against a test string.
     * Enforces a hard timeout to prevent catastrophic backtracking from locking the worker.
     */
    evaluateRegex(pattern: string, flags: string, testString: string): Promise<RegexExecutionResult>;
}
```

## 4. jq Sandbox Worker Contract

```typescript
// docs/contracts/phase-4/jq_worker_contract.ts

export interface JqExecutionResult {
    output: string; // The formatted JSON string result
    executionTimeMs: number;
    error?: string; // Parse or execution errors
}

export interface JqWorkerContract {
    /**
     * Executes a jq or JSONPath query against a provided JSON string payload.
     * Evaluated entirely in WASM/JS within the worker.
     */
    executeQuery(query: string, payload: string, mode: 'jq' | 'jsonpath'): Promise<JqExecutionResult>;
}
```

## 5. Invariants for Jules
1. **No outbound requests.** All log analysis, clustering, and parsing is entirely local.
2. The `TreeSitterWorkerContract` must not load the grammar for a language until `loadLanguage()` is explicitly called.
3. `LogParserWorkerContract.loadLog()` must use the DuckDB WASM `registerFile()` path — never `FileReader.readAsText()`.
4. Anomaly clustering requires the embeddings model to be loaded — the `LogParserWorkerContract` internally uses the Embeddings worker from Phase 2 contracts via WorkerManager composition.
5. All regex strings in `LogPattern` must be validated before being passed to DuckDB to prevent injection via `REGEXP_EXTRACT`.
