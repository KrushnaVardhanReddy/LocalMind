/**
 * Decodes a media file into an AudioBuffer.
 * Uses the Web Audio API's AudioContext.
 */
export async function decodeAudio(file: File): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    // Use an OfflineAudioContext to decode the audio without playing it
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
    });
    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } finally {
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
    }
}

/**
 * Chunks an AudioBuffer into smaller ArrayBuffers containing the raw Float32Array data.
 * @param audioBuffer The source AudioBuffer
 * @param chunkDurationSeconds The maximum duration of each chunk in seconds (default 5 minutes)
 */
export function chunkAudio(audioBuffer: AudioBuffer, chunkDurationSeconds: number = 300): ArrayBuffer[] {
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const totalSamples = audioBuffer.length;
    const maxSamplesPerChunk = sampleRate * chunkDurationSeconds;

    const chunks: ArrayBuffer[] = [];

    for (let startSample = 0; startSample < totalSamples; startSample += maxSamplesPerChunk) {
        const endSample = Math.min(startSample + maxSamplesPerChunk, totalSamples);
        const chunkSamples = endSample - startSample;

        // We only care about mono audio, if it's stereo we take average or just first channel
        // to simplify Float32Array generation for Whisper
        const channel1Data = audioBuffer.getChannelData(0);
        let chunkChannelData = channel1Data.slice(startSample, endSample);

        if (numChannels > 1) {
            const channel2Data = audioBuffer.getChannelData(1);
            const chunkChannel2Data = channel2Data.slice(startSample, endSample);
            // Average channels
            const merged = new Float32Array(chunkSamples);
            for (let i = 0; i < chunkSamples; i++) {
                merged[i] = (chunkChannelData[i] + chunkChannel2Data[i]) / 2.0;
            }
            chunkChannelData = merged;
        }

        // Return the ArrayBuffer of the typed array directly
        chunks.push(chunkChannelData.buffer);
    }

    return chunks;
}
