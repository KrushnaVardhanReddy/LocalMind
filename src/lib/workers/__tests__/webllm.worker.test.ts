import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebLLMService } from '../webllm.worker';
import { CreateMLCEngine } from '@mlc-ai/web-llm';

vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

vi.mock('@mlc-ai/web-llm', () => ({
    CreateMLCEngine: vi.fn(),
}));

describe('WebLLMService Worker', () => {
    let service: WebLLMService;
    let mockEngine: any;

    beforeEach(() => {
        service = new WebLLMService();
        mockEngine = {
            unload: vi.fn().mockResolvedValue(undefined),
            chat: {
                completions: {
                    create: vi.fn(),
                },
            },
        };
        (CreateMLCEngine as any).mockResolvedValue(mockEngine);
    });

    it('should initialize and return the loaded model ID', async () => {
        const onProgress = vi.fn();
        await service.loadModel('Phi-3-mini-4k-instruct-q4', onProgress);

        expect(CreateMLCEngine).toHaveBeenCalledWith('Phi-3-mini-4k-instruct-q4', expect.any(Object));

        const loadedModel = await service.getLoadedModel();
        expect(loadedModel).toBe('Phi-3-mini-4k-instruct-q4');
    });

    it('should throw an error if chat is called before loading', async () => {
        await expect(async () => {
            await service.chat([{ role: 'user', content: 'hello' }]);
        }).rejects.toThrow('Model not loaded');
    });

    it('should generate chat completions sequentially', async () => {
        await service.loadModel('Phi-3-mini');

        async function* mockGenerator() {
            yield { choices: [{ delta: { content: 'Hel' } }] };
            yield { choices: [{ delta: { content: 'lo' } }] };
        }

        mockEngine.chat.completions.create.mockResolvedValue(mockGenerator());

        const chunks: string[] = [];
        await service.chat([{ role: 'user', content: 'hello' }], undefined, (token) => {
            chunks.push(token);
        });

        expect(chunks).toEqual(['Hel', 'lo']);
    });

    it('should unload the model and free memory', async () => {
        await service.loadModel('Phi-3-mini');
        await service.unloadModel();

        expect(mockEngine.unload).toHaveBeenCalled();
        const loadedModel = await service.getLoadedModel();
        expect(loadedModel).toBeNull();
    });
});
