import * as Git from 'isomorphic-git';
import { fs } from 'isomorphic-git';
import type { EditorFile } from '@codeforge/core/types';

export interface GitStatus {
  clean: boolean;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  conflicted: string[];
  ahead: number;
  behind: number;
  currentBranch: string;
  remoteBranch?: string;
}

export interface GitCommit {
  oid: string;
  message: string;
  author: { name: string; email: string };
  timestamp: number;
  parents: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  upstream?: string;
}

export interface GitRemote {
  name: string;
  url: string;
  fetchRefspec?: string;
  pushRefspec?: string;
}

export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  chunks: GitDiffChunk[];
}

export interface GitDiffChunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export class GitManager {
  private repoPath: string;
  private fs: any;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.fs = fs;
  }

  async init(defaultBranch = 'main'): Promise<void> {
    await Git.init({ fs: this.fs, dir: this.repoPath, defaultBranch });
  }

  async status(): Promise<GitStatus> {
    const statusMatrix = await Git.statusMatrix({ fs: this.fs, dir: this.repoPath });
    const currentBranch = await Git.currentBranch({ fs: this.fs, dir: this.repoPath });
    const aheadBehind = await this.getAheadBehind(currentBranch);

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];
    const conflicted: string[] = [];

    for (const [filepath, head, workdir, stage] of statusMatrix) {
      if (stage === 2 && workdir === 2) conflicted.push(filepath);
      else if (stage !== 0) staged.push(filepath);
      else if (workdir !== 0) unstaged.push(filepath);
      else if (head === 0 && stage === 0 && workdir === 0) untracked.push(filepath);
    }

    return {
      clean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0 && conflicted.length === 0,
      staged,
      unstaged,
      untracked,
      conflicted,
      ahead: aheadBehind.ahead,
      behind: aheadBehind.behind,
      currentBranch: currentBranch || 'main',
    };
  }

  private async getAheadBehind(branch: string | undefined): Promise<{ ahead: number; behind: number }> {
    if (!branch) return { ahead: 0, behind: 0 };

    try {
      const upstream = await Git.branchUpstream({ fs: this.fs, dir: this.repoPath, ref: branch });
      if (!upstream) return { ahead: 0, behind: 0 };

      const localOid = await Git.resolveRef({ fs: this.fs, dir: this.repoPath, ref: branch });
      const remoteOid = await Git.resolveRef({ fs: this.fs, dir: this.repoPath, ref: upstream });

      const mergeBase = await Git.mergeBase({ fs: this.fs, dir: this.repoPath, oid1: localOid, oid2: remoteOid });

      const localLog = await Git.log({ fs: this.fs, dir: this.repoPath, ref: localOid, depth: 100 });
      const remoteLog = await Git.log({ fs: this.fs, dir: this.repoPath, ref: remoteOid, depth: 100 });

      const localAncestors = new Set(localLog.map((c) => c.oid));
      const remoteAncestors = new Set(remoteLog.map((c) => c.oid));

      let ahead = 0;
      let behind = 0;

      for (const commit of localLog) {
        if (!remoteAncestors.has(commit.oid)) ahead++;
        else break;
      }

      for (const commit of remoteLog) {
        if (!localAncestors.has(commit.oid)) behind++;
        else break;
      }

      return { ahead, behind };
    } catch {
      return { ahead: 0, behind: 0 };
    }
  }

  async add(filepaths: string | string[]): Promise<void> {
    const files = Array.isArray(filepaths) ? filepaths : [filepaths];
    for (const filepath of files) {
      await Git.add({ fs: this.fs, dir: this.repoPath, filepath });
    }
  }

  async commit(message: string, author?: { name: string; email: string }): Promise<string> {
    const oid = await Git.commit({
      fs: this.fs,
      dir: this.repoPath,
      message,
      author: author || { name: 'CodeForge User', email: 'user@codeforge.local' },
    });
    return oid;
  }

  async push(remote = 'origin', branch?: string): Promise<void> {
    await Git.push({
      fs: this.fs,
      dir: this.repoPath,
      remote,
      ref: branch,
      onAuth: () => ({ username: '', password: '' }),
    });
  }

  async pull(remote = 'origin', branch?: string): Promise<void> {
    await Git.pull({
      fs: this.fs,
      dir: this.repoPath,
      remote,
      ref: branch,
      singleBranch: true,
      onAuth: () => ({ username: '', password: '' }),
    });
  }

  async fetch(remote = 'origin'): Promise<void> {
    await Git.fetch({
      fs: this.fs,
      dir: this.repoPath,
      remote,
      onAuth: () => ({ username: '', password: '' }),
    });
  }

  async branch(name?: string, options?: { checkout?: boolean; force?: boolean }): Promise<string[]> {
    if (name) {
      await Git.branch({ fs: this.fs, dir: this.repoPath, ref: name, checkout: options?.checkout, force: options?.force });
    }
    return Git.listBranches({ fs: this.fs, dir: this.repoPath });
  }

  async checkout(ref: string, options?: { force?: boolean }): Promise<void> {
    await Git.checkout({ fs: this.fs, dir: this.repoPath, ref, force: options?.force });
  }

  async merge(ref: string, options?: { fastForwardOnly?: boolean }): Promise<void> {
    await Git.merge({ fs: this.fs, dir: this.repoPath, ref, fastForwardOnly: options?.fastForwardOnly });
  }

  async rebase(ref: string): Promise<void> {
    await Git.rebase({ fs: this.fs, dir: this.repoPath, ref });
  }

  async stash(options?: { message?: string }): Promise<void> {
    await Git.stashSave({ fs: this.fs, dir: this.repoPath, message: options?.message });
  }

  async stashPop(): Promise<void> {
    await Git.stashPop({ fs: this.fs, dir: this.repoPath });
  }

  async stashList(): Promise<Array<{ index: number; message: string }>> {
    return Git.stashList({ fs: this.fs, dir: this.repoPath });
  }

  async log(options?: { depth?: number; ref?: string }): Promise<GitCommit[]> {
    const commits = await Git.log({
      fs: this.fs,
      dir: this.repoPath,
      depth: options?.depth || 50,
      ref: options?.ref,
    });

    return commits.map((c) => ({
      oid: c.oid,
      message: c.commit.message,
      author: c.commit.author,
      timestamp: c.commit.timestamp * 1000,
      parents: c.commit.parents,
    }));
  }

  async diff(filepath?: string, options?: { staged?: boolean }): Promise<GitDiff[]> {
    const diffs = await Git.diff({
      fs: this.fs,
      dir: this.repoPath,
      filepath,
      staged: options?.staged,
    });

    return this.parseDiff(diffs);
  }

  private parseDiff(diffOutput: string): GitDiff[] {
    const diffs: GitDiff[] = [];
    const fileDiffs = diffOutput.split('diff --git ').slice(1);

    for (const fileDiff of fileDiffs) {
      const lines = fileDiff.split('\n');
      const fileMatch = lines[0].match(/^a\/(.+) b\/(.+)$/);
      if (!fileMatch) continue;

      const filepath = fileMatch[1];
      let additions = 0;
      let deletions = 0;
      const chunks: GitDiffChunk[] = [];

      let currentChunk: GitDiffChunk | null = null;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('@@')) {
          if (currentChunk) chunks.push(currentChunk);
          const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
          if (match) {
            currentChunk = {
              oldStart: parseInt(match[1]),
              oldLines: parseInt(match[2]) || 1,
              newStart: parseInt(match[3]),
              newLines: parseInt(match[4]) || 1,
              lines: [],
            };
          }
        } else if (currentChunk) {
          if (line.startsWith('+')) {
            additions++;
            currentChunk.lines.push({ type: 'add', content: line.slice(1), newLineNumber: currentChunk.newStart + currentChunk.lines.length });
          } else if (line.startsWith('-')) {
            deletions++;
            currentChunk.lines.push({ type: 'remove', content: line.slice(1), oldLineNumber: currentChunk.oldStart + currentChunk.lines.length });
          } else if (line.startsWith(' ')) {
            currentChunk.lines.push({ type: 'context', content: line.slice(1), oldLineNumber: currentChunk.oldStart + currentChunk.lines.length, newLineNumber: currentChunk.newStart + currentChunk.lines.length });
          }
        }
      }

      if (currentChunk) chunks.push(currentChunk);

      diffs.push({ file: filepath, additions, deletions, chunks });
    }

    return diffs;
  }

  async getBranches(): Promise<GitBranch[]> {
    const branches = await Git.listBranches({ fs: this.fs, dir: this.repoPath });
    const currentBranch = await Git.currentBranch({ fs: this.fs, dir: this.repoPath });

    return branches.map((name) => ({
      name,
      current: name === currentBranch,
    }));
  }

  async getRemotes(): Promise<GitRemote[]> {
    const remotes = await Git.listRemotes({ fs: this.fs, dir: this.repoPath });
    const result: GitRemote[] = [];

    for (const remote of remotes) {
      const url = await Git.getRemoteInfo({ fs: this.fs, dir: this.repoPath, remote });
      result.push({ name: remote, url: url.url });
    }

    return result;
  }

  async addRemote(name: string, url: string): Promise<void> {
    await Git.addRemote({ fs: this.fs, dir: this.repoPath, remote: name, url });
  }

  async removeRemote(name: string): Promise<void> {
    await Git.deleteRemote({ fs: this.fs, dir: this.repoPath, remote: name });
  }

  async getConfig(key: string): Promise<string | undefined> {
    return Git.getConfig({ fs: this.fs, dir: this.repoPath, path: key });
  }

  async setConfig(key: string, value: string, global = false): Promise<void> {
    await Git.setConfig({ fs: this.fs, dir: this.repoPath, path: key, value, global });
  }

  async clone(url: string, dir: string, options?: { singleBranch?: boolean; depth?: number; ref?: string }): Promise<void> {
    await Git.clone({
      fs: this.fs,
      dir,
      url,
      singleBranch: options?.singleBranch,
      depth: options?.depth,
      ref: options?.ref,
      onAuth: () => ({ username: '', password: '' }),
    });
  }

  async describe(): Promise<string> {
    return Git.describe({ fs: this.fs, dir: this.repoPath });
  }

  async tag(name: string, options?: { annotated?: boolean; message?: string }): Promise<void> {
    await Git.tag({
      fs: this.fs,
      dir: this.repoPath,
      ref: name,
      annotated: options?.annotated,
      message: options?.message,
    });
  }

  async listTags(): Promise<string[]> {
    return Git.listTags({ fs: this.fs, dir: this.repoPath });
  }
}

export function createGitManager(repoPath: string): GitManager {
  return new GitManager(repoPath);
}

export const gitFS = fs;