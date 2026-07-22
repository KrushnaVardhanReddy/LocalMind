export interface FFmpegWorkerContract {
    init(): Promise<void>;
    transcode(inputBuffer: ArrayBuffer, inputExt: string, outputExt: string, options?: FFmpegOptions): Promise<ArrayBuffer>;
    extractAudio(videoBuffer: ArrayBuffer, outputExt: 'mp3' | 'wav' | 'ogg'): Promise<ArrayBuffer>;
    trimClip(inputBuffer: ArrayBuffer, startSeconds: number, endSeconds: number): Promise<ArrayBuffer>;
    generateThumbnail(videoBuffer: ArrayBuffer, atSeconds: number): Promise<ArrayBuffer>; // PNG
    onProgress?: (ratio: number) => void;
}

export interface FFmpegOptions {
    videoBitrate?: string; // e.g. '1M'
    audioBitrate?: string; // e.g. '128k'
    resolution?: string;   // e.g. '1280x720'
    fps?: number;
}
