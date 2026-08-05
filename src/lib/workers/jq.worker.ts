import jq from 'jq-web';
import { JSONPath } from 'jsonpath-plus';
import { expose } from 'comlink';
import type { JqWorkerContract, JqExecutionResult } from '$lib/contracts/phase-4/jq_worker_contract';

export class JqService implements JqWorkerContract {
    async executeQuery(query: string, payload: string, mode: 'jq' | 'jsonpath'): Promise<JqExecutionResult> {
        const start = performance.now();
        let outputStr = '';
        let errorMsg;
        try {
            const parsedJson = JSON.parse(payload);
            let result;
            if (mode === 'jq') {
                result = jq.json(parsedJson, query);
            } else {
                result = JSONPath({ path: query, json: parsedJson });
            }
            outputStr = JSON.stringify(result, null, 2);
        } catch (e: any) {
            errorMsg = `Error: ${e.message || String(e)}`;
            outputStr = errorMsg;
        }
        const end = performance.now();

        return {
            output: outputStr,
            executionTimeMs: Math.round(end - start),
            error: errorMsg
        };
    }
}

expose(new JqService());
