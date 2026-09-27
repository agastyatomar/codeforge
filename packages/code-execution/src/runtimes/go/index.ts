import { Runtime, ExecutionOptions, ExecutionResult, RuntimeConfig } from '../index';

export class GoRuntime implements Runtime {
  name = 'go';
  version = '1.22';
  supportedLanguages = ['go', 'golang'];
  private wasmModule: any = null;
  private initialized = false;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const wasmUrl = this.config.webcontainerUrl || '/wasm/go-wasm.wasm';
      const response = await fetch(wasmUrl);
      const bytes = await response.arrayBuffer();
      this.wasmModule = await WebAssembly.instantiate(bytes, {
        env: {
          memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
        },
      });
      this.initialized = true;
    } catch (error) {
      console.warn('Go WASM runtime not available, using fallback');
      this.initialized = false;
    }
  }

  async execute(code: string, language: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    if (!this.initialized) {
      return this.fallbackExecute(code, options);
    }

    const startTime = performance.now();

    try {
      const result = this.wasmModule.instance.exports.run(code);
      return {
        success: true,
        output: String(result),
        executionTime: performance.now() - startTime,
        memoryUsed: 0,
      };
    } catch (err) {
      return {
        success: false,
        output: '',
        error: err instanceof Error ? err.message : String(err),
        executionTime: performance.now() - startTime,
        memoryUsed: 0,
      };
    }
  }

  private async fallbackExecute(code: string, options: ExecutionOptions): Promise<ExecutionResult> {
    return {
      success: false,
      output: '',
      error: 'Go WASM runtime not available. Please enable WASM support or use the WebContainer runtime with Go installed.',
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  async terminate(): Promise<void> {
    this.wasmModule = null;
    this.initialized = false;
  }

  isReady(): boolean {
    return this.initialized && this.wasmModule !== null;
  }
}

export async function createGoRuntime(config?: RuntimeConfig): Promise<GoRuntime> {
  const runtime = new GoRuntime(config);
  await runtime.initialize();
  return runtime;
}