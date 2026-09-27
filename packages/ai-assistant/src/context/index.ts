import { MonacoEditorManager } from '@codeforge/editor/monaco';
import type { EditorFile } from '@codeforge/core/types';

export interface CodeContext {
  currentFile: EditorFile | null;
  openFiles: EditorFile[];
  projectFiles: Map<string, EditorFile>;
  cursorPosition: { line: number; column: number } | null;
  selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null;
  language: string;
  projectStructure: ProjectStructure;
  gitStatus: GitStatus | null;
  recentEdits: RecentEdit[];
}

export interface ProjectStructure {
  directories: string[];
  files: FileInfo[];
  entryPoints: string[];
  configFiles: string[];
  dependencies: DependencyInfo;
}

export interface FileInfo {
  path: string;
  language: string;
  size: number;
  lines: number;
  lastModified: number;
}

export interface DependencyInfo {
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'cargo' | 'pip' | 'go' | 'unknown';
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export interface GitStatus {
  branch: string;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface RecentEdit {
  file: string;
  timestamp: number;
  type: 'insert' | 'delete' | 'replace';
  preview: string;
}

export class ContextManager {
  private monacoManager: MonacoEditorManager;
  private context: CodeContext | null = null;
  private maxContextTokens = 8000;
  private recentEdits: RecentEdit[] = [];

  constructor(monacoManager: MonacoEditorManager) {
    this.monacoManager = monacoManager;
  }

  async buildContext(activeFilePath?: string): Promise<CodeContext> {
    const editors = this.monacoManager.getAllEditors();
    const models = this.monacoManager.getAllModels();

    const openFiles: EditorFile[] = [];
    let currentFile: EditorFile | null = null;

    for (const editor of editors) {
      const model = editor.getModel();
      if (!model) continue;

      const uri = model.uri;
      const path = uri.path;
      const content = model.getValue();
      const language = model.getLanguageId();
      const position = editor.getPosition();
      const selection = editor.getSelection();

      const file: EditorFile = {
        path,
        content,
        language,
        isDirty: editor.getModel()?.isDirty() || false,
        isActive: path === activeFilePath,
        cursorPosition: position ? { line: position.lineNumber, column: position.column } : undefined,
        selection: selection ? {
          start: { line: selection.startLineNumber, column: selection.startColumn },
          end: { line: selection.endLineNumber, column: selection.endColumn },
        } : undefined,
      };

      openFiles.push(file);

      if (path === activeFilePath) {
        currentFile = file;
      }
    }

    const projectFiles = new Map(openFiles.map((f) => [f.path, f]));
    const projectStructure = await this.analyzeProjectStructure(projectFiles);

    this.context = {
      currentFile,
      openFiles,
      projectFiles,
      cursorPosition: currentFile?.cursorPosition || null,
      selection: currentFile?.selection || null,
      language: currentFile?.language || 'plaintext',
      projectStructure,
      gitStatus: null,
      recentEdits: this.recentEdits.slice(-10),
    };

    return this.context;
  }

  private async analyzeProjectStructure(files: Map<string, EditorFile>): Promise<ProjectStructure> {
    const directories = new Set<string>();
    const fileInfos: FileInfo[] = [];
    const entryPoints: string[] = [];
    const configFiles: string[] = [];

    for (const [path, file] of files) {
      const dir = path.substring(0, path.lastIndexOf('/')) || '.';
      directories.add(dir);

      const lines = file.content.split('\n').length;

      fileInfos.push({
        path,
        language: file.language,
        size: file.content.length,
        lines,
        lastModified: Date.now(),
      });

      if (this.isEntryPoint(path)) {
        entryPoints.push(path);
      }
      if (this.isConfigFile(path)) {
        configFiles.push(path);
      }
    }

    const dependencies = await this.extractDependencies(files);

    return {
      directories: Array.from(directories).sort(),
      files: fileInfos,
      entryPoints,
      configFiles,
      dependencies,
    };
  }

  private isEntryPoint(path: string): boolean {
    const entryPatterns = [
      'index.html', 'main.js', 'main.ts', 'index.js', 'index.ts',
      'app.js', 'app.ts', 'App.js', 'App.tsx',
      'main.py', 'main.rs', 'main.go', 'main.cpp', 'Main.java',
      'cli.py', 'cli.js', 'cli.ts',
    ];
    return entryPatterns.some((p) => path.endsWith(p) || path.includes(`/${p}`));
  }

  private isConfigFile(path: string): boolean {
    const configPatterns = [
      'package.json', 'tsconfig.json', 'vite.config.ts', 'webpack.config.js',
      'Cargo.toml', 'pyproject.toml', 'requirements.txt', 'go.mod',
      'pom.xml', 'build.gradle', 'composer.json', '.gitignore',
      'eslint.config.js', 'prettier.config.js', 'tailwind.config.js',
    ];
    return configPatterns.some((p) => path.endsWith(p) || path.includes(`/${p}`));
  }

  private async extractDependencies(files: Map<string, EditorFile>): Promise<DependencyInfo> {
    const packageJson = files.get('package.json');
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson.content);
        return {
          packageManager: 'npm',
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {},
          scripts: pkg.scripts || {},
        };
      } catch {
        // Ignore parse errors
      }
    }

