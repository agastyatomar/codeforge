import { Runtime, ExecutionOptions, ExecutionResult, RuntimeConfig } from '../index';
import { WebContainer } from '@webcontainer/api';

export class WebContainerRuntime implements Runtime {
  name = 'webcontainer';
  version = '1.0';
  supportedLanguages = ['node', 'nodejs', 'npm', 'npx', 'bun', 'deno'];
  private webcontainer: WebContainer | null = null;
  private initialized = false;
  private config: RuntimeConfig;
  private fileSystem = new Map<string, string>();

  constructor(config: RuntimeConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.webcontainer = await WebContainer.boot({
        coepCredentials: 'include',
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      throw new Error(`WebContainer runtime initialization failed: ${error}`);
    }
  }

  async execute(code: string, language: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    if (!this.initialized || !this.webcontainer) {
      throw new Error('WebContainer runtime not initialized');
    }

    const startTime = performance.now();
    let output = '';
    let error = '';
    let success = false;
    let exitCode = 0;

    try {
      const fileName = options.cwd ? `${options.cwd}/main.js` : 'main.js';
      await this.webcontainer.fs.writeFile(fileName, code);

      const installProcess = await this.webcontainer.spawn('npm', ['install'], {
        cwd: options.cwd || '/',
      });

      let installOutput = '';
      for await (const chunk of installProcess.output) {
        installOutput += chunk;
      }
      await installProcess.exit;

      const runCommand = this.getRunCommand(language);
      const runProcess = await this.webcontainer.spawn(runCommand[0], runCommand.slice(1), {
        cwd: options.cwd || '/',
        env: options.env,
      });

      let stdout = '';
      let stderr = '';

      for await (const chunk of runProcess.output) {
        if (chunk.type === 'stdout') stdout += chunk.data;
        else if (chunk.type === 'stderr') stderr += chunk.data;
      }

      exitCode = await runProcess.exit;
      output = stdout;
      error = stderr;
      success = exitCode === 0;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      success = false;
    }

    const executionTime = performance.now() - startTime;

    return {
      success,
      output: output.trim(),
      error: error.trim() || undefined,
      executionTime,
      memoryUsed: 0,
      exitCode,
      stdout: output.trim(),
      stderr: error.trim() || undefined,
    };
  }

  private getRunCommand(language: string): string[] {
    switch (language) {
      case 'node':
      case 'nodejs':
        return ['node', 'main.js'];
      case 'npm':
        return ['npm', 'start'];
      case 'npx':
        return ['npx', 'main.js'];
      case 'bun':
        return ['bun', 'main.js'];
      case 'deno':
        return ['deno', 'run', 'main.js'];
      default:
        return ['node', 'main.js'];
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    await this.webcontainer.fs.writeFile(path, content);
    this.fileSystem.set(path, content);
  }

  async readFile(path: string): Promise<string> {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    const file = await this.webcontainer.fs.readFile(path, 'utf-8');
    return file;
  }

  async listFiles(path: string): Promise<string[]> {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    const files = await this.webcontainer.fs.readdir(path, { withFileTypes: true });
    return files.map((f) => f.name);
  }

  async spawn(command: string, args: string[], options: { cwd?: string; env?: Record<string, string> } = {}) {
    if (!this.webcontainer) throw new Error('WebContainer not initialized');
    return this.webcontainer.spawn(command, args, options);
  }

  async terminate(): Promise<void> {
    if (this.webcontainer) {
      await this.webcontainer.teardown();
      this.webcontainer = null;
      this.initialized = false;
      this.fileSystem.clear();
    }
  }

  isReady(): boolean {
    return this.initialized && this.webcontainer !== null;
  }

  getWebContainer(): WebContainer | null {
    return this.webcontainer;
  }
}

export async function createWebContainerRuntime(config?: RuntimeConfig): Promise<WebContainerRuntime> {
  const runtime = new WebContainerRuntime(config);
  await runtime.initialize();
  return runtime;
}