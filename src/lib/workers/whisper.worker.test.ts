import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhisperService } from './whisper.worker';

// Mock comlink
vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

// Mock wavefile
vi.mock('wavefile', () => ({
    WaveFile: class {
        constructor() {}
        toBitDepth() {}
        toSampleRate() {}
        getSamples() {
            return new Float32Array(16000); // 1 second of mock audio
        }
    }
}));

// Mock @xenova/transformers
vi.mock('@xenova/transformers', () => {
    return {
        env: {
            allowLocalModels: false,
            useBrowserCache: false,
            useFSCache: false
        },
        pipeline: vi.fn().mockResolvedValue(async (audioData: any, options: any) => {
            return {
                text: " This is a mock transcript.",
                chunks: [
                    { timestamp: [0, 1], text: " This is a mock transcript." }
                ]
            };
        })
    };
});

import { WorkerManager } from './WorkerManager';
vi.mock('./WorkerManager', () => ({
    WorkerManager: {
        getFFmpeg: vi.fn().mockResolvedValue({
            init: vi.fn(),
            extractAudio: vi.fn().mockResolvedValue(new ArrayBuffer(8))
        })
    }
}));

describe('WhisperService', () => {
    let service: WhisperService;

    beforeEach(() => {
        service = new WhisperService();
    });

    it('should initialize successfully with default tiny model', async () => {
        await service.init();
        expect(service['currentModel']).toBe('Xenova/whisper-tiny');
        expect(service['transcriber']).toBeDefined();
    });

    it('should initialize successfully with base model', async () => {
        await service.init('base');
        expect(service['currentModel']).toBe('Xenova/whisper-base');
    });

    it('should transcribe audio buffer correctly', async () => {
        await service.init();
        const inputBuffer = new ArrayBuffer(8); // Dummy buffer
        const result = await service.transcribe(inputBuffer);

        expect(result.text).toBe(" This is a mock transcript.");
        expect(result.chunks).toHaveLength(1);
        expect(result.chunks[0].text).toBe(" This is a mock transcript.");
        expect(result.chunks[0].timestamp).toEqual([0, 1]);
    });

        it('should throw if transcriber is not initialized', async () => {
        const inputBuffer = new ArrayBuffer(8);
        await expect(service.transcribe(inputBuffer)).rejects.toThrow("Whisper model not initialized.");
    });
});
