import { describe, it, expect } from 'vitest';
import { chunkAudio } from './AudioChunker';

describe('AudioChunker', () => {
    it('chunks a mock AudioBuffer into multiple Float32 ArrayBuffers', () => {
        // Create a mock AudioBuffer
        const sampleRate = 16000;
        const numberOfChannels = 1;
        const durationSeconds = 10;
        const totalSamples = sampleRate * durationSeconds;

        const mockChannelData = new Float32Array(totalSamples);
        for (let i = 0; i < totalSamples; i++) {
            mockChannelData[i] = Math.sin(i / 100); // Dummy audio data
        }

        const mockAudioBuffer = {
            sampleRate,
            numberOfChannels,
            length: totalSamples,
            getChannelData: (channel: number) => {
                if (channel !== 0) throw new Error("Invalid channel");
                return mockChannelData;
            }
        } as AudioBuffer;

        // Chunk into 4-second chunks
        // Expecting: 4s, 4s, 2s = 3 chunks
        const chunkDurationSeconds = 4;
        const chunks = chunkAudio(mockAudioBuffer, chunkDurationSeconds);

        expect(chunks).toHaveLength(3);

        // Verify the chunks are ArrayBuffers
        for (const chunk of chunks) {
            expect(chunk).toBeInstanceOf(ArrayBuffer);
            // Size should be > 0
            expect(chunk.byteLength).toBeGreaterThan(0);
        }

        // The first chunk should be exactly 4 seconds of samples (4 * 16000 = 64000 samples)
        // 64000 samples * 4 bytes per sample (32f) = 256,000 bytes
        expect(chunks[0].byteLength).toBe(256000);

        // The last chunk should be exactly 2 seconds of samples (2 * 16000 = 32000 samples)
        // 32000 * 4 = 128,000 bytes
        expect(chunks[2].byteLength).toBe(128000);
    });
});
