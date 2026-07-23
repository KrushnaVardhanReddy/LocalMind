import { expose } from 'comlink';
import { PNG } from 'pngjs/browser';
import pixelmatch from 'pixelmatch';
import { Buffer } from 'buffer';

export interface VisualDiffResult {
    diffPixelCount: number;
    totalPixels: number;
    percentageChanged: number;
    diffImageBuffer: ArrayBuffer;
    boundingBox: { x: number; y: number; width: number; height: number } | null;
    diffWidth: number;
    diffHeight: number;
}

export interface VisualDiffWorkerContract {
    compare(imageA: ArrayBuffer, imageB: ArrayBuffer, threshold?: number): Promise<VisualDiffResult>;
}

export class VisualDiffService implements VisualDiffWorkerContract {
    public async compare(imageA: ArrayBuffer, imageB: ArrayBuffer, threshold: number = 0.1): Promise<VisualDiffResult> {
        const pngA = PNG.sync.read(Buffer.from(imageA) as any);
        const pngB = PNG.sync.read(Buffer.from(imageB) as any);

        const width = Math.max(pngA.width, pngB.width);
        const height = Math.max(pngA.height, pngB.height);

        const createPaddedData = (png: PNG) => {
            if (png.width === width && png.height === height) {
                return png.data;
            }
            const data = new Uint8Array(width * height * 4);
            for (let y = 0; y < png.height; y++) {
                for (let x = 0; x < png.width; x++) {
                    const srcIdx = (png.width * y + x) << 2;
                    const dstIdx = (width * y + x) << 2;
                    data[dstIdx] = png.data[srcIdx];
                    data[dstIdx + 1] = png.data[srcIdx + 1];
                    data[dstIdx + 2] = png.data[srcIdx + 2];
                    data[dstIdx + 3] = png.data[srcIdx + 3];
                }
            }
            return data;
        };

        const dataA = createPaddedData(pngA);
        const dataB = createPaddedData(pngB);
        const diffData = new Uint8Array(width * height * 4);

        const diffPixelCount = pixelmatch(dataA, dataB, diffData, width, height, { threshold });

        const totalPixels = width * height;
        const percentageChanged = totalPixels > 0 ? (diffPixelCount / totalPixels) * 100 : 0;

        let boundingBox = null;
        if (diffPixelCount > 0) {
            let minX = width, minY = height, maxX = 0, maxY = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = (width * y + x) << 2;
                    if (diffData[idx] === 255 && diffData[idx + 1] === 0 && diffData[idx + 2] === 0) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (minX <= maxX && minY <= maxY) {
                boundingBox = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
            }
        }

        const diffPng = new PNG({ width, height });
        diffPng.data = diffData as any;
        const diffImageBuffer = PNG.sync.write(diffPng).buffer as ArrayBuffer;

        return {
            diffPixelCount,
            totalPixels,
            percentageChanged,
            diffImageBuffer,
            boundingBox,
            diffWidth: width,
            diffHeight: height
        };
    }
}

expose(new VisualDiffService());
