import { Runtime, ExecutionOptions, ExecutionResult, RuntimeConfig } from '../index';

export class JavaScriptRuntime implements Runtime {
  name = 'javascript';
  version = 'ES2023';
  supportedLanguages = ['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'];
  private quickjs: any = null;
  private runtime: any = null;
  private context: any = null;
  private initialized = false;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const quickjs = await import('quickjs-emscripten');
      this.quickjs = quickjs.default || quickjs;
      await this.quickjs.init();

      this.runtime = this.quickjs.newRuntime();
      this.context = this.runtime.newContext();

      this.setupGlobals();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize QuickJS:', error);
      throw new Error(`JavaScript runtime initialization failed: ${error}`);
    }
  }

  private setupGlobals(): void {
    this.context.eval(`
      const console = {
        log: (...args) => { this.__stdout__ += args.join(' ') + '\\n'; },
        error: (...args) => { this.__stderr__ += args.join(' ') + '\\n'; },
        warn: (...args) => { this.__stderr__ += 'WARN: ' + args.join(' ') + '\\n'; },
        info: (...args) => { this.__stdout__ += 'INFO: ' + args.join(' ') + '\\n'; },
      };
      
      const setTimeout = (fn, ms) => { return 0; };
      const setInterval = (fn, ms) => { return 0; };
      const clearTimeout = (id) => {};
      const clearInterval = (id) => {};
      
      globalThis.console = console;
      globalThis.setTimeout = setTimeout;
      globalThis.setInterval = setInterval;
      globalThis.clearTimeout = clearTimeout;
      globalThis.clearInterval = clearInterval;
    `);
  }

  async execute(code: string, language: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    if (!this.initialized || !this.context) {
      throw new Error('JavaScript runtime not initialized');
    }

    const startTime = performance.now();
    let output = '';
    let error = '';
    let success = false;

    try {
      this.context.eval(`
        this.__stdout__ = '';
        this.__stderr__ = '';
      `);

      if (options.stdin) {
        this.context.eval(`this.__stdin__ = ${JSON.stringify(options.stdin)};`);
      }

      if (language === 'typescript' || language === 'ts' || language === 'tsx') {
        code = this.stripTypes(code);
      }

      const wrappedCode = `
        (async () => {
          try {
            ${code}
          } catch (e) {
            this.__stderr__ += e.message + '\\n' + (e.stack || '');
            throw e;
          }
        })();
      `;

      await this.context.eval(wrappedCode);

      output = this.context.eval('this.__stdout__');
      error = this.context.eval('this.__stderr__');
      success = error.length === 0;
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
      stdout: output.trim(),
      stderr: error.trim() || undefined,
    };
  }

  private stripTypes(code: string): string {
    return code
      .replace(/:\s*\w+(\[\])?\s*(?==|,|\)|\{)/g, '')
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
      .replace(/enum\s+\w+\s*\{[^}]*\}/g, '')
      .replace(/public\s+|private\s+|protected\s+|readonly\s+/g, '')
      .replace(/implements\s+\w+/g, '')
      .replace(/<\w+>/g, '');
  }

  async terminate(): Promise<void> {
    if (this.context) {
      this.context.dispose();
      this.context = null;
    }
    if (this.runtime) {
      this.runtime.dispose();
      this.runtime = null;
    }
    if (this.quickjs) {
      this.quickjs = null;
    }
    this.initialized = false;
  }

  isReady(): boolean {
    return this.initialized && this.context !== null;
  }

  evalSync(code: string): any {
    if (!this.context) throw new Error('Runtime not initialized');
    return this.context.eval(code);
  }

  setGlobal(name: string, value: any): void {
    if (!this.context) throw new Error('Runtime not initialized');
    this.context.eval(`globalThis.${name} = ${JSON.stringify(value)};`);
  }
}

export async function createJavaScriptRuntime(config?: RuntimeConfig): Promise<JavaScriptRuntime> {
  const runtime = new JavaScriptRuntime(config);
  await runtime.initialize();
  return runtime;
}