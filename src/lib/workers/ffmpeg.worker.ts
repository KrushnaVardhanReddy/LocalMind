import { expose } from 'comlink';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { FFmpegWorkerContract, FFmpegOptions } from '$lib/contracts/phase-3/ffmpeg_worker_contract';

export class FFmpegService implements FFmpegWorkerContract {
    private ffmpeg: FFmpeg;
    public onProgress?: (ratio: number) => void;

    constructor() {
        this.ffmpeg = new FFmpeg();
        this.ffmpeg.on('progress', ({ progress }) => {
            if (this.onProgress) {
                this.onProgress(progress);
            }
        });
    }

    async init(): Promise<void> {
        if (this.ffmpeg.loaded) return;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
        await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
        });
    }

    private async executeFFmpegCommand(
        inputName: string,
        inputBuffer: ArrayBuffer,
        outputName: string,
        args: string[]
    ): Promise<ArrayBuffer> {
        await this.ffmpeg.writeFile(inputName, new Uint8Array(inputBuffer));
        await this.ffmpeg.exec(args);
        const data = await this.ffmpeg.readFile(outputName);

        await this.ffmpeg.deleteFile(inputName);
        await this.ffmpeg.deleteFile(outputName);

        const uint8Array = data as Uint8Array;
        return uint8Array.buffer.slice(uint8Array.byteOffset, uint8Array.byteOffset + uint8Array.byteLength) as ArrayBuffer;
    }

    async transcode(inputBuffer: ArrayBuffer, inputExt: string, outputExt: string, options?: FFmpegOptions): Promise<ArrayBuffer> {
        const inputName = `input.${inputExt}`;
        const outputName = `output.${outputExt}`;

        const args = ['-i', inputName];

        if (options?.videoBitrate) {
            args.push('-b:v', options.videoBitrate);
        }
        if (options?.audioBitrate) {
            args.push('-b:a', options.audioBitrate);
        }
        if (options?.resolution) {
            args.push('-s', options.resolution);
        }
        if (options?.fps) {
            args.push('-r', options.fps.toString());
        }

        args.push(outputName);

        return this.executeFFmpegCommand(inputName, inputBuffer, outputName, args);
    }

    async extractAudio(videoBuffer: ArrayBuffer, outputExt: 'mp3' | 'wav' | 'ogg'): Promise<ArrayBuffer> {
        const inputName = 'input.video';
        const outputName = `output.${outputExt}`;
        const args = ['-i', inputName, '-vn']; // -vn ignores video

        if (outputExt === 'mp3') {
            args.push('-acodec', 'libmp3lame');
        } else if (outputExt === 'wav') {
            args.push('-acodec', 'pcm_s16le'); // Typical WAV codec
        } else if (outputExt === 'ogg') {
            args.push('-acodec', 'libvorbis');
        }

        args.push(outputName);

        return this.executeFFmpegCommand(inputName, videoBuffer, outputName, args);
    }

    async trimClip(inputBuffer: ArrayBuffer, startSeconds: number, endSeconds: number): Promise<ArrayBuffer> {
        const inputName = 'input.video';
        const outputName = 'output.mp4';
        const args = [
            '-ss', startSeconds.toString(),
            '-i', inputName,
            '-to', (endSeconds - startSeconds).toString(), // -to duration
            '-c', 'copy', // Stream copy for speed if no transcode is needed
            outputName
        ];

        return this.executeFFmpegCommand(inputName, inputBuffer, outputName, args);
    }

    async generateThumbnail(videoBuffer: ArrayBuffer, atSeconds: number): Promise<ArrayBuffer> {
        const inputName = 'input.video';
        const outputName = 'output.png';
        const args = [
            '-ss', atSeconds.toString(),
            '-i', inputName,
            '-vframes', '1',
            outputName
        ];

        return this.executeFFmpegCommand(inputName, videoBuffer, outputName, args);
    }
}

expose(new FFmpegService());

async function toBlobURL(url: string, type: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return URL.createObjectURL(new Blob([blob], { type }));
}
