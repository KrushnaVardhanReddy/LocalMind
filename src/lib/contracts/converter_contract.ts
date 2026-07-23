export interface ConverterResult {
    success: boolean;
    data?: string | Uint8Array;
    error?: string;
}

export interface ConverterWorkerContract {
    jsonToYaml(jsonText: string): Promise<ConverterResult>;
    yamlToJson(yamlText: string): Promise<ConverterResult>;
    jsonToXml(jsonText: string, rootElement?: string): Promise<ConverterResult>;
    xmlToJson(xmlText: string): Promise<ConverterResult>;
    gzip(data: string | Uint8Array): Promise<ConverterResult>;
    gunzip(data: Uint8Array): Promise<ConverterResult>;
    formatJson(jsonText: string): Promise<ConverterResult>;
    minifyJson(jsonText: string): Promise<ConverterResult>;
}
