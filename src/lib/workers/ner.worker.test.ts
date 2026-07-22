import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expose } from 'comlink';

vi.mock('comlink', () => ({
    expose: vi.fn()
}));

vi.mock('@huggingface/transformers', () => {
    return {
        env: { allowLocalModels: false },
        pipeline: vi.fn().mockResolvedValue(async (text: string) => {
            if (text.includes('John Doe')) {
                return [
                    { entity_group: 'PER', word: 'John', start: 0, end: 4, score: 0.99 },
                    { entity_group: 'PER', word: 'Doe', start: 5, end: 8, score: 0.99 }
                ];
            }
            return [];
        })
    };
});

describe('NER Worker', () => {
    let service: any;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();

        await import('./ner.worker.ts');

        // Extract the instantiated service from the mocked expose call
        const exposeCalls = vi.mocked(expose).mock.calls;
        service = exposeCalls[0][0];
    });

    it('should initialize and detect PERSON entities via Transformers', async () => {
        await service.init();
        const results = await service.detectPII('John Doe is here');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].type).toBe('PERSON');
        expect(results[0].text).toBe('John');
    });

    it('should detect EMAIL entities via Regex fallback', async () => {
        await service.init();
        const results = await service.detectPII('Contact test@example.com for info');

        const emailEntity = results.find((r: any) => r.type === 'EMAIL');
        expect(emailEntity).toBeDefined();
        expect(emailEntity?.text).toBe('test@example.com');
    });

    it('should detect PHONE entities via Regex fallback', async () => {
        await service.init();
        const results = await service.detectPII('Call me at 555-123-4567');

        const phoneEntity = results.find((r: any) => r.type === 'PHONE');
        expect(phoneEntity).toBeDefined();
        expect(phoneEntity?.text).toBe('555-123-4567');
    });

    it('should detect SSN entities via Regex fallback', async () => {
        await service.init();
        const results = await service.detectPII('My SSN is 123-45-6789');

        const ssnEntity = results.find((r: any) => r.type === 'SSN');
        expect(ssnEntity).toBeDefined();
        expect(ssnEntity?.text).toBe('123-45-6789');
    });
});
