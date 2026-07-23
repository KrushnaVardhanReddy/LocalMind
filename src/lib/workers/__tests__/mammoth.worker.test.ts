import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MammothService } from '../mammoth.worker';

// Mock mammoth
vi.mock('mammoth', () => {
    return {
        default: {
            extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted DOCX text' })
        }
    };
});

describe('Mammoth Worker', () => {
    let service: MammothService;

    beforeEach(() => {
        service = new MammothService();
        vi.clearAllMocks();
    });

    it('should extract text from DOCX buffer', async () => {
        const dummyBuffer = new ArrayBuffer(10);
        const text = await service.extractText(dummyBuffer);
        expect(text).toBe('Extracted DOCX text');
    });
});
