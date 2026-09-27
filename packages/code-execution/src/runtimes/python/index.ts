import { Runtime, ExecutionOptions, ExecutionResult, RuntimeConfig } from '../index';

export class PythonRuntime implements Runtime {
  name = 'python';
  version = '3.12';
  supportedLanguages = ['python', 'python3', 'py'];
  private pyodide: any = null;
  private initialized = false;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const { loadPyodide } = await import('pyodide');
      this.pyodide = await loadPyodide({
        indexURL: this.config.pyodideUrl || 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
      });

      await this.pyodide.loadPackage(['micropip']);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Pyodide:', error);
      throw new Error(`Python runtime initialization failed: ${error}`);
    }
  }

  async execute(code: string, language: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    if (!this.initialized || !this.pyodide) {
      throw new Error('Python runtime not initialized');
    }

    const startTime = performance.now();
    let output = '';
    let error = '';
    let success = false;
    let memoryUsed = 0;

    try {
      const stdout: string[] = [];
      const stderr: string[] = [];

      this.pyodide.setStdout({ write: (data: string) => stdout.push(data) });
      this.pyodide.setStderr({ write: (data: string) => stderr.push(data) });

      if (options.stdin) {
        this.pyodide.stdin = options.stdin;
      }

      const globals = this.pyodide.toPy({});

      await this.pyodide.runPythonAsync(`
import sys
import io
import time
import resource

_old_stdout = sys.stdout
_old_stderr = sys.stderr
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

${code}

_output = sys.stdout.getvalue()
_error = sys.stderr.getvalue()
sys.stdout = _old_stdout
sys.stderr = _old_stderr
print(_output, end='')
print(_error, end='', file=sys.stderr)
      `);

      output = stdout.join('');
      error = stderr.join('');
      success = error.length === 0;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      success = false;
    }

    const executionTime = performance.now() - startTime;

    try {
      const memInfo = this.pyodide.FS?.stat?.('/')?.size || 0;
      memoryUsed = memInfo;
    } catch {
      memoryUsed = 0;
    }

    return {
      success,
      output: output.trim(),
      error: error.trim() || undefined,
      executionTime,
      memoryUsed,
      stdout: output.trim(),
      stderr: error.trim() || undefined,
    };
  }

  async terminate(): Promise<void> {
    if (this.pyodide) {
      this.pyodide = null;
      this.initialized = false;
    }
  }

  isReady(): boolean {
    return this.initialized && this.pyodide !== null;
  }

  async installPackage(packageName: string): Promise<void> {
    if (!this.initialized) throw new Error('Runtime not initialized');
    await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${packageName}')
    `);
  }

  async loadPackages(packages: string[]): Promise<void> {
    if (!this.initialized) throw new Error('Runtime not initialized');
    await this.pyodide.loadPackage(packages);
  }

  getPyodide(): any {
    return this.pyodide;
  }
}

export async function createPythonRuntime(config?: RuntimeConfig): Promise<PythonRuntime> {
  const runtime = new PythonRuntime(config);
  await runtime.initialize();
  return runtime;
}