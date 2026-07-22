import { describe, it, expect } from 'vitest';
import { DataGenService } from '../datagen.worker';

describe('DataGenService', () => {
    it('should generate realistic data based on json schema', async () => {
        const service = new DataGenService();
        const schema = {
            type: 'object',
            properties: {
                email: { type: 'string', format: 'email' },
                age: { type: 'integer', minimum: 18, maximum: 65 }
            }
        };

        const result = await service.generateFromJsonSchema(schema, 2, 42); // deterministic seed
        expect(result.length).toBe(2);
        expect((result[0] as any).email).toBeDefined();
        expect(typeof (result[0] as any).age).toBe('number');
        expect((result[0] as any).age).toBeGreaterThanOrEqual(18);
        expect((result[0] as any).age).toBeLessThanOrEqual(65);
    });
});
