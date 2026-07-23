import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogParserService } from '../log-parser.worker';

describe('LogParserWorkerContract', () => {
    let service: LogParserService;

    beforeEach(() => {
        service = new LogParserService();
    });

    it('suggestPattern generates correct timestamp regex', async () => {
        const line = '2023-10-15T10:00:00 INFO Initialized successfully';
        const result = await service.suggestPattern(line);

        expect(result.columns).toContain('timestamp');
        expect(result.columns).toContain('level');
        expect(result.columns).toContain('message');
        expect(result.regex).toContain('(?P<timestamp>');
        expect(result.regex).toContain('(?P<level>');
        expect(result.regex).toContain('(?P<message>');
    });

    it('suggestPattern handles arbitrary strings', async () => {
        const line = 'Just a random line without patterns';
        const result = await service.suggestPattern(line);

        expect(result.columns).toContain('message');
        expect(result.regex).toContain('(?P<message>');
    });

    it('clusterAnomalies throws if dependencies missing', async () => {
        await expect(service.clusterAnomalies()).rejects.toThrow('Dependencies not initialized');
    });

    it('applyPattern throws if db missing', async () => {
        await expect(service.applyPattern({ id: '1', name: 'Test', regex: '', columns: [] })).rejects.toThrow('DuckDB not initialized');
    });
});
