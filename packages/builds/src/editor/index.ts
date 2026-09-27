import { createDexieRepository, db } from '@codeforge/data/dexie';
import { MonacoEditorManager, createMonacoEditorManager } from '@codeforge/editor/monaco';
import { GitManager, createGitManager } from '@codeforge/editor/git';
import { TerminalManager, createTerminalManager } from '@codeforge/editor/terminal';
import { CollaborationManager, createCollaborationManager } from '@codeforge/editor/collaboration';
import { z } from 'zod';

export const BuildFileSchema = z.object({
  id: z.string().uuid(),
  buildId: z.string().uuid(),
  path: z.string(),
  content: z.string(),
  language: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const BuildAssetSchema = z.object({
  id: z.string().uuid(),
  buildId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  data: z.string(),
  path: z.string(),
  createdAt: z.number(),
});

export const BuildSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().max(200),
  description: z.string().max(2000).optional(),
  slug: z.string().max(100).optional(),
  files: z.array(z.string().uuid()),
  assets: z.array(z.string().uuid()),
  isPublic: z.boolean().default(false),
  publishedAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  settings: z.object({
    entryPoint: z.string().default('index.html'),
    buildCommand: z.string().optional(),
    devCommand: z.string().optional(),
    installCommand: z.string().optional(),
    environment: z.record(z.string()).optional(),
  }).optional(),
});

export type BuildFile = z.infer<typeof BuildFileSchema>;
export type BuildAsset = z.infer<typeof BuildAssetSchema>;
export type Build = z.infer<typeof BuildSchema>;

export interface BuildEditorState {
  build: Build;
  files: Map<string, BuildFile>;
  assets: Map<string, BuildAsset>;
  openFiles: string[];
  activeFile: string | null;
  gitStatus: any;
  previewUrl: string | null;
}

export class BuildEditor {
  private buildsRepo = createDexieRepository(db.builds);
  private filesRepo = createDexieRepository(db.buildFiles);
  private monacoManager: MonacoEditorManager;
  private gitManager: GitManager | null = null;
  private terminalManager: TerminalManager;
  private collaborationManager: CollaborationManager | null = null;
  private currentBuild: Build | null = null;
  private state: BuildEditorState | null = null;
  private previewServer: PreviewServer | null = null;

  constructor() {
    this.monacoManager = createMonacoEditorManager();
    this.terminalManager = createTerminalManager();
  }

  async initialize(buildId: string, userId: string, collaboration?: { roomName: string; userName: string; userColor: string }): Promise<BuildEditorState> {
    const build = await this.getBuild(buildId);
    if (!build) throw new Error(`Build not found: ${buildId}`);
    if (build.userId !== userId) throw new Error('Unauthorized');

    this.currentBuild = build;

    const files = await this.getBuildFiles(buildId);
    const fileMap = new Map(files.map((f) => [f.path, f]));

    this.state = {
      build,
      files: fileMap,
      assets: new Map(),
      openFiles: [build.settings?.entryPoint || 'index.html'],
      activeFile: build.settings?.entryPoint || 'index.html',
      gitStatus: null,
      previewUrl: null,
    };

    await this.initializeGit(buildId);
    await this.initializeTerminal(buildId);

    if (collaboration) {
      await this.initializeCollaboration(collaboration);
    }

    this.previewServer = new PreviewServer(buildId, fileMap);
    await this.previewServer.start();

    return this.state;
  }

  private async initializeGit(buildId: string): Promise<void> {
    this.gitManager = createGitManager(`/builds/${buildId}`);
    try {
      await this.gitManager.init();
    } catch {
      // Git not initialized yet
    }
  }

  private async initializeTerminal(buildId: string): Promise<void> {
    // Terminal will be attached to UI container
  }

  private async initializeCollaboration(config: { roomName: string; userName: string; userColor: string }): Promise<void> {
    this.collaborationManager = createCollaborationManager({
      roomName: config.roomName,
      userId: this.currentBuild!.userId,
      userName: config.userName,
      userColor: config.userColor,
    });
    await this.collaborationManager.initialize();
  }

  async createBuild(userId: string, title: string, template?: string): Promise<Build> {
    const build: Build = {
      id: crypto.randomUUID(),
      userId,
      title,
      description: '',
      slug: this.generateSlug(title),
      files: [],
      assets: [],
      isPublic: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        entryPoint: 'index.html',
      },
    };

    await this.buildsRepo.create(build as any);

    if (template) {
      await this.applyTemplate(build.id, template);
    } else {
      await this.createDefaultFiles(build.id);
    }

