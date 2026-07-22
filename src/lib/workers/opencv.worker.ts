import { expose } from 'comlink';
import cvInit from '@techstark/opencv-js';

// We need to keep a reference to the loaded cv module
let cv: any;

export class OpenCVService {
    async init() {
        if (!cv) {
            cv = await cvInit;
        }
    }

    private async arrayBufferToMat(buffer: ArrayBuffer): Promise<any> {
        const blob = new Blob([buffer]);
        const bmp = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bmp.width, bmp.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.drawImage(bmp, 0, 0);
        const imgData = ctx.getImageData(0, 0, bmp.width, bmp.height);
        return cv.matFromImageData(imgData);
    }

    private async matToArrayBuffer(mat: any): Promise<ArrayBuffer> {
        // Ensure mat is 4-channel RGBA for ImageData
        let rgbaMat = new cv.Mat();
        if (mat.type() === cv.CV_8UC1) {
            cv.cvtColor(mat, rgbaMat, cv.COLOR_GRAY2RGBA);
        } else if (mat.type() === cv.CV_8UC3) {
            cv.cvtColor(mat, rgbaMat, cv.COLOR_RGB2RGBA);
        } else {
            mat.copyTo(rgbaMat);
        }

        const imgData = new ImageData(new Uint8ClampedArray(rgbaMat.data), rgbaMat.cols, rgbaMat.rows);
        const canvas = new OffscreenCanvas(rgbaMat.cols, rgbaMat.rows);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.putImageData(imgData, 0, 0);

        const blob = await canvas.convertToBlob({ type: 'image/png' });
        rgbaMat.delete();
        return await blob.arrayBuffer();
    }

    async deskew(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        await this.init();
        const src = await this.arrayBufferToMat(imageBuffer);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Binarize using Otsu thresholding
        const binary = new cv.Mat();
        // Use cv.THRESH_BINARY_INV | cv.THRESH_OTSU
        cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);

        // Detect text lines via HoughLinesP
        const lines = new cv.Mat();
        cv.HoughLinesP(binary, lines, 1, Math.PI / 180, 100, 100, 10);

        let angles: number[] = [];
        for (let i = 0; i < lines.rows; i++) {
            const line = lines.data32S.subarray(i * 4, i * 4 + 4);
            const x1 = line[0], y1 = line[1], x2 = line[2], y2 = line[3];
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            // We only care about angles roughly horizontal
            if (angle > -45 && angle < 45) {
                angles.push(angle);
            }
        }

        let medianAngle = 0;
        if (angles.length > 0) {
            angles.sort((a, b) => a - b);
            medianAngle = angles[Math.floor(angles.length / 2)];
        }

        let dst = new cv.Mat();
        if (Math.abs(medianAngle) > 0.1) {
            // Compute median rotation angle and apply warpAffine rotation correction
            const center = new cv.Point(src.cols / 2, src.rows / 2);
            const M = cv.getRotationMatrix2D(center, medianAngle, 1);
            cv.warpAffine(src, dst, M, src.size(), cv.INTER_LINEAR, cv.BORDER_REPLICATE, new cv.Scalar(255, 255, 255, 255));
            M.delete();
        } else {
            src.copyTo(dst);
        }

        const outBuffer = await this.matToArrayBuffer(dst);

        src.delete();
        gray.delete();
        binary.delete();
        lines.delete();
        dst.delete();

        return outBuffer;
    }

    async enhance(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        await this.init();
        let src = await this.arrayBufferToMat(imageBuffer);

        // Optionally upscale to 300 DPI equivalent if image is small.
        // Let's assume standard width should be ~2000px for good OCR
        if (src.cols < 1500) {
            const scale = 2000 / src.cols;
            const newSize = new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale));
            const scaled = new cv.Mat();
            cv.resize(src, scaled, newSize, 0, 0, cv.INTER_CUBIC);
            src.delete();
            src = scaled;
        }

        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Apply adaptive thresholding (Gaussian, block size 11)
        const binary = new cv.Mat();
        // C constant usually around 2 for document OCR
        cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);

        // Apply morphological opening (2×2 kernel) to remove noise
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        const opened = new cv.Mat();
        cv.morphologyEx(binary, opened, cv.MORPH_OPEN, kernel);

        const outBuffer = await this.matToArrayBuffer(opened);

        src.delete();
        gray.delete();
        binary.delete();
        kernel.delete();
        opened.delete();

        return outBuffer;
    }

    async enhance_and_deskew(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        await this.init();
        const deskewed = await this.deskew(imageBuffer);
        return await this.enhance(deskewed);
    }
}

expose(new OpenCVService());
