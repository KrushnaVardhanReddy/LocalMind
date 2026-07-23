import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitWorker } from './git.worker';

// Mock comlink
vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

// Mock isomorphic-git lightning-fs
vi.mock('@isomorphic-git/lightning-fs', () => {
    return {
        default: class FS {
            promises = {
                mkdir: vi.fn().mockResolvedValue(true),
                writeFile: vi.fn().mockResolvedValue(true)
            };
        }
    }
});

// Mock isomorphic-git
vi.mock('isomorphic-git', () => {
    return {
        default: {
            log: vi.fn().mockResolvedValue([
                {
                    oid: 'commit1',
                    commit: {
                        author: { name: 'Alice', email: 'alice@example.com', timestamp: 1600000000 },
                        message: 'First commit',
                        parent: []
                    }
                },
                {
                    oid: 'commit2',
                    commit: {
                        author: { name: 'Bob', email: 'bob@example.com', timestamp: 1600000100 },
                        message: 'Second commit',
                        parent: ['commit1']
                    }
                }
            ]),
            TREE: vi.fn().mockReturnValue('mock-tree'),
            walk: vi.fn().mockResolvedValue(['/src/main.ts']),
            readBlob: vi.fn().mockImplementation(async ({ oid }) => {
                if (oid === 'commit1') {
                    return { blob: new TextEncoder().encode("Hello\nWorld") };
                }
                return { blob: new TextEncoder().encode("Hello\nWorld\nBob") };
            })
        }
    };
});

describe('GitWorker', () => {
    let worker: GitWorker;

    beforeEach(() => {
        worker = new GitWorker();
    });

    it('should load repository and write files', async () => {
        const file1 = new File(['mock content'], '.git/config');
        Object.defineProperty(file1, 'webkitRelativePath', { value: 'repo/.git/config' });

        await worker.loadRepository([{ path: 'repo/.git/config', file: file1 }]);
        expect(worker['isLoaded']).toBe(true);
    });

    it('should get commit log', async () => {
        await worker.loadRepository([]);
        const log = await worker.getCommitLog();
        expect(log.length).toBe(2);
        expect(log[0].hash).toBe('commit1');
        expect(log[0].author).toBe('Alice');
        expect(log[1].hash).toBe('commit2');
        expect(log[1].filesChangedCount).toBe(1); // from mock walk
    });

    it('should get file churn', async () => {
        await worker.loadRepository([]);
        const churn = await worker.getFileChurn();
        expect(churn.length).toBe(1);
        expect(churn[0].filepath).toBe('/src/main.ts');
        expect(churn[0].totalCommits).toBe(1); // one child commit mocked
        expect(churn[0].linesAdded).toBeGreaterThan(0);
    });

    it('should get contributor stats', async () => {
        await worker.loadRepository([]);
        const stats = await worker.getContributorStats();
        expect(stats.length).toBe(2);
        const alice = stats.find(s => s.name === 'Alice');
        const bob = stats.find(s => s.name === 'Bob');
        expect(alice).toBeDefined();
        expect(bob).toBeDefined();
        expect(bob!.linesAdded).toBeGreaterThan(0);
    });
});
