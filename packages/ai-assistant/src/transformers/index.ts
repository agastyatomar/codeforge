import { pipeline, PipelineType, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

export interface TransformersConfig {
  modelId: string;
  task: PipelineType;
  device?: 'cpu' | 'webgpu' | 'auto';
  dtype?: 'fp32' | 'fp16' | 'q8' | 'q4';
}

export interface ModelInfo {
  id: string;
  task: string;
  size: string;
  description: string;
  languages?: string[];
}

export class TransformersClient {
  private pipelines = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private config: TransformersConfig | null = null;

  async loadModel(config: TransformersConfig): Promise<any> {
    const key = `${config.task}:${config.modelId}`;

    if (this.pipelines.has(key)) {
      return this.pipelines.get(key);
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const loadPromise = this.loadPipeline(config);
    this.loadingPromises.set(key, loadPromise);

    try {
      const pipeline = await loadPromise;
      this.pipelines.set(key, pipeline);
      this.loadingPromises.delete(key);
      return pipeline;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  private async loadPipeline(config: TransformersConfig): Promise<any> {
    return pipeline(config.task, config.modelId, {
      device: config.device || 'auto',
      dtype: config.dtype || 'fp32',
    });
  }

  async getPipeline(task: string, modelId: string): Promise<any> {
    const key = `${task}:${modelId}`;
    return this.pipelines.get(key);
  }

  async generateText(modelId: string, prompt: string, options?: { maxLength?: number; temperature?: number }): Promise<string> {
    const pipe = await this.loadModel({ modelId, task: 'text-generation' });
    const result = await pipe(prompt, {
      max_new_tokens: options?.maxLength || 512,
      temperature: options?.temperature || 0.7,
      do_sample: true,
    });
    return result[0]?.generated_text || '';
  }

  async completeCode(modelId: string, code: string, language: string): Promise<string> {
    const prompt = this.buildCodeCompletionPrompt(code, language);
    return this.generateText(modelId, prompt, { maxLength: 256, temperature: 0.2 });
  }

  async explainCode(modelId: string, code: string, language: string): Promise<string> {
    const prompt = `Explain this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nExplanation:`;
    return this.generateText(modelId, prompt, { maxLength: 512, temperature: 0.3 });
  }

  async debugCode(modelId: string, code: string, language: string, error?: string): Promise<string> {
    const prompt = `Debug this ${language} code${error ? ` with error: ${error}` : ''}:\n\`\`\`${language}\n${code}\n\`\`\`\n\nIssues and fixes:`;
    return this.generateText(modelId, prompt, { maxLength: 512, temperature: 0.2 });
  }

  async generateTests(modelId: string, code: string, language: string, framework?: string): Promise<string> {
    const prompt = `Generate ${framework || 'unit'} tests for this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nTests:`;
    return this.generateText(modelId, prompt, { maxLength: 1024, temperature: 0.3 });
  }

  async refactorCode(modelId: string, code: string, language: string, goal: string): Promise<string> {
    const prompt = `Refactor this ${language} code to ${goal}:\n\`\`\`${language}\n${code}\n\`\`\`\n\nRefactored code:`;
    return this.generateText(modelId, prompt, { maxLength: 1024, temperature: 0.2 });
  }

  private buildCodeCompletionPrompt(code: string, language: string): string {
    const lines = code.split('\n');
    const lastLine = lines[lines.length - 1];
    const context = lines.slice(-20).join('\n');

    return `Complete this ${language} code:\n\`\`\`${language}\n${context}\n\`\`\``;
  }

  unloadModel(modelId: string, task: string): void {
    const key = `${task}:${modelId}`;
    this.pipelines.delete(key);
  }

  unloadAll(): void {
    this.pipelines.clear();
    this.loadingPromises.clear();
  }

  getLoadedModels(): string[] {
    return Array.from(this.pipelines.keys());
  }
}

export function createTransformersClient(): TransformersClient {
  return new TransformersClient();
}

export const RECOMMENDED_CODE_MODELS: ModelInfo[] = [
  { id: 'Xenova/codegen-350M-mono', task: 'text-generation', size: '700MB', description: 'CodeGen 350M - Monolingual Python', languages: ['python'] },
  { id: 'Xenova/codegen-350M-multi', task: 'text-generation', size: '700MB', description: 'CodeGen 350M - Multilingual', languages: ['python', 'javascript', 'java', 'cpp', 'go', 'rust'] },
  { id: 'Xenova/incoder-1B', task: 'text-generation', size: '2GB', description: 'InCoder 1B - Code infilling', languages: ['python', 'javascript', 'typescript'] },
  { id: 'Xenova/CodeGPT-small-py', task: 'text-generation', size: '500MB', description: 'CodeGPT Small - Python focused', languages: ['python'] },
  { id: 'Xenova/CodeGPT-small-js', task: 'text-generation', size: '500MB', description: 'CodeGPT Small - JavaScript focused', languages: ['javascript', 'typescript'] },
] as const;

export const RECOMMENDED_EMBEDDING_MODELS: ModelInfo[] = [
  { id: 'Xenova/all-MiniLM-L6-v2', task: 'feature-extraction', size: '90MB', description: 'MiniLM - Fast semantic similarity' },
  { id: 'Xenova/multi-qa-MiniLM-L6-cos-v1', task: 'feature-extraction', size: '90MB', description: 'MiniLM - QA optimized' },
] as const;