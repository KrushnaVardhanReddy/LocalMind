import { expose } from 'comlink';

export class FFmpegService {
    async init() {}
}

expose(new FFmpegService());
