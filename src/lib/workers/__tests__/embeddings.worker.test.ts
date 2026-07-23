import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock comlink to avoid worker environment issues
vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

// Mock @xenova/transformers
vi.mock('@xenova/transformers', () => {
    return {
        env: {
            allowLocalModels: false,
            useBrowserCache: true
        },
        pipeline: vi.fn().mockResolvedValue(async (input: string | string[], options: any) => {
            if (Array.isArray(input)) {
                // Mock batch response
                // If 2 items are passed, return a tensor of shape [2, 384] with mock data
                const batchSize = input.length;
                const dim = 384;
                const mockData = new Float32Array(batchSize * dim);
                for (let i = 0; i < batchSize; i++) {
                    // Item 1: all 1s (unnormalized), Item 2: all 2s
                    const val = i === 0 ? 1 : 2;
                    for (let j = 0; j < dim; j++) {
                        mockData[i * dim + j] = val;
                    }
                }
                return { data: mockData };
            } else {
                // Mock single response
                const dim = 384;
                const mockData = new Float32Array(dim).fill(1);
                return { data: mockData };
            }
        })
    };
});

vi.mock('../db.utils', () => ({
    isAIEnabled: vi.fn().mockResolvedValue(true),
    setAIEnabled: vi.fn().mockResolvedValue(undefined),
    getAISettingsDB: vi.fn()
}));

import { EmbeddingsService } from '../embeddings.worker';

describe('EmbeddingsWorker', () => {
    let service: EmbeddingsService;

    beforeEach(async () => {
        service = new EmbeddingsService();
        await service.init();
    });

    it('embed() returns a normalized 384-d vector', async () => {
        const result = await service.embed("hello");
        expect(result.length).toBe(384);

        // Check L2 normalization (sum of squares should be close to 1)
        const sumSq = result.reduce((sum, val) => sum + val * val, 0);
        expect(sumSq).toBeCloseTo(1, 5);
    });

    it('embedBatch() handles multiple chunks and returns normalized vectors', async () => {
        const chunks = ["chunk 1", "chunk 2"];
        const results = await service.embedBatch(chunks);

        expect(results.length).toBe(2);
        expect(results[0].length).toBe(384);
        expect(results[1].length).toBe(384);

        // Both should be normalized
        const sumSq1 = results[0].reduce((sum, val) => sum + val * val, 0);
        expect(sumSq1).toBeCloseTo(1, 5);

        const sumSq2 = results[1].reduce((sum, val) => sum + val * val, 0);
        expect(sumSq2).toBeCloseTo(1, 5);
    });

    it('computeSimilarity() correctly calculates cosine similarities from Uint8Arrays', async () => {
        // Create float arrays and their corresponding byte buffers
        const v1 = [1.0, 0.5, -0.5, 0.0]; // query

        // chunk 1 matches perfectly
        const c1 = new Float32Array([1.0, 0.5, -0.5, 0.0]);
        // chunk 2 is orthogonal
        const c2 = new Float32Array([0.0, 0.0, 0.0, 1.0]);

        const blob1 = new Uint8Array(c1.buffer);
        const blob2 = new Uint8Array(c2.buffer);

        const similarities = await service.computeSimilarity(v1, [blob1, blob2]);

        expect(similarities.length).toBe(2);
        // dot product calculation: (1 * 1) + (0.5 * 0.5) + (-0.5 * -0.5) + (0 * 0) = 1 + 0.25 + 0.25 = 1.5
        expect(similarities[0]).toBeCloseTo(1.5);
        // orthogonal dot product should be 0
        expect(similarities[1]).toBeCloseTo(0);
    });
});
