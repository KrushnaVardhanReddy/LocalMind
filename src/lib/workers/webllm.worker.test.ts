import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebLLMService } from './webllm.worker';

vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

vi.mock('@mlc-ai/web-llm', () => ({
    CreateMLCEngine: vi.fn().mockImplementation((modelId, config) => {
        if (config?.initProgressCallback) {
            config.initProgressCallback({ progress: 1, text: 'Done' });
        }
        return Promise.resolve({
            chat: {
                completions: {
                    create: vi.fn().mockImplementation((args) => {
                        if (args.stream) {
                            return (async function* () {
                                yield { choices: [{ delta: { content: 'Hello' } }] };
                                yield { choices: [{ delta: { content: ' World' } }] };
                            })();
                        }
                        return Promise.resolve({ choices: [{ message: { content: 'Hello World' } }] });
                    })
                }
            },
            unload: vi.fn().mockResolvedValue(undefined)
        });
    }),
}));

describe('WebLLMService', () => {
    let service: WebLLMService;

    beforeEach(() => {
        service = new WebLLMService();
    });

    it('loads model and gets loaded model id', async () => {
        let progress = 0;
        let text = '';
        await service.loadModel('test-model', (p, t) => {
            progress = p;
            text = t;
        });

        expect(progress).toBe(1);
        expect(text).toBe('Done');

        const loaded = await service.getLoadedModel();
        expect(loaded).toBe('test-model');
    });

    it('unloads model', async () => {
        await service.loadModel('test-model');
        await service.unloadModel();
        const loaded = await service.getLoadedModel();
        expect(loaded).toBeNull();
    });

    it('completes prompt', async () => {
        await service.loadModel('test-model');
        const result = await service.complete('Hi');
        expect(result).toBe('Hello World');
    });
});
