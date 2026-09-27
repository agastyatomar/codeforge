import { Runtime, ExecutionOptions, ExecutionResult, RuntimeConfig } from '../index';

export class CppRuntime implements Runtime {
  name = 'cpp';
  version = '20';
  supportedLanguages = ['cpp', 'c++', 'cc', 'cxx'];
  private wasmModule: any = null;
  private initialized = false;
  private config: RuntimeConfig;

  constructor(config: RuntimeConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const wasmUrl = this.config.webcontainerUrl || '/wasm/cpp-wasm.wasm';
      const response = await fetch(wasmUrl);
      const bytes = await response.arrayBuffer();
      this.wasmModule = await WebAssembly.instantiate(bytes, {
        env: {
          memory: new WebAssembly.Memory({ initial: 512, maximum: 1024 }),
        },
      });
      this.initialized = true;
    } catch (error) {
      console.warn('C++ WASM runtime not available, using fallback');
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
      error: 'C++ WASM runtime not available. Please enable WASM support or use the WebContainer runtime with g++/clang++ installed.',
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

export async function createCppRuntime(config?: RuntimeConfig): Promise<CppRuntime> {
  const runtime = new CppRuntime(config);
  await runtime.initialize();
  return runtime;
}