import { expose } from 'comlink';
import * as yaml from 'js-yaml';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import * as pako from 'pako';

import { ConverterWorkerContract, ConverterResult } from '../contracts/converter_contract';

export type ConvertFormat = 'json' | 'yaml' | 'xml';

export class ConverterService implements ConverterWorkerContract {
    async jsonToYaml(jsonText: string): Promise<ConverterResult> {
        try {
            const obj = JSON.parse(jsonText);
            const data = yaml.dump(obj);
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: `Invalid JSON: ${e.message}` };
        }
    }

    async yamlToJson(yamlText: string): Promise<ConverterResult> {
        try {
            const obj = yaml.load(yamlText);
            if (obj === undefined) {
                 return { success: false, error: 'Invalid YAML: empty or unparseable' };
            }
            const data = JSON.stringify(obj, null, 2);
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: `Invalid YAML: ${e.message}` };
        }
    }

    async jsonToXml(jsonText: string, rootElement: string = 'root'): Promise<ConverterResult> {
        try {
            const obj = JSON.parse(jsonText);
            const builder = new XMLBuilder({ ignoreAttributes: false, format: true });

            let xmlObj = obj;
            if (typeof obj !== 'object' || obj === null) {
                xmlObj = { [rootElement]: obj };
            } else if (Array.isArray(obj) || Object.keys(obj).length !== 1) {
                xmlObj = { [rootElement]: obj };
            }

            const data = builder.build(xmlObj);
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: `Invalid JSON: ${e.message}` };
        }
    }

    async xmlToJson(xmlText: string): Promise<ConverterResult> {
        try {
            const validation = XMLValidator.validate(xmlText);
            if (validation !== true) {
                return { success: false, error: `Invalid XML: ${validation.err.msg} (Line: ${validation.err.line})` };
            }

            const parser = new XMLParser({ ignoreAttributes: false });
            const obj = parser.parse(xmlText);
            const data = JSON.stringify(obj, null, 2);
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: `Invalid XML: ${e.message}` };
        }
    }

    async gzip(data: string | Uint8Array): Promise<ConverterResult> {
        try {
            let input: Uint8Array;
            if (typeof data === 'string') {
                input = new TextEncoder().encode(data);
            } else {
                input = data;
            }
            return { success: true, data: pako.gzip(input) };
        } catch (e: any) {
            return { success: false, error: `Failed to gzip: ${e.message}` };
        }
    }

    async gunzip(data: Uint8Array): Promise<ConverterResult> {
        try {
            return { success: true, data: pako.ungzip(data) };
        } catch (e: any) {
            return { success: false, error: `Failed to gunzip: ${e.message}` };
        }
    }

    async formatJson(jsonText: string): Promise<ConverterResult> {
        try {
            const parsed = JSON.parse(jsonText);
            return { success: true, data: JSON.stringify(parsed, null, 2) };
        } catch (e: any) {
            return { success: false, error: `Failed to format JSON: ${e.message}` };
        }
    }

    async minifyJson(jsonText: string): Promise<ConverterResult> {
        try {
            const parsed = JSON.parse(jsonText);
            return { success: true, data: JSON.stringify(parsed) };
        } catch (e: any) {
            return { success: false, error: `Failed to minify JSON: ${e.message}` };
        }
    }
}

// Ensure expose only happens in worker context, and mock comlink in tests
if (typeof self !== 'undefined') {
    expose(new ConverterService());
}
