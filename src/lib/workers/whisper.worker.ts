import { expose } from 'comlink';

export class WhisperService {
    async init() {}
}

expose(new WhisperService());
