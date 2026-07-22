import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataGenService } from './datagen.worker';

// Mock comlink to prevent issues in the test environment (no self)
vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

describe('DataGenService', () => {
    let service: DataGenService;

    beforeEach(() => {
        service = new DataGenService();
    });

    describe('generateFromJsonSchema', () => {
        it('should generate requested number of rows', async () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };
            const rows = await service.generateFromJsonSchema(schema, 10);
            expect(rows).toHaveLength(10);
        });

        it('should generate correct data types based on schema', async () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    isActive: { type: 'boolean' },
                    name: { type: 'string' }
                }
            };
            const rows = await service.generateFromJsonSchema(schema, 1);
            const row: any = rows[0];

            expect(typeof row.id).toBe('number');
            expect(Number.isInteger(row.id)).toBe(true);
            expect(typeof row.isActive).toBe('boolean');
            expect(typeof row.name).toBe('string');
        });

        it('should generate semantically meaningful data for smart fields', async () => {
            const schema = {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    first_name: { type: 'string' }
                }
            };
            const rows = await service.generateFromJsonSchema(schema, 5);

            for (const row of rows as any[]) {
                expect(row.email).toContain('@');
                // Names generally start with capital letter in Faker
                expect(row.first_name[0]).toBe(row.first_name[0].toUpperCase());
            }
        });

        it('should produce identical results given the same seed', async () => {
            const schema = {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' }
                }
            };

            const run1 = await service.generateFromJsonSchema(schema, 5, 12345);
            const run2 = await service.generateFromJsonSchema(schema, 5, 12345);
            const runDifferentSeed = await service.generateFromJsonSchema(schema, 5, 99999);

            expect(run1).toEqual(run2);
            expect(run1).not.toEqual(runDifferentSeed);
        });
    });

    describe('generateFromSqlDDL', () => {
        it('should generate requested number of rows', async () => {
            const ddl = `CREATE TABLE users (id INT, name VARCHAR(100));`;
            const rows = await service.generateFromSqlDDL(ddl, 15);
            expect(rows).toHaveLength(15);
        });

        it('should parse DDL and generate correct data types', async () => {
            const ddl = `
                CREATE TABLE employees (
                    id INT PRIMARY KEY,
                    email VARCHAR(255),
                    is_active BOOLEAN,
                    score DECIMAL(5,2),
                    created_at TIMESTAMP
                );
            `;
            const rows = await service.generateFromSqlDDL(ddl, 1);
            const row: any = rows[0];

            // id column uses INT
            expect(typeof row.id).toBe('number');
            expect(Number.isInteger(row.id)).toBe(true);

            // email uses smart hints
            expect(typeof row.email).toBe('string');
            expect(row.email).toContain('@');

            // is_active uses BOOLEAN
            expect(typeof row.is_active).toBe('boolean');

            // score uses DECIMAL/FLOAT
            expect(typeof row.score).toBe('number');

            // created_at uses TIMESTAMP
            expect(typeof row.created_at).toBe('string');
            expect(new Date(row.created_at).getTime()).not.toBeNaN();
        });

        it('should produce identical results given the same seed', async () => {
            const ddl = `CREATE TABLE items (id INT, description TEXT);`;

            const run1 = await service.generateFromSqlDDL(ddl, 3, 42);
            const run2 = await service.generateFromSqlDDL(ddl, 3, 42);
            const runDifferentSeed = await service.generateFromSqlDDL(ddl, 3, 99);

            expect(run1).toEqual(run2);
            expect(run1).not.toEqual(runDifferentSeed);
        });

        it('should throw error on invalid DDL', async () => {
            const ddl = `NOT A VALID SQL STATEMENT`;
            await expect(service.generateFromSqlDDL(ddl, 1)).rejects.toThrow();
        });
    });
});