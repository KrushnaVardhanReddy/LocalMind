import { pipeline, env } from '@huggingface/transformers';
import { expose } from 'comlink';

env.allowLocalModels = false;

export type PIIEntityType = 'PERSON' | 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'ADDRESS' | 'DATE_OF_BIRTH' | 'LOC' | 'ORG' | 'MISC';

export interface PIIEntity {
    type: PIIEntityType;
    text: string;
    startChar: number;
    endChar: number;
    confidence: number;
}

export interface NERWorkerContract {
    init(): Promise<void>;
    detectPII(text: string): Promise<PIIEntity[]>;
}

class NERService implements NERWorkerContract {
    private nerPipeline: any = null;
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        this.nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER', {
            quantized: true,
        } as any);

        this.isInitialized = true;
    }

    async detectPII(text: string): Promise<PIIEntity[]> {
        if (!this.isInitialized) {
            await this.init();
        }

        const results = await this.nerPipeline(text, {
            ignore_labels: ['O']
        });

        const entities: PIIEntity[] = results.map((r: any) => {
            let type: PIIEntityType = 'MISC';
            if (r.entity_group === 'PER' || r.entity === 'B-PER' || r.entity === 'I-PER') type = 'PERSON';
            else if (r.entity_group === 'LOC' || r.entity === 'B-LOC' || r.entity === 'I-LOC') type = 'LOC';
            else if (r.entity_group === 'ORG' || r.entity === 'B-ORG' || r.entity === 'I-ORG') type = 'ORG';
            else if (r.entity_group === 'MISC' || r.entity === 'B-MISC' || r.entity === 'I-MISC') type = 'MISC';

            return {
                type,
                text: r.word,
                startChar: r.start,
                endChar: r.end,
                confidence: r.score
            };
        });

        // Filter out types not strictly in the spec but useful, or map them out.
        // We'll keep them to match bert-base-NER but only select strict types for redaction later.

        entities.push(...this.detectRegexEntities(text));

        return entities;
    }

    private detectRegexEntities(text: string): PIIEntity[] {
        const regexEntities: PIIEntity[] = [];

        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
        let match;
        while ((match = emailRegex.exec(text)) !== null) {
            regexEntities.push({
                type: 'EMAIL',
                text: match[0],
                startChar: match.index,
                endChar: match.index + match[0].length,
                confidence: 1.0
            });
        }

        const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
        while ((match = phoneRegex.exec(text)) !== null) {
            regexEntities.push({
                type: 'PHONE',
                text: match[0],
                startChar: match.index,
                endChar: match.index + match[0].length,
                confidence: 0.9
            });
        }

        const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
        while ((match = ssnRegex.exec(text)) !== null) {
            regexEntities.push({
                type: 'SSN',
                text: match[0],
                startChar: match.index,
                endChar: match.index + match[0].length,
                confidence: 0.95
            });
        }

        return regexEntities;
    }
    }
}

expose(new NERService());
