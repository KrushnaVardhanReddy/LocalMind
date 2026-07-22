import { expose } from 'comlink';

export class OpenCVService {
    async init() {}
}

expose(new OpenCVService());
