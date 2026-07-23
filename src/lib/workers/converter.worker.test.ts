import { describe, it, expect, vi } from 'vitest';
import { ConverterService } from './converter.worker';

// Mock comlink to avoid environment errors in Node
vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

describe('ConverterService', () => {
    const converter = new ConverterService();

    describe('jsonToYaml', () => {
        it('should convert valid JSON to YAML', async () => {
            const jsonText = '{"name": "test", "value": 123}';
            const result = await converter.jsonToYaml(jsonText);
            expect(result.success).toBe(true);
            expect(result.data).toContain('name: test');
            expect(result.data).toContain('value: 123');
        });

        it('should return error for invalid JSON', async () => {
            const jsonText = '{"name": "test", "value": 123';
            const result = await converter.jsonToYaml(jsonText);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid JSON');
        });
    });

    describe('yamlToJson', () => {
        it('should convert valid YAML to JSON', async () => {
            const yamlText = 'name: test\nvalue: 123';
            const result = await converter.yamlToJson(yamlText);
            expect(result.success).toBe(true);

            const parsed = JSON.parse(result.data as string);
            expect(parsed).toEqual({ name: 'test', value: 123 });
        });

        it('should return error for invalid YAML', async () => {
            const yamlText = ': invalid: yaml:';
            const result = await converter.yamlToJson(yamlText);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid YAML');
        });
    });

    describe('jsonToXml', () => {
        it('should convert valid JSON to XML', async () => {
            const jsonText = '{"user": {"name": "test", "value": 123}}';
            const result = await converter.jsonToXml(jsonText);
            expect(result.success).toBe(true);
            expect(result.data).toContain('<user>');
            expect(result.data).toContain('<name>test</name>');
            expect(result.data).toContain('<value>123</value>');
            expect(result.data).toContain('</user>');
        });

        it('should wrap JSON without single root in root element', async () => {
             const jsonText = '{"name": "test", "value": 123}';
             const result = await converter.jsonToXml(jsonText, 'myroot');
             expect(result.success).toBe(true);
             expect(result.data).toContain('<myroot>');
             expect(result.data).toContain('<name>test</name>');
             expect(result.data).toContain('<value>123</value>');
             expect(result.data).toContain('</myroot>');
        });

        it('should return error for invalid JSON', async () => {
            const jsonText = '{"name": "test", "value": 123';
            const result = await converter.jsonToXml(jsonText);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid JSON');
        });
    });

    describe('xmlToJson', () => {
        it('should convert valid XML to JSON', async () => {
            const xmlText = '<root><name>test</name><value>123</value></root>';
            const result = await converter.xmlToJson(xmlText);
            expect(result.success).toBe(true);

            const parsed = JSON.parse(result.data as string);
            expect(parsed).toEqual({ root: { name: 'test', value: 123 } });
        });

        it('should return error for invalid XML', async () => {
            const xmlText = '<root><name>test</name><value>123</notroot>';
            const result = await converter.xmlToJson(xmlText);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid XML');
        });
    });
});
