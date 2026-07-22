import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FFmpegService } from './ffmpeg.worker';

// Mock comlink as per rules
vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

// Mock @ffmpeg/ffmpeg
vi.mock('@ffmpeg/ffmpeg', () => {
    return {
        FFmpeg: class {
            loaded = false;
            on = vi.fn();
            load = vi.fn().mockResolvedValue(undefined);
            writeFile = vi.fn().mockResolvedValue(undefined);
            exec = vi.fn().mockResolvedValue(undefined);
            readFile = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
            deleteFile = vi.fn().mockResolvedValue(undefined);
        }
    };
});

// Since toBlobURL fetches, we'll mock the fetch globally or the utility
global.fetch = vi.fn().mockResolvedValue({
    blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/javascript' }))
});
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');

describe('FFmpegService', () => {
    let service: FFmpegService;

    beforeEach(() => {
        service = new FFmpegService();
    });

    it('should initialize successfully', async () => {
        await service.init();
        expect(service).toBeDefined();
    });

    it('should transcode video', async () => {
        const input = new ArrayBuffer(8);
        const result = await service.transcode(input, 'mov', 'mp4', {
            videoBitrate: '1M',
            resolution: '1280x720'
        });
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should extract audio', async () => {
        const input = new ArrayBuffer(8);
        const result = await service.extractAudio(input, 'mp3');
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should trim clip', async () => {
        const input = new ArrayBuffer(8);
        const result = await service.trimClip(input, 10, 20);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBeGreaterThan(0);
    });

    it('should generate thumbnail', async () => {
        const input = new ArrayBuffer(8);
        const result = await service.generateThumbnail(input, 5);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBeGreaterThan(0);
    });
});
