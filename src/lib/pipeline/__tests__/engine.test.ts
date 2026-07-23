import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PipelineEngine } from '../engine';
import { WorkerManager } from '../../workers/WorkerManager';
import type { Node, Edge } from '@xyflow/svelte';

// Mock WorkerManager
vi.mock('../../workers/WorkerManager', () => {
    return {
        WorkerManager: {
            getConverter: vi.fn()
        }
    };
});

describe('PipelineEngine', () => {
    let engine: PipelineEngine;
    let mockConverter: any;

    beforeEach(() => {
        engine = new PipelineEngine();

        mockConverter = {
            formatJson: vi.fn(),
            minifyJson: vi.fn(),
            jsonToYaml: vi.fn(),
            yamlToJson: vi.fn(),
            jsonToXml: vi.fn(),
            xmlToJson: vi.fn(),
            gzip: vi.fn(),
            gunzip: vi.fn()
        };

        (WorkerManager.getConverter as any).mockResolvedValue(mockConverter);
    });

    it('should sort nodes topologically', async () => {
        const nodes: Node[] = [
            { id: '3', type: 'output', data: { label: 'Out' }, position: { x: 0, y: 0 } },
            { id: '1', type: 'input', data: { label: 'In' }, position: { x: 0, y: 0 } },
            { id: '2', type: 'url_encode', data: { label: 'Encode' }, position: { x: 0, y: 0 } }
        ];

        const edges: Edge[] = [
            { id: 'e2-3', source: '2', target: '3' },
            { id: 'e1-2', source: '1', target: '2' }
        ];

        // Access private method for testing
        const sorted = (engine as any).topologicalSort(nodes, edges);
        expect(sorted).toEqual(['1', '2', '3']);
    });

    it('should detect cycles in topological sort', () => {
        const nodes: Node[] = [
            { id: '1', type: 'input', data: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'url_encode', data: {}, position: { x: 0, y: 0 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-1', source: '2', target: '1' }
        ];

        const sorted = (engine as any).topologicalSort(nodes, edges);
        expect(sorted).toBeNull();
    });

    it('should execute synchronous nodes (URL Encode/Decode)', async () => {
        const nodes: Node[] = [
            { id: '1', type: 'input', data: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'url_encode', data: {}, position: { x: 0, y: 0 } },
            { id: '3', type: 'output', data: {}, position: { x: 0, y: 0 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ];

        const result = await engine.execute(nodes, edges, 'hello world!');
        expect(result.success).toBe(true);
        expect(result.output).toBe('hello%20world!');
    });

    it('should execute regex extract', async () => {
        const nodes: Node[] = [
            { id: '1', type: 'input', data: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'regex_extract', data: { config: { regexPattern: 'ERR.*' } }, position: { x: 0, y: 0 } },
            { id: '3', type: 'output', data: {}, position: { x: 0, y: 0 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ];

        const result = await engine.execute(nodes, edges, 'INFO 1\nERROR 2\nWARN 3');
        expect(result.success).toBe(true);
        expect(result.output).toContain('ERROR 2');
    });

    it('should route CPU-intensive nodes to worker', async () => {
        const nodes: Node[] = [
            { id: '1', type: 'input', data: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'json_format', data: {}, position: { x: 0, y: 0 } },
            { id: '3', type: 'output', data: {}, position: { x: 0, y: 0 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ];

        mockConverter.formatJson.mockResolvedValue({ success: true, data: '{\n  "a": 1\n}' });

        const result = await engine.execute(nodes, edges, '{"a":1}');
        expect(result.success).toBe(true);
        expect(result.output).toBe('{\n  "a": 1\n}');
        expect(mockConverter.formatJson).toHaveBeenCalledWith('{"a":1}');
    });

    it('should handle node errors gracefully', async () => {
        const nodes: Node[] = [
            { id: '1', type: 'input', data: {}, position: { x: 0, y: 0 } },
            { id: '2', type: 'json_format', data: {}, position: { x: 0, y: 0 } },
            { id: '3', type: 'output', data: {}, position: { x: 0, y: 0 } }
        ];
        const edges: Edge[] = [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' }
        ];

        mockConverter.formatJson.mockRejectedValue(new Error('Invalid JSON'));

        const result = await engine.execute(nodes, edges, 'bad json');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid JSON');
    });
});