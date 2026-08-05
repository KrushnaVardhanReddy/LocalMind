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
