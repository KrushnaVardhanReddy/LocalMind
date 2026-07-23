export type NodeType =
    | 'input'         // Raw text / file input
    | 'base64_decode' | 'base64_encode'
    | 'json_format'   | 'json_minify'
    | 'yaml_to_json'  | 'json_to_yaml'
    | 'xml_to_json'   | 'json_to_xml'
    | 'gunzip'        | 'gzip'
    | 'url_decode'    | 'url_encode'
    | 'jwt_decode'
    | 'regex_extract' // Configurable: user inputs regex pattern
    | 'output';       // Final display panel

export interface PipelineNodeConfig {
    // Shared configurations or type-specific ones can go here
    regexPattern?: string; // For 'regex_extract'
}

export interface PipelineNodeDefinition {
    type: NodeType;
    label: string;
    description: string;
    category: 'Input/Output' | 'Encoding/Decoding' | 'Formatting' | 'Compression' | 'Text Processing';
}

export const NODE_DEFINITIONS: Record<NodeType, PipelineNodeDefinition> = {
    'input': {
        type: 'input',
        label: 'Input',
        description: 'Provide raw text or drop a file to start the pipeline.',
        category: 'Input/Output'
    },
    'output': {
        type: 'output',
        label: 'Output',
        description: 'Displays the final output of the pipeline.',
        category: 'Input/Output'
    },
    'base64_decode': {
        type: 'base64_decode',
        label: 'Base64 Decode',
        description: 'Decodes a Base64 encoded string.',
        category: 'Encoding/Decoding'
    },
    'base64_encode': {
        type: 'base64_encode',
        label: 'Base64 Encode',
        description: 'Encodes text or binary data into a Base64 string.',
        category: 'Encoding/Decoding'
    },
    'url_decode': {
        type: 'url_decode',
        label: 'URL Decode',
        description: 'Decodes a URL encoded string.',
        category: 'Encoding/Decoding'
    },
    'url_encode': {
        type: 'url_encode',
        label: 'URL Encode',
        description: 'Encodes a string for safe use in a URL.',
        category: 'Encoding/Decoding'
    },
    'jwt_decode': {
        type: 'jwt_decode',
        label: 'JWT Decode',
        description: 'Decodes a JSON Web Token.',
        category: 'Encoding/Decoding'
    },
    'json_format': {
        type: 'json_format',
        label: 'Format JSON',
        description: 'Pretty-prints JSON data.',
        category: 'Formatting'
    },
    'json_minify': {
        type: 'json_minify',
        label: 'Minify JSON',
        description: 'Compresses JSON data by removing whitespace.',
        category: 'Formatting'
    },
    'yaml_to_json': {
        type: 'yaml_to_json',
        label: 'YAML to JSON',
        description: 'Converts YAML data to JSON.',
        category: 'Formatting'
    },
    'json_to_yaml': {
        type: 'json_to_yaml',
        label: 'JSON to YAML',
        description: 'Converts JSON data to YAML.',
        category: 'Formatting'
    },
    'xml_to_json': {
        type: 'xml_to_json',
        label: 'XML to JSON',
        description: 'Converts XML data to JSON.',
        category: 'Formatting'
    },
    'json_to_xml': {
        type: 'json_to_xml',
        label: 'JSON to XML',
        description: 'Converts JSON data to XML.',
        category: 'Formatting'
    },
    'gzip': {
        type: 'gzip',
        label: 'Gzip',
        description: 'Compresses data using Gzip.',
        category: 'Compression'
    },
    'gunzip': {
        type: 'gunzip',
        label: 'Gunzip',
        description: 'Decompresses Gzip data.',
        category: 'Compression'
    },
    'regex_extract': {
        type: 'regex_extract',
        label: 'Regex Extract',
        description: 'Extracts matching strings based on a regex pattern.',
        category: 'Text Processing'
    }
};