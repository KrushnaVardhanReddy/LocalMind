import { WorkerManager } from '../workers/WorkerManager';
import type { NodeType } from './nodes';
import type { Node, Edge } from '@xyflow/svelte';

export interface PipelineExecutionResult {
    success: boolean;
    output: string | Uint8Array;
    error?: string;
    nodeExecutionLog: Array<{ nodeId: string; nodeType: NodeType; success: boolean; error?: string; durationMs: number }>;
}

export class PipelineEngine {
    /**
     * Executes the pipeline based on the provided nodes, edges, and initial input data.
     */
    async execute(
        nodes: Node[],
        edges: Edge[],
        initialInput: string | Uint8Array
    ): Promise<PipelineExecutionResult> {
        const executionLog: Array<{ nodeId: string; nodeType: NodeType; success: boolean; error?: string; durationMs: number }> = [];

        // 1. Sort nodes topologically
        const sortedNodeIds = this.topologicalSort(nodes, edges);
        if (!sortedNodeIds) {
            return {
                success: false,
                output: '',
                error: 'Pipeline contains a cycle or is invalid.',
                nodeExecutionLog: executionLog
            };
        }

        // 2. Map nodes by ID for easy access
        const nodesById = new Map(nodes.map(n => [n.id, n]));

        // 3. Track outputs of each node
        const nodeOutputs = new Map<string, string | Uint8Array>();

        // 4. Initialize converter worker for heavy tasks
        const converter = await WorkerManager.getConverter();

        // 5. Execute each node
        let currentInput = initialInput;

        for (const nodeId of sortedNodeIds) {
            const node = nodesById.get(nodeId);
            if (!node) continue;

            const nodeType = node.type as NodeType;
            if (!nodeType) continue;

            // Determine input for this node
            const incomingEdges = edges.filter(e => e.target === nodeId);
            if (incomingEdges.length > 0) {
                // For simplicity in a linear-ish pipeline, we take the output of the first connected source
                const sourceId = incomingEdges[0].source;
                const sourceOutput = nodeOutputs.get(sourceId);
                if (sourceOutput !== undefined) {
                    currentInput = sourceOutput;
                }
            } else if (nodeType !== 'input') {
                 // No incoming edges and not an input node... it has no data to process.
                 continue;
            }

            const startTime = performance.now();
            let success = true;
            let errorMsg = '';
            let currentOutput: string | Uint8Array = currentInput;

            try {
                if (nodeType === 'input') {
                    currentOutput = currentInput;
                } else if (nodeType === 'base64_decode') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for Base64 Decode');
                    try {
                        const decodedStr = decodeURIComponent(escape(atob(currentInput.trim())));
                        currentOutput = decodedStr;
                    } catch (e) {
                         // Fallback for binary data
                         const byteString = atob(currentInput.trim());
                         const ab = new ArrayBuffer(byteString.length);
                         const ia = new Uint8Array(ab);
                         for (let i = 0; i < byteString.length; i++) {
                             ia[i] = byteString.charCodeAt(i);
                         }
                         currentOutput = ia;
                    }
                } else if (nodeType === 'base64_encode') {
                    if (typeof currentInput === 'string') {
                        currentOutput = btoa(unescape(encodeURIComponent(currentInput)));
                    } else {
                        // Binary to base64
                        const binary = String.fromCharCode(...currentInput);
                        currentOutput = btoa(binary);
                    }
                } else if (nodeType === 'url_decode') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for URL Decode');
                    currentOutput = decodeURIComponent(currentInput);
                } else if (nodeType === 'url_encode') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for URL Encode');
                    currentOutput = encodeURIComponent(currentInput);
                } else if (nodeType === 'jwt_decode') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for JWT Decode');
                    const parts = currentInput.split('.');
                    if (parts.length !== 3) throw new Error('Invalid JWT format');
                    const header = JSON.parse(atob(parts[0]));
                    const payload = JSON.parse(atob(parts[1]));
                    currentOutput = JSON.stringify({ header, payload }, null, 2);
                } else if (nodeType === 'regex_extract') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for Regex Extract');
                    const config = node.data?.config as any;
                    const patternStr = config?.regexPattern || '';
                    if (!patternStr) throw new Error('Missing Regex Pattern configuration');

                    const regex = new RegExp(patternStr, 'g');
                    const matches = [...currentInput.matchAll(regex)];
                    currentOutput = JSON.stringify(matches.map(m => m[0]), null, 2);

                } else if (nodeType === 'json_format') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for JSON Format');
                    currentOutput = await converter.formatJson(currentInput);
                } else if (nodeType === 'json_minify') {
                    if (typeof currentInput !== 'string') throw new Error('Expected string input for JSON Minify');
                    currentOutput = await converter.minifyJson(currentInput);
                } else if (nodeType === 'yaml_to_json') {
                     if (typeof currentInput !== 'string') throw new Error('Expected string input for YAML to JSON');
                     currentOutput = await converter.yamlToJson(currentInput);
                } else if (nodeType === 'json_to_yaml') {
                     if (typeof currentInput !== 'string') throw new Error('Expected string input for JSON to YAML');
                     currentOutput = await converter.jsonToYaml(currentInput);
                } else if (nodeType === 'xml_to_json') {
                     if (typeof currentInput !== 'string') throw new Error('Expected string input for XML to JSON');
                     currentOutput = await converter.xmlToJson(currentInput);
                } else if (nodeType === 'json_to_xml') {
                     if (typeof currentInput !== 'string') throw new Error('Expected string input for JSON to XML');
                     currentOutput = await converter.jsonToXml(currentInput);
                } else if (nodeType === 'gzip') {
                     currentOutput = await converter.gzip(currentInput);
                } else if (nodeType === 'gunzip') {
                     if (typeof currentInput === 'string') {
                         throw new Error('Expected Uint8Array input for gunzip');
                     }
                     const unzippedBytes = await converter.gunzip(currentInput);
                     currentOutput = new TextDecoder().decode(unzippedBytes);
                } else if (nodeType === 'output') {
                    currentOutput = currentInput;
                } else {
                    throw new Error(`Unsupported node type: ${nodeType}`);
                }

            } catch (e: any) {
                success = false;
                errorMsg = e.message || 'Unknown error';
                currentOutput = `Error at node ${node.data?.label || nodeType}: ${errorMsg}`;
            }

            nodeOutputs.set(nodeId, currentOutput);

            executionLog.push({
                nodeId,
                nodeType,
                success,
                error: errorMsg,
                durationMs: performance.now() - startTime
            });

            if (!success) {
                return {
                    success: false,
                    output: currentOutput,
                    error: errorMsg,
                    nodeExecutionLog: executionLog
                };
            }
        }

        // Output is the output of the 'output' node, or the last node if no output node exists.
        const outputNode = nodes.find(n => n.type === 'output');
        let finalOutput: string | Uint8Array = '';

        if (outputNode && nodeOutputs.has(outputNode.id)) {
            finalOutput = nodeOutputs.get(outputNode.id)!;
        } else if (sortedNodeIds.length > 0) {
            finalOutput = nodeOutputs.get(sortedNodeIds[sortedNodeIds.length - 1])!;
        }

        return {
            success: true,
            output: finalOutput,
            nodeExecutionLog: executionLog
        };
    }

    /**
     * Performs a topological sort of the graph to determine execution order.
     * Returns an array of node IDs or null if a cycle is detected.
     */
    private topologicalSort(nodes: Node[], edges: Edge[]): string[] | null {
        const inDegree = new Map<string, number>();
        const graph = new Map<string, string[]>();

        nodes.forEach(node => {
            inDegree.set(node.id, 0);
            graph.set(node.id, []);
        });

        edges.forEach(edge => {
            if (graph.has(edge.source) && inDegree.has(edge.target)) {
                graph.get(edge.source)!.push(edge.target);
                inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
            }
        });

        const queue: string[] = [];
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }

        const sortedOrder: string[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            sortedOrder.push(current);

            for (const neighbor of graph.get(current)!) {
                inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            }
        }

        if (sortedOrder.length !== nodes.length) {
            return null; // Cycle detected
        }

        return sortedOrder;
    }
}