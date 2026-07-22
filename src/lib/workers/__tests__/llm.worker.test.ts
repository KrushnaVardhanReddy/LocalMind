import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMService } from '../llm.worker';

// Mock comlink expose so we can instantiate without errors
vi.mock('comlink', () => ({
    expose: vi.fn()
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LLMService', () => {
    let service: LLMService;

    beforeEach(() => {
        service = new LLMService();
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should throw an error if API key is not set', async () => {
        await expect(service.analyzeData('test', 'data')).rejects.toThrow('API key is not set');
    });

    it('should call OpenAI API correctly', async () => {
        service.setApiKey('test-key', 'openai');

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: 'Test insight' } }
                ]
            })
        });

        const result = await service.analyzeData('analyze this', '{"col1": "val1"}');

        expect(result).toBe('Test insight');
        expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-key'
            },
            body: expect.any(String)
        }));
    });

    it('should call Anthropic API correctly', async () => {
        service.setApiKey('test-key', 'anthropic');

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [
                    { text: 'Anthropic insight' }
                ]
            })
        });

        const result = await service.analyzeData('analyze this', '{"col1": "val1"}');

        expect(result).toBe('Anthropic insight');
        expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'test-key',
                'anthropic-version': '2023-06-01',
                'anthropic-dangerously-allow-browser': 'true'
            },
            body: expect.any(String)
        }));
    });

    it('should handle API errors', async () => {
        service.setApiKey('test-key', 'openai');

        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => 'Bad Request'
        });

        await expect(service.analyzeData('analyze this', '{"col1": "val1"}')).rejects.toThrow('OpenAI API error: 400 - Bad Request');
    });

    it('generateChartConfig should throw if API key is not set', async () => {
        await expect(service.generateChartConfig('test', {})).rejects.toThrow('API key is not set');
    });

    it('generateChartConfig should call OpenAI API and return parsed JSON', async () => {
        service.setApiKey('test-key', 'openai');

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [
                    { message: { content: '```json\n{"sql":"SELECT *","option":{}}\n```' } }
                ]
            })
        });

        const result = await service.generateChartConfig('make a chart', { col1: 'VARCHAR' });

        expect(result).toEqual({ sql: 'SELECT *', option: {} });
        expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
            method: 'POST'
        }));
    });

    it('generateChartConfig should call Anthropic API and return parsed JSON', async () => {
        service.setApiKey('test-key', 'anthropic');

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                content: [
                    { text: '{"sql":"SELECT *","option":{}}' }
                ]
            })
        });

        const result = await service.generateChartConfig('make a chart', { col1: 'VARCHAR' });

        expect(result).toEqual({ sql: 'SELECT *', option: {} });
        expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
            method: 'POST'
        }));
    });
});
