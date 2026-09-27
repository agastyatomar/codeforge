import { Runtime, ExecutionOptions, ExecutionResult, RuntimeConfig } from '../index';

export class RustRuntime implements Runtime {
  name = 'rust';
  version = '1.75';
  supportedLanguages = ['rust', 'rs'];
  private wasmModule: any = null;
  private initialized = false;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const wasmUrl = this.config.webcontainerUrl || '/wasm/rust-wasm.wasm';
      const response = await fetch(wasmUrl);
      const bytes = await response.arrayBuffer();
      this.wasmModule = await WebAssembly.instantiate(bytes, {
        env: {
          memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
          abort: () => {},
        },
      });
      this.initialized = true;
    } catch (error) {
      console.warn('Rust WASM runtime not available, using fallback');
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
      error: 'Rust WASM runtime not available. Please enable WASM support or use the WebContainer runtime with rustup.',
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

export async function createRustRuntime(config?: RuntimeConfig): Promise<RustRuntime> {
  const runtime = new RustRuntime(config);
  await runtime.initialize();
  return runtime;
}