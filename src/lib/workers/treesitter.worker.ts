import * as comlink from 'comlink';
import { Parser, Language, Node, Query } from 'web-tree-sitter';

export type SupportedLanguage =
    | 'typescript' | 'javascript' | 'python'
    | 'go' | 'rust' | 'c' | 'cpp' | 'java';

export interface CodeSymbol {
    kind: 'function' | 'class' | 'method' | 'import' | 'variable';
    name: string;
    startLine: number;
    endLine: number;
    complexity?: number;
}

export interface ParseResult {
    language: SupportedLanguage;
    symbols: CodeSymbol[];
    lineCount: number;
    parseErrors: number;
    executionTimeMs: number;
}

export interface TreeSitterWorkerContract {
    loadLanguage(lang: SupportedLanguage): Promise<void>;
    parse(sourceCode: string, lang: SupportedLanguage): Promise<ParseResult>;
    parseFile(fileContent: string, fileName: string): Promise<ParseResult>;
}

// Ensure the contract is implemented
class TreeSitterWorker implements TreeSitterWorkerContract {
    private parser: any = null;
    private languages = new Map<string, Language>();
    private queries = new Map<string, string>();

    private async initParser() {
        if (!this.parser) {
            await Parser.init({
                locateFile(scriptName: string, scriptDirectory: string) {
                    return `/${scriptName}`;
                }
            });
            this.parser = new Parser();
        }
    }

    public async loadLanguage(lang: SupportedLanguage): Promise<void> {
        await this.initParser();

        if (this.languages.has(lang)) {
            return;
        }

        let wasmFile = lang as string;
        if (lang === 'typescript') wasmFile = 'typescript';
        if (lang === 'javascript') wasmFile = 'javascript';
        if (lang === 'python') wasmFile = 'python';
        if (lang === 'go') wasmFile = 'go';
        if (lang === 'java') wasmFile = 'java';
        if (lang === 'rust') wasmFile = 'rust';
        if (lang === 'c') wasmFile = 'c';
        if (lang === 'cpp') wasmFile = 'cpp';

        const url = `/grammars/tree-sitter-${wasmFile}.wasm`;

        try {
            const language = await Language.load(url);
            this.languages.set(lang, language);

            // Try to load query file
            try {
                // We use dynamic import for the raw text of the query
                const queryModule = await import(`./treesitter-queries/${lang}.scm?raw`);
                this.queries.set(lang, queryModule.default);
            } catch (queryErr) {
                console.warn(`Could not load query for ${lang}:`, queryErr);
                this.queries.set(lang, "");
            }
        } catch (e) {
            console.error(`Failed to load grammar for ${lang} from ${url}`, e);
            throw e;
        }
    }

    private detectLanguage(fileName: string): SupportedLanguage | null {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'ts':
            case 'tsx':
                return 'typescript';
            case 'js':
            case 'jsx':
                return 'javascript';
            case 'py':
                return 'python';
            case 'go':
                return 'go';
            case 'java':
                return 'java';
            case 'rs':
                return 'rust';
            case 'c':
            case 'h':
                return 'c';
            case 'cpp':
            case 'hpp':
            case 'cc':
            case 'cxx':
                return 'cpp';
            default:
                return null;
        }
    }

    private calculateComplexity(node: Node): number {
        let complexity = 1;
        const cursor = node.walk();

        const visit = () => {
            const type = cursor.nodeType;
            if (
                type === 'if_statement' ||
                type === 'for_statement' ||
                type === 'while_statement' ||
                type === 'catch_clause' ||
                type === 'ternary_expression' ||
                type === '&&' ||
                type === '||' ||
                type === 'case_statement' ||
                type === 'match_arm' // rust
            ) {
                complexity++;
            }

            if (cursor.gotoFirstChild()) {
                do {
                    visit();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };

        visit();
        return complexity;
    }

    public async parse(sourceCode: string, lang: SupportedLanguage): Promise<ParseResult> {
        const startTime = performance.now();

        if (!this.parser) {
            throw new Error("Parser not initialized. Call loadLanguage first.");
        }

        const language = this.languages.get(lang);
        if (!language) {
            throw new Error(`Language ${lang} not loaded.`);
        }

        this.parser.setLanguage(language);

        const tree = this.parser.parse(sourceCode);

        let parseErrors = 0;
        const cursor = tree.walk();
        const countErrors = () => {
            if (cursor.nodeType === 'ERROR' || cursor.nodeType === 'MISSING') {
                parseErrors++;
            }
            if (cursor.gotoFirstChild()) {
                do {
                    countErrors();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        countErrors();

        const symbols: CodeSymbol[] = [];
        const queryString = this.queries.get(lang);

        if (queryString) {
            try {
                const query = new Query(language, queryString);
                const matches = query.matches(tree.rootNode);

                for (const match of matches) {
                    let name = '';
                    let kind: CodeSymbol['kind'] = 'variable';

                    // Deduce kind from pattern name if captured
                    if (match.patternIndex >= 0 && match.patternIndex < query.captureNames.length) {
                         // Query API gives us capture definitions, but we can also look at captures array
                    }

                    for (const capture of match.captures) {
                        if (capture.name === 'name') {
                            name = capture.node.text;
                        }
                    }

                    // We can also identify the kind from the main node type,
                    // or by associating the match with a specific query block.
                    // The easiest way is to look at the node type of the outermost capture or root of match.

                    // But in our queries, we tag the outer node like @function, @class, etc.
                    // Let's find the tagged outer node.
                    let targetNode: Node | null = null;

                    for (const capture of match.captures) {
                        if (['function', 'method', 'class', 'import'].includes(capture.name)) {
                            kind = capture.name as any;
                            targetNode = capture.node;
                        }
                    }

                    if (!targetNode && match.captures.length > 0) {
                         targetNode = match.captures[0].node;
                    }

                    if (targetNode) {
                        if (kind === 'import') {
                           // For imports, name might not be captured in some languages
                           name = targetNode.text.split('\n')[0].substring(0, 50) + (targetNode.text.length > 50 ? '...' : '');
                        } else if (!name) {
                            name = '<anonymous>';
                        }

                        let complexity: number | undefined;
                        if (kind === 'function' || kind === 'method') {
                            complexity = this.calculateComplexity(targetNode);
                        }

                        symbols.push({
                            kind,
                            name,
                            startLine: targetNode.startPosition.row + 1,
                            endLine: targetNode.endPosition.row + 1,
                            complexity
                        });
                    }
                }
            } catch (e) {
                console.error("Query error:", e);
            }
        }

        const executionTimeMs = performance.now() - startTime;
        const lineCount = sourceCode.split('\n').length;

        // Deduplicate symbols that might match multiple patterns
        const uniqueSymbols = symbols.filter((sym, index, self) =>
            index === self.findIndex((t) => (
                t.kind === sym.kind &&
                t.name === sym.name &&
                t.startLine === sym.startLine
            ))
        );

        return {
            language: lang,
            symbols: uniqueSymbols,
            lineCount,
            parseErrors,
            executionTimeMs
        };
    }

    public async parseFile(fileContent: string, fileName: string): Promise<ParseResult> {
        const lang = this.detectLanguage(fileName);
        if (!lang) {
            throw new Error(`Unsupported file extension for ${fileName}`);
        }

        await this.loadLanguage(lang);
        return await this.parse(fileContent, lang);
    }
}

comlink.expose(new TreeSitterWorker());
