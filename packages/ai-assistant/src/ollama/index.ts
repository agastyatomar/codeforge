import { z } from 'zod';

export const OllamaConfigSchema = z.object({
  baseUrl: z.string().url().default('http://localhost:11434'),
  model: z.string().default('codellama:7b'),
  temperature: z.number().min(0).max(2).default(0.2),
  topP: z.number().min(0).max(1).default(0.9),
  numPredict: z.number().int().positive().default(2048),
  timeout: z.number().int().positive().default(120000),
});

export type OllamaConfig = z.infer<typeof OllamaConfigSchema>;

export const GenerateRequestSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  system: z.string().optional(),
  template: z.string().optional(),
  context: z.array(z.number()).optional(),
  options: z.object({
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    top_k: z.number().optional(),
    num_predict: z.number().optional(),
    stop: z.array(z.string()).optional(),
  }).optional(),
  stream: z.boolean().default(false),
  raw: z.boolean().default(false),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),
  response: z.string(),
  done: z.boolean(),
  context: z.array(z.number()).optional(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  images: z.array(z.string()).optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  options: z.object({
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    top_k: z.number().optional(),
    num_predict: z.number().optional(),
    stop: z.array(z.string()).optional(),
  }).optional(),
  stream: z.boolean().default(false),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),
  message: ChatMessageSchema,
  done: z.boolean(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export class OllamaClient {
  private config: OllamaConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = OllamaConfigSchema.parse(config);
  }

  async generate(request: Partial<GenerateRequest>): Promise<GenerateResponse> {
    const fullRequest: GenerateRequest = {
      model: this.config.model,
      ...request,
      options: {
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.numPredict,
        ...request.options,
      },
    } as GenerateRequest;

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRequest),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      return GenerateResponseSchema.parse(await response.json());
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  async chat(request: Partial<ChatRequest>): Promise<ChatResponse> {
    const fullRequest: ChatRequest = {
      model: this.config.model,
      ...request,
      options: {
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.numPredict,
        ...request.options,
      },
    } as ChatRequest;

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRequest),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      return ChatResponseSchema.parse(await response.json());
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  async *streamGenerate(request: Partial<GenerateRequest>): AsyncGenerator<string, void, unknown> {
    const fullRequest: GenerateRequest = {
      ...request,
      model: this.config.model,
      stream: true,
      options: {
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.numPredict,
        ...request.options,
      },
    } as GenerateRequest;

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRequest),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.response) yield data.response;
              if (data.done) return;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  async *streamChat(request: Partial<ChatRequest>): AsyncGenerator<ChatMessage, void, unknown> {
    const fullRequest: ChatRequest = {
      ...request,
      model: this.config.model,
      stream: true,
      options: {
        temperature: this.config.temperature,
        top_p: this.config.topP,
        num_predict: this.config.numPredict,
        ...request.options,
      },
    } as ChatRequest;

    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRequest),
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.message) yield data.message;
              if (data.done) return;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.config.baseUrl}/api/tags`);
    if (!response.ok) throw new Error('Failed to list models');
    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  }

  async pullModel(model: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model, stream: false }),
    });
    if (!response.ok) throw new Error(`Failed to pull model: ${model}`);
  }

  async deleteModel(model: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    });
    if (!response.ok) throw new Error(`Failed to delete model: ${model}`);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  cancel(): void {
    this.abortController?.abort();
  }

  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<OllamaConfig>): void {
    this.config = OllamaConfigSchema.parse({ ...this.config, ...config });
  }
}

export function createOllamaClient(config?: Partial<OllamaConfig>): OllamaClient {
  return new OllamaClient(config);
}

export const RECOMMENDED_MODELS = [
  { name: 'codellama:7b', description: 'Code Llama 7B - General purpose code model', size: '3.8GB' },
  { name: 'codellama:13b', description: 'Code Llama 13B - Better quality', size: '7.3GB' },
  { name: 'codellama:34b', description: 'Code Llama 34B - Best quality', size: '19GB' },
  { name: 'deepseek-coder:6.7b', description: 'DeepSeek Coder 6.7B - Strong code generation', size: '3.8GB' },
  { name: 'deepseek-coder:33b', description: 'DeepSeek Coder 33B - Best open code model', size: '18GB' },
  { name: 'wizardcoder:7b', description: 'WizardCoder 7B - Instruction tuned for code', size: '3.8GB' },
  { name: 'starcoder2:7b', description: 'StarCoder2 7B - Multilingual code model', size: '3.8GB' },
  { name: 'qwen2.5-coder:7b', description: 'Qwen2.5 Coder 7B - Latest Alibaba code model', size: '4.4GB' },
] as const;