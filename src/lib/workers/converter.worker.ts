import { expose } from 'comlink';
import * as yaml from 'js-yaml';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as pako from 'pako';

class ConverterService {
    async jsonToYaml(jsonText: string): Promise<string> {
        try {
            const parsed = JSON.parse(jsonText);
            return yaml.dump(parsed);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to convert JSON to YAML: ${e.message}`));
        }
    }

    async yamlToJson(yamlText: string): Promise<string> {
        try {
            const parsed = yaml.load(yamlText);
            return JSON.stringify(parsed, null, 2);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to convert YAML to JSON: ${e.message}`));
        }
    }

    async jsonToXml(jsonText: string): Promise<string> {
        try {
            const parsed = JSON.parse(jsonText);
            const builder = new XMLBuilder({ format: true });
            return builder.build(parsed);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to convert JSON to XML: ${e.message}`));
        }
    }

    async xmlToJson(xmlText: string): Promise<string> {
        try {
            const parser = new XMLParser();
            const parsed = parser.parse(xmlText);
            return JSON.stringify(parsed, null, 2);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to convert XML to JSON: ${e.message}`));
        }
    }

    async gzip(data: string | Uint8Array): Promise<Uint8Array> {
        try {
            let input: Uint8Array;
            if (typeof data === 'string') {
                input = new TextEncoder().encode(data);
            } else {
                input = data;
            }
            return pako.gzip(input);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to gzip: ${e.message}`));
        }
    }

    async gunzip(data: Uint8Array): Promise<Uint8Array> {
        try {
            return pako.ungzip(data);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to gunzip: ${e.message}`));
        }
    }

    async formatJson(jsonText: string): Promise<string> {
        try {
            const parsed = JSON.parse(jsonText);
            return JSON.stringify(parsed, null, 2);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to format JSON: ${e.message}`));
        }
    }

    async minifyJson(jsonText: string): Promise<string> {
        try {
            const parsed = JSON.parse(jsonText);
            return JSON.stringify(parsed);
        } catch (e: any) {
            return Promise.reject(new Error(`Failed to minify JSON: ${e.message}`));
        }
    }
}

expose(new ConverterService());