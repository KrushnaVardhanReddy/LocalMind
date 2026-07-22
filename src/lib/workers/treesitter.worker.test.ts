import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as comlink from 'comlink';

const mockLanguage = {
    query: vi.fn(),
};

const mockQuery = {
    matches: vi.fn(),
    captureNames: ['function', 'class', 'method'],
};

const mockParserInstance = {
    setLanguage: vi.fn(),
    parse: vi.fn().mockReturnValue({
        walk: () => ({
            nodeType: 'program',
            gotoFirstChild: () => false,
            gotoNextSibling: () => false,
            gotoParent: () => false,
        }),
        rootNode: {
            startPosition: { row: 0, column: 0 },
            endPosition: { row: 10, column: 0 },
            text: 'test code',
            walk: () => ({
               nodeType: 'program',
               gotoFirstChild: () => false,
               gotoNextSibling: () => false,
               gotoParent: () => false,
            }),
        }
    }),
};

vi.mock('web-tree-sitter', () => {
    return {
        default: {
            init: vi.fn().mockResolvedValue(undefined),
        },
        Language: {
            load: vi.fn().mockResolvedValue(mockLanguage),
        },
        Query: class {
            constructor() {
                return mockQuery;
            }
        },
        Parser: class {
            constructor() {
                return mockParserInstance;
            }
        },
    };
});

vi.mock('comlink', () => ({
    expose: vi.fn(),
    wrap: vi.fn(),
}));

let worker: any;

describe('TreeSitterWorker', () => {
    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        const module = await import('./treesitter.worker?version=' + Date.now());

        const exposeCalls = vi.mocked(comlink.expose).mock.calls;
        worker = exposeCalls[exposeCalls.length - 1][0];

        // Override loadLanguage for testing without web-tree-sitter actually parsing files
        worker.initParser = async () => {
            if (!worker.parser) {
                worker.parser = mockParserInstance;
            }
        };

        worker.loadLanguage = async (lang: string) => {
             worker.parser = mockParserInstance;
             worker.languages.set(lang, mockLanguage);
             worker.queries.set(lang, 'mock query');
        };

    });

    it('should expose the worker via comlink', () => {
        expect(comlink.expose).toHaveBeenCalled();
        expect(worker).toBeDefined();
    });

    it('should extract symbols successfully', async () => {
        mockQuery.matches.mockReturnValueOnce([
            {
                patternIndex: 0,
                captures: [
                    {
                        name: 'function',
                        node: {
                            text: 'function',
                            startPosition: { row: 1 },
                            endPosition: { row: 5 },
                            walk: () => ({
                                nodeType: 'if_statement',
                                gotoFirstChild: () => false,
                                gotoNextSibling: () => false,
                                gotoParent: () => false,
                            })
                        }
                    },
                    {
                        name: 'name',
                        node: {
                            text: 'isEven',
                            startPosition: { row: 1 },
                            endPosition: { row: 1 },
                        }
                    }
                ]
            }
        ]);

        const sourceCode = `
            function isEven(n: number) {
                if (n % 2 === 0) {
                    return true;
                }
                return false;
            }
        `;
        const result = await worker.parseFile(sourceCode, 'test.ts');

        expect(result.language).toBe('typescript');
        expect(result.symbols.length).toBeGreaterThan(0);

        const funcSymbol = result.symbols.find((s: any) => s.name === 'isEven' && s.kind === 'function');
        expect(funcSymbol).toBeDefined();
        // Base complexity = 1, we mocked walk() to return an 'if_statement' node
        expect(funcSymbol.complexity).toBe(2);
    });

    it('should fail gracefully on unsupported extensions', async () => {
        await expect(worker.parseFile('some content', 'test.txt'))
            .rejects
            .toThrow('Unsupported file extension for test.txt');
    });
});
