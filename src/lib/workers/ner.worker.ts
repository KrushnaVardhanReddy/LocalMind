import { expose } from 'comlink';

export class NERService {
    async init() {}
}

expose(new NERService());
