import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenCVService } from './opencv.worker';

// Mock comlink
vi.mock('comlink', () => ({
    expose: vi.fn(),
    wrap: vi.fn()
}));

// Provide minimal implementations for methods expected to be called during cv usage.
vi.mock('@techstark/opencv-js', () => {
    return {
        default: Promise.resolve({
            matFromImageData: vi.fn().mockReturnValue({
                cols: 100,
                rows: 100,
                type: () => 24, // CV_8UC4
                delete: vi.fn(),
                copyTo: vi.fn(),
                size: vi.fn().mockReturnValue({ width: 100, height: 100 }),
                data: new Uint8ClampedArray(40000)
            }),
            Mat: class { constructor() { return { cols: 100, rows: 100, type: () => 24, delete: vi.fn(), copyTo: vi.fn(), size: vi.fn().mockReturnValue({ width: 100, height: 100 }), data: new Uint8ClampedArray(40000), data32S: new Int32Array(100) }; } },

            Size: class { constructor() {} },
            Point: class { constructor() {} },
            Scalar: class { constructor() {} },
            cvtColor: vi.fn(),
            threshold: vi.fn(),
            HoughLinesP: vi.fn().mockImplementation((binary, lines) => {
                lines.rows = 2; // mock 2 lines to exercise deskew logic
                lines.data32S = new Int32Array([0, 0, 100, 10, 0, 10, 100, 20]);
            }),
            getRotationMatrix2D: vi.fn().mockReturnValue({ delete: vi.fn() }),
            warpAffine: vi.fn(),
            resize: vi.fn(),
            adaptiveThreshold: vi.fn(),
            getStructuringElement: vi.fn().mockReturnValue({ delete: vi.fn() }),
            morphologyEx: vi.fn(),
            CV_8UC1: 0,
            CV_8UC3: 16,
            COLOR_GRAY2RGBA: 0,
            COLOR_RGB2RGBA: 1,
            COLOR_RGBA2GRAY: 2,
            THRESH_BINARY_INV: 1,
            THRESH_OTSU: 8,
            INTER_LINEAR: 1,
            BORDER_REPLICATE: 1,
            INTER_CUBIC: 2,
            ADAPTIVE_THRESH_GAUSSIAN_C: 1,
            THRESH_BINARY: 0,
            MORPH_RECT: 0,
            MORPH_OPEN: 2
        })
    };
});

describe('OpenCVService', () => {
    let service: OpenCVService;
    let mockArrayBuffer: ArrayBuffer;

    beforeEach(() => {
        service = new OpenCVService();
        mockArrayBuffer = new ArrayBuffer(10);

        // Mock global web APIs used inside OpenCVService
        global.Blob = class { constructor() {} arrayBuffer() { return Promise.resolve(new ArrayBuffer(10)); } } as any;

        global.createImageBitmap = vi.fn().mockResolvedValue({
            width: 100,
            height: 100
        });

        global.OffscreenCanvas = class {
            constructor() {}
            getContext() {
                return {
                    drawImage: vi.fn(),
                    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(40000) }),
                    putImageData: vi.fn()
                };
            }
            convertToBlob() {
                return Promise.resolve(new Blob([]));
            }
        } as any;

        global.ImageData = class {
            data: any; width: any; height: any;
            constructor(arr: any, w: any, h: any) {
                this.data = arr;
                this.width = w;
                this.height = h;
            }
        } as any;
    });

    it('should initialize successfully', async () => {
        await service.init();
        expect(service).toBeDefined();
    });

    it('should run deskew without error', async () => {
        const result = await service.deskew(mockArrayBuffer);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(10);
    });

    it('should run enhance without error', async () => {
        const result = await service.enhance(mockArrayBuffer);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(10);
    });

    it('should run enhance_and_deskew without error', async () => {
        const result = await service.enhance_and_deskew(mockArrayBuffer);
        expect(result).toBeInstanceOf(ArrayBuffer);
        expect(result.byteLength).toBe(10);
    });
});
