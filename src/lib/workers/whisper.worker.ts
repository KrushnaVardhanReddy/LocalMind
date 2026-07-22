import { pipeline, env } from '@xenova/transformers';
import { expose } from 'comlink';
import { WaveFile } from 'wavefile';
import type { WhisperWorkerContract, TranscriptResult } from '$lib/contracts/phase-3/whisper_worker_contract';

env.allowLocalModels = false;
env.useBrowserCache = false;
env.useFSCache = false;

export class WhisperService implements WhisperWorkerContract {
    private transcriber: any = null;
    private currentModel: string = '';
    public onProgress?: (data: any) => void;

    async init(modelSize: 'tiny' | 'base' = 'tiny', progressCallback?: (data: any) => void) {
        const modelName = `Xenova/whisper-${modelSize}`;
        if (this.transcriber && this.currentModel === modelName) return;

        this.transcriber = await pipeline('automatic-speech-recognition', modelName, {
            quantized: true,
            progress_callback: progressCallback || ((data: any) => {
                if (this.onProgress) {
                    this.onProgress(data);
                }
            })
        });
        this.currentModel = modelName;
    }

    async transcribe(audioBuffer: ArrayBuffer): Promise<TranscriptResult> {
        if (!this.transcriber) {
            throw new Error("Whisper model not initialized.");
        }

        let processBuffer = audioBuffer;

        const wav = new WaveFile(new Uint8Array(processBuffer));
        wav.toBitDepth('32f');
        wav.toSampleRate(16000);

        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            if (audioData.length > 1) {
                // If it's stereo, convert to mono by taking average
                const SCALING_FACTOR = Math.sqrt(2);
                for (let i = 0; i < audioData[0].length; ++i) {
                    audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2;
                }
            }
            audioData = audioData[0];
        }

        const output = await this.transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: true,
        });

        return {
            text: output.text,
            chunks: output.chunks
        };
    }
}

expose(new WhisperService());
