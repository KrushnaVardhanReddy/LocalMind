export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  entrypoints: {
    [key: string]: {
      description: string;
      input: string;
      output: string;
    };
  };
  permissions: string[];
  wasm_file: string;
}

export interface CustomPluginContract {
  init(): Promise<void>;
  process(inputBuffer: ArrayBuffer): Promise<ArrayBuffer>;
  getMetadata(): Promise<PluginManifest>;
}
