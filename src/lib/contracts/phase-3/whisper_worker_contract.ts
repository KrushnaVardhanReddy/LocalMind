export interface TranscriptChunk {
    timestamp: [number, number];
    text: string;
}

export interface TranscriptResult {
    text: string;
    chunks: TranscriptChunk[];
}

export interface WhisperWorkerContract {
    init(modelSize?: 'tiny' | 'base', progressCallback?: (data: any) => void): Promise<void>;
    transcribe(audioBuffer: ArrayBuffer): Promise<TranscriptResult>;
    onProgress?: (data: any) => void;
}