    const cargoToml = files.get('Cargo.toml');
    if (cargoToml) {
      return { packageManager: 'cargo', dependencies: {}, devDependencies: {}, scripts: {} };
    }

    const pyproject = files.get('pyproject.toml');
    if (pyproject) {
      return { packageManager: 'pip', dependencies: {}, devDependencies: {}, scripts: {} };
    }

    const goMod = files.get('go.mod');
    if (goMod) {
      return { packageManager: 'go', dependencies: {}, devDependencies: {}, scripts: {} };
    }

    return { packageManager: 'unknown', dependencies: {}, devDependencies: {}, scripts: {} };
  }

  getContext(): CodeContext | null {
    return this.context;
  }

  getCurrentFile(): EditorFile | null {
    return this.context?.currentFile || null;
  }

  getOpenFiles(): EditorFile[] {
    return this.context?.openFiles || [];
  }

  getProjectStructure(): ProjectStructure | null {
    return this.context?.projectStructure || null;
  }

  recordEdit(file: string, type: 'insert' | 'delete' | 'replace', preview: string): void {
    this.recentEdits.push({
      file,
      timestamp: Date.now(),
      type,
      preview: preview.substring(0, 100),
    });

    if (this.recentEdits.length > 50) {
      this.recentEdits = this.recentEdits.slice(-50);
    }
  }

  getRelevantContext(query: string, maxTokens?: number): string {
    if (!this.context) return '';

    const tokens = maxTokens || this.maxContextTokens;
    let result = '';
    let tokenCount = 0;

    if (this.context.currentFile) {
      const fileContext = this.formatFileContext(this.context.currentFile);
      const fileTokens = this.estimateTokens(fileContext);
      if (tokenCount + fileTokens <= tokens) {
        result += fileContext + '\n\n';
        tokenCount += fileTokens;
      }
    }

    for (const edit of this.context.recentEdits.reverse()) {
      const editContext = `Recent edit in ${edit.file}: ${edit.type} - ${edit.preview}`;
      const editTokens = this.estimateTokens(editContext);
      if (tokenCount + editTokens <= tokens) {
        result += editContext + '\n';
        tokenCount += editTokens;
      }
    }

    for (const file of this.context.openFiles) {
      if (file.path === this.context.currentFile?.path) continue;
      if (this.isRelevant(file, query)) {
        const fileContext = this.formatFileContext(file);
        const fileTokens = this.estimateTokens(fileContext);
        if (tokenCount + fileTokens <= tokens) {
          result += fileContext + '\n\n';
          tokenCount += fileTokens;
        }
      }
    }

    return result.trim();
  }

  private formatFileContext(file: EditorFile): string {
    return `--- ${file.path} (${file.language}) ---\n${file.content}`;
  }

  private isRelevant(file: EditorFile, query: string): boolean {
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const content = file.content.toLowerCase();
    return queryWords.some((word) => content.includes(word));
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  clearContext(): void {
    this.context = null;
    this.recentEdits = [];
  }
}

export function createContextManager(monacoManager: MonacoEditorManager): ContextManager {
  return new ContextManager(monacoManager);
}