    return build;
  }

  private async createDefaultFiles(buildId: string): Promise<void> {
    const defaultFiles: Omit<BuildFile, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        buildId,
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Build</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, CodeForge!</h1>
    <script src="script.js"></script>
</body>
</html>`,
        language: 'html',
      },
      {
        buildId,
        path: 'style.css',
        content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0d1117;
    color: #e6edf3;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

h1 {
    font-size: 3rem;
    background: linear-gradient(135deg, #58a6ff, #bc8cff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}`,
        language: 'css',
      },
      {
        buildId,
        path: 'script.js',
        content: `console.log('Hello, CodeForge!');

document.querySelector('h1').addEventListener('click', () => {
    document.body.style.background = '#' + Math.floor(Math.random() * 16777215).toString(16);
});`,
        language: 'javascript',
      },
    ];

    for (const file of defaultFiles) {
      const now = Date.now();
      const newFile: BuildFile = {
        ...file,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await this.filesRepo.create(newFile as any);
    }
  }

  private async applyTemplate(buildId: string, templateId: string): Promise<void> {
  }

  async getBuild(buildId: string): Promise<Build | null> {
    return this.buildsRepo.findById(buildId);
  }

  async getUserBuilds(userId: string): Promise<Build[]> {
    return this.buildsRepo.find({ where: { userId }, orderBy: [{ field: 'updatedAt', direction: 'desc' }] });
  }

  async getBuildFiles(buildId: string): Promise<BuildFile[]> {
    return this.filesRepo.find({ where: { buildId } });
  }

  async getFile(buildId: string, path: string): Promise<BuildFile | null> {
    const files = await this.filesRepo.find({ where: { buildId, path } });
    return files[0] || null;
  }

  async saveFile(buildId: string, path: string, content: string): Promise<BuildFile> {
    const existing = await this.getFile(buildId, path);
    const language = this.getLanguageFromPath(path);

    if (existing) {
      return this.filesRepo.update(existing.id, { content, updatedAt: Date.now() });
    } else {
      const newFile: BuildFile = {
        id: crypto.randomUUID(),
        buildId,
        path,
        content,
        language,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await this.filesRepo.create(newFile as any);
      return newFile;
    }
  }

  async deleteFile(buildId: string, path: string): Promise<void> {
    const file = await this.getFile(buildId, path);
    if (file) {
      await this.filesRepo.delete(file.id);
    }
  }

  async renameFile(buildId: string, oldPath: string, newPath: string): Promise<BuildFile | null> {
    const file = await this.getFile(buildId, oldPath);
    if (!file) return null;

    const updated = await this.filesRepo.update(file.id, { path: newPath, updatedAt: Date.now() });
    return updated;
  }

  async uploadAsset(buildId: string, file: File): Promise<BuildAsset> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const asset: BuildAsset = {
      id: crypto.randomUUID(),
      buildId,
      name: file.name,
      type: file.type,
      size: file.size,
      data: base64,
      path: `assets/${file.name}`,
      createdAt: Date.now(),
    };

    return asset;
  }

  async getAssets(buildId: string): Promise<BuildAsset[]> {
    return [];
  }

  async deleteAsset(buildId: string, assetId: string): Promise<void> {
  }

  getMonacoManager(): MonacoEditorManager {
    return this.monacoManager;
  }

  getTerminalManager(): TerminalManager {
    return this.terminalManager;
  }

  getGitManager(): GitManager | null {
    return this.gitManager;
  }

  getCollaborationManager(): CollaborationManager | null {
    return this.collaborationManager;
  }

  getPreviewUrl(): string | null {
    return this.previewServer?.getUrl() || null;
  }

  getState(): BuildEditorState | null {
    return this.state;
  }

  async publish(slug?: string): Promise<{ url: string; success: boolean }> {
    if (!this.currentBuild) return { url: '', success: false };

    const updated = await this.buildsRepo.update(this.currentBuild.id, {
      isPublic: true,
      slug: slug || this.currentBuild.slug,
      publishedAt: Date.now(),
    });

    this.currentBuild = updated;
    return { url: `https://${updated.slug}.codeforge.local`, success: true };
  }

  async unpublish(): Promise<void> {
    if (!this.currentBuild) return;
    await this.buildsRepo.update(this.currentBuild.id, { isPublic: false, publishedAt: undefined });
    this.currentBuild!.isPublic = false;
    this.currentBuild!.publishedAt = undefined;
  }

  async exportAsZip(): Promise<Blob> {
    if (!this.currentBuild) throw new Error('No build loaded');

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const files = await this.getBuildFiles(this.currentBuild.id);
    for (const file of files) {
      zip.file(file.path, file.content);
    }

    return zip.generateAsync({ type: 'blob' });
  }

  async importFromZip(blob: Blob): Promise<void> {
    if (!this.currentBuild) throw new Error('No build loaded');

    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(blob);

    for (const [path, file] of Object.entries(zip.files)) {
      if (!file.dir) {
        const content = await file.async('text');
        await this.saveFile(this.currentBuild.id, path, content);
      }
    }
  }

  private getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languages: Record<string, string> = {
      html: 'html',
      htm: 'html',
      css: 'css',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      txt: 'plaintext',
      py: 'python',
      rs: 'rust',
      go: 'go',
      cpp: 'cpp',
      c: 'c',
      h: 'c',
      java: 'java',
      kt: 'kotlin',
      swift: 'swift',
      php: 'php',
      rb: 'ruby',
      lua: 'lua',
    };
    return languages[ext || ''] || 'plaintext';
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  async shutdown(): Promise<void> {
    this.monacoManager.dispose();
    this.terminalManager.removeAllTerminals();
    if (this.collaborationManager) {
      await this.collaborationManager.disconnect();
    }
    if (this.previewServer) {
      await this.previewServer.stop();
    }
  }
}

class PreviewServer {
  private buildId: string;
  private fileMap: Map<string, any>;
  private port = 0;
  private server: any = null;

  constructor(buildId: string, fileMap: Map<string, any>) {
    this.buildId = buildId;
    this.fileMap = fileMap;
  }

  async start(): Promise<void> {
    this.port = 3000 + Math.floor(Math.random() * 1000);
  }

  getUrl(): string {
    return `http://localhost:${this.port}/preview/${this.buildId}`;
  }

  async stop(): Promise<void> {
  }
}

export function createBuildEditor(): BuildEditor {
  return new BuildEditor();
}