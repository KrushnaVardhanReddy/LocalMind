import { describe, it, expect } from 'vitest';
import { VisualDiffService } from './visual-diff.worker';
import { PNG } from 'pngjs/browser';

describe('VisualDiffService', () => {
    it('should report 0% changed for identical images', async () => {
        const service = new VisualDiffService();

        const png = new PNG({ width: 10, height: 10 });
        for (let i = 0; i < png.data.length; i++) {
            png.data[i] = 255; // White square
        }

        const buffer = PNG.sync.write(png).buffer as ArrayBuffer;

        const result = await service.compare(buffer, buffer);

        expect(result.percentageChanged).toBe(0);
        expect(result.diffPixelCount).toBe(0);
        expect(result.totalPixels).toBe(100);
        expect(result.boundingBox).toBeNull();
    });

    it('should detect differences', async () => {
        const service = new VisualDiffService();

        const png1 = new PNG({ width: 10, height: 10 });
        for (let i = 0; i < png1.data.length; i++) {
            png1.data[i] = 255;
        }

        const png2 = new PNG({ width: 10, height: 10 });
        for (let i = 0; i < png2.data.length; i++) {
            png2.data[i] = i < 40 ? 0 : 255; // Black line on top
        }

        const buffer1 = PNG.sync.write(png1).buffer as ArrayBuffer;
        const buffer2 = PNG.sync.write(png2).buffer as ArrayBuffer;

        const result = await service.compare(buffer1, buffer2);

        expect(result.percentageChanged).toBeGreaterThan(0);
        expect(result.diffPixelCount).toBeGreaterThan(0);
        expect(result.boundingBox).not.toBeNull();
    });
});
