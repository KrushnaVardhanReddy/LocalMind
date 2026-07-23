import { expose } from 'comlink';
import git from 'isomorphic-git';
import FS from '@isomorphic-git/lightning-fs';
import { diffLines } from 'diff';

export interface CommitSummary {
    hash: string;
    author: string;
    email: string;
    date: Date;
    message: string;
    filesChangedCount: number;
}

export interface FileChurnRecord {
    filepath: string;
    totalCommits: number;
    linesAdded: number;
    linesDeleted: number;
}

export interface ContributorStats {
    email: string;
    name: string;
    commits: number;
    linesAdded: number;
    linesDeleted: number;
}

export interface GitWorkerContract {
    loadRepository(files: { path: string, file: File }[]): Promise<void>;
    getCommitLog(limit?: number): Promise<CommitSummary[]>;
    getFileChurn(): Promise<FileChurnRecord[]>;
    getContributorStats(): Promise<ContributorStats[]>;
}

export class GitWorker implements GitWorkerContract {
    private fs: any;
    private dir = '/repo';
    private isLoaded = false;

    // Cached results
    private cachedCommitLog: CommitSummary[] = [];
    private cachedFileChurn: FileChurnRecord[] = [];
    private cachedContributorStats: ContributorStats[] = [];

    async loadRepository(files: { path: string, file: File }[]): Promise<void> {
        this.fs = new FS('gitrepo', { wipe: true });
        const pfs = this.fs.promises;

        await pfs.mkdir(this.dir).catch(() => {});

        for (const item of files) {
            const { path, file } = item;

            const pathParts = path ? path.split('/') : file.name.split('/');
            const gitIndex = pathParts.indexOf('.git');
            if (gitIndex === -1) continue;

            const relativePath = pathParts.slice(gitIndex).join('/');
            const fullPath = `${this.dir}/${relativePath}`;

            // create dirs
            const dirParts = fullPath.split('/');
            dirParts.pop(); // remove file name

            let currentPath = '';
            for (const part of dirParts) {
                if (!part) continue;
                currentPath += `/${part}`;
                try {
                    await pfs.mkdir(currentPath);
                } catch (e) {
                    // ignore if exists
                }
            }

            // write file
            const buffer = await file.arrayBuffer();
            await pfs.writeFile(fullPath, new Uint8Array(buffer));
        }

        this.isLoaded = true;
        await this.processAllStats();
    }

    private async processAllStats() {
        if (!this.isLoaded) return;

        const commits = await git.log({ fs: this.fs, dir: this.dir });

        const commitLog: CommitSummary[] = [];
        const fileStats = new Map<string, { commits: number; linesAdded: number; linesDeleted: number }>();
        const authorStats = new Map<string, ContributorStats>();

        for (const c of commits) {
            let filesChangedCount = 0;
            const parentOid = c.commit.parent ? c.commit.parent[0] : null;
            const email = c.commit.author.email;

            if (!authorStats.has(email)) {
                authorStats.set(email, {
                    email,
                    name: c.commit.author.name,
                    commits: 0,
                    linesAdded: 0,
                    linesDeleted: 0
                });
            }
            const currentAuthor = authorStats.get(email)!;
            currentAuthor.commits++;

            if (parentOid) {
                try {
                    const changedFiles = await git.walk({
                        fs: this.fs,
                        dir: this.dir,
                        trees: [git.TREE({ ref: parentOid }), git.TREE({ ref: c.oid })],
                        map: async function(filepath, [parent, current]) {
                            if (filepath === '.') return;
                            if ((await parent?.type()) === 'tree' || (await current?.type()) === 'tree') return;

                            const parentOid = await parent?.oid();
                            const currentOid = await current?.oid();

                            if (parentOid !== currentOid) {
                                return filepath;
                            }
                        }
                    }).then(files => files.filter(Boolean) as string[]);

                    filesChangedCount = changedFiles.length;

                    for (const filepath of changedFiles) {
                        if (!fileStats.has(filepath)) {
                            fileStats.set(filepath, { commits: 0, linesAdded: 0, linesDeleted: 0 });
                        }
                        const stats = fileStats.get(filepath)!;
                        stats.commits++;

                        try {
                            const [parentBlob, currentBlob] = await Promise.all([
                                git.readBlob({ fs: this.fs, dir: this.dir, oid: parentOid, filepath }).catch(() => null),
                                git.readBlob({ fs: this.fs, dir: this.dir, oid: c.oid, filepath }).catch(() => null)
                            ]);

                            const parentText = parentBlob ? new TextDecoder().decode(parentBlob.blob) : '';
                            const currentText = currentBlob ? new TextDecoder().decode(currentBlob.blob) : '';

                            const changes = diffLines(parentText, currentText);
                            for (const change of changes) {
                                if (change.added) {
                                    stats.linesAdded += change.count || 0;
                                    currentAuthor.linesAdded += change.count || 0;
                                }
                                if (change.removed) {
                                    stats.linesDeleted += change.count || 0;
                                    currentAuthor.linesDeleted += change.count || 0;
                                }
                            }
                        } catch (e) {
                            // Ignore binary files or unreadable blobs
                        }
                    }
                } catch(e) {
                    filesChangedCount = 0;
                }
            }

            commitLog.push({
                hash: c.oid,
                author: c.commit.author.name,
                email: c.commit.author.email,
                date: new Date(c.commit.author.timestamp * 1000),
                message: c.commit.message,
                filesChangedCount
            });
        }

        this.cachedCommitLog = commitLog;

        const churnResult: FileChurnRecord[] = [];
        for (const [filepath, stats] of fileStats.entries()) {
            churnResult.push({
                filepath,
                totalCommits: stats.commits,
                linesAdded: stats.linesAdded,
                linesDeleted: stats.linesDeleted
            });
        }
        this.cachedFileChurn = churnResult;

        this.cachedContributorStats = Array.from(authorStats.values());
    }

    async getCommitLog(limit?: number): Promise<CommitSummary[]> {
        if (limit) {
            return this.cachedCommitLog.slice(0, limit);
        }
        return this.cachedCommitLog;
    }

    async getFileChurn(): Promise<FileChurnRecord[]> {
        return this.cachedFileChurn;
    }

    async getContributorStats(): Promise<ContributorStats[]> {
        return this.cachedContributorStats;
    }
}

expose(new GitWorker());
