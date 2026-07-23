import { expose } from 'comlink';
import mammoth from 'mammoth';

import type { MammothWorkerContract } from '../contracts/phase-2/mammoth_worker_contract';

export class MammothService implements MammothWorkerContract {
    async extractText(docxBuffer: ArrayBuffer): Promise<string> {
        try {
            const buffer = Buffer.from(docxBuffer);
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } catch (e: any) {
            throw new Error(`Failed to extract text from DOCX: ${e.message}`);
        }
    }
}

if (typeof self !== 'undefined') {
    expose(new MammothService());
}
