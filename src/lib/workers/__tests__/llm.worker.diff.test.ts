import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from '../llm.worker';

// Mock comlink expose
vi.mock('comlink', () => ({
    expose: vi.fn()
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LLMService detectJoins', () => {
    let service: LLMService;

    beforeEach(() => {
        service = new LLMService();
        service.setApiKey('test-key', 'openai');
        mockFetch.mockReset();
    });

    it('should throw error if api key not set', async () => {
        service.setApiKey('', 'openai');
        await expect(service.detectJoins([])).rejects.toThrow('API key is not set');
    });

    it('should query openai and parse JSON successfully', async () => {
        const mockResponse = {
            choices: [
                {
                    message: {
                        content: '```json\n["table_1 ON table_1.id = table_2.table_1_id"]\n```'
                    }
                }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        } as any);

        const result = await service.detectJoins([
            { 'tableName': 'table_1', schema: { 'id': 'integer' } as any },
            { 'tableName': 'table_2', schema: { 'table_1_id': 'integer' } as any }
        ] as any);

        expect(result).toEqual(['table_1 ON table_1.id = table_2.table_1_id']);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle anthropic api', async () => {
        service.setApiKey('test-key', 'anthropic');
        const mockResponse = {
            content: [
                {
                    text: '["table_1 ON table_1.id = table_2.table_1_id"]'
                }
            ]
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        } as any);

        const result = await service.detectJoins([
            { 'tableName': 'table_1', schema: { 'id': 'integer' } as any },
            { 'tableName': 'table_2', schema: { 'table_1_id': 'integer' } as any }
        ] as any);

        expect(result).toEqual(['table_1 ON table_1.id = table_2.table_1_id']);
    });
});
