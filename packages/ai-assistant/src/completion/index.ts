import { OllamaClient, createOllamaClient } from '../ollama';
import { TransformersClient, createTransformersClient } from '../transformers';
import { ContextManager, createContextManager, CodeContext } from '../context';
import { MonacoEditorManager } from '@codeforge/editor/monaco';

export interface CompletionRequest {
  prefix: string;
  suffix: string;
  language: string;
  context?: CodeContext;
  maxTokens?: number;
}

export interface CompletionResult {
  completion: string;
  confidence: number;
  model: string;
  provider: 'ollama' | 'transformers';
}

export interface InlineCompletionItem {
  text: string;
  range: { start: { line: number; column: number }; end: { line: number; column: number } };
  confidence: number;
}

export class CompletionEngine {
  private ollamaClient: OllamaClient;
  private transformersClient: TransformersClient;
  private contextManager: ContextManager;
  private useOllama = true;
  private enabled = true;

  constructor(monacoManager: MonacoEditorManager) {
    this.ollamaClient = createOllamaClient();
    this.transformersClient = createTransformersClient();
    this.contextManager = createContextManager(monacoManager);
  }

  async initialize(): Promise<void> {
    const healthy = await this.ollamaClient.checkHealth();
    this.useOllama = healthy;

    if (!healthy) {
      console.warn('Ollama not available, falling back to Transformers.js');
    }
  }

  async getCompletion(request: CompletionRequest): Promise<CompletionResult> {
    if (!this.enabled) {
      return { completion: '', confidence: 0, model: '', provider: 'ollama' };
    }

    const context = request.context || await this.contextManager.buildContext();
    const prompt = this.buildPrompt(request, context);

    if (this.useOllama) {
      try {
        const response = await this.ollamaClient.generate({
          prompt,
          options: { num_predict: request.maxTokens || 128, temperature: 0.2 },
        });
        return {
          completion: this.extractCompletion(response.response, request.suffix),
          confidence: 0.9,
          model: this.ollamaClient.getConfig().model,
          provider: 'ollama',
        };
      } catch (error) {
        console.warn('Ollama completion failed, trying Transformers.js:', error);
      }
    }

    try {
      const completion = await this.transformersClient.generateText(
        'Xenova/codegen-350M-multi',
        prompt,
        { maxLength: request.maxTokens || 128, temperature: 0.2 }
      );
      return {
        completion: this.extractCompletion(completion, request.suffix),
        confidence: 0.7,
        model: 'Xenova/codegen-350M-multi',
        provider: 'transformers',
      };
    } catch (error) {
      console.error('Both completion providers failed:', error);
      return { completion: '', confidence: 0, model: '', provider: 'ollama' };
    }
  }

  async *streamCompletion(request: CompletionRequest): AsyncGenerator<string, void, unknown> {
    if (!this.enabled) return;

    const context = request.context || await this.contextManager.buildContext();
    const prompt = this.buildPrompt(request, context);

    if (this.useOllama) {
      try {
        for await (const chunk of this.ollamaClient.streamGenerate({
          prompt,
          options: { num_predict: request.maxTokens || 128, temperature: 0.2 },
        })) {
          yield chunk;
        }
        return;
      } catch (error) {
        console.warn('Ollama streaming failed:', error);
      }
    }
  }

  private buildPrompt(request: CompletionRequest, context: CodeContext): string {
    const relevantContext = context ? this.contextManager.getRelevantContext(request.prefix) : '';
    const languageHint = this.getLanguageHint(request.language);

    let prompt = '';

    if (relevantContext) {
      prompt += `Context:\n${relevantContext}\n\n`;
    }

    prompt += `Language: ${request.language}\n`;
    prompt += languageHint;
    prompt += `Complete the following code:\n\`\`\`${request.language}\n${request.prefix}`;
    if (request.suffix) {
      prompt += `\n${request.suffix}`;
    }
    prompt += '\n```\n\nCompletion:';

    return prompt;
  }

  private getLanguageHint(language: string): string {
    const hints: Record<string, string> = {
      python: 'Follow PEP 8. Use type hints. Prefer list comprehensions.\n',
      javascript: 'Use modern ES6+ syntax. Prefer const/let. Use arrow functions.\n',
      typescript: 'Use strict types. Prefer interfaces over types. Use generics.\n',
      rust: 'Follow Rust idioms. Use Result/Option. Prefer iterators.\n',
      go: 'Follow Go idioms. Handle errors explicitly. Use short declarations.\n',
      java: 'Follow Java conventions. Use proper encapsulation. Use streams.\n',
      cpp: 'Use modern C++. Prefer RAII. Use algorithms over loops.\n',
    };
    return hints[language] || '';
  }

  private extractCompletion(response: string, suffix: string): string {
    let completion = response.trim();

    const suffixLines = suffix.trim().split('\n');
    if (suffixLines.length > 0) {
      const firstSuffixLine = suffixLines[0].trim();
      const index = completion.indexOf(firstSuffixLine);
      if (index > 0) {
        completion = completion.substring(0, index).trim();
      }
    }

    const stopPatterns = ['```', '\n\n\n', 'Completion:', 'Context:', 'Language:'];
    for (const pattern of stopPatterns) {
      const index = completion.indexOf(pattern);
      if (index > 0) {
        completion = completion.substring(0, index).trim();
      }
    }

    return completion;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setUseOllama(use: boolean): void {
    this.useOllama = use;
  }

  getContextManager(): ContextManager {
    return this.contextManager;
  }
}

export function createCompletionEngine(monacoManager: MonacoEditorManager): CompletionEngine {
  return new CompletionEngine(monacoManager);
}

export async function registerInlineCompletionProvider(
  monacoManager: MonacoEditorManager,
  completionEngine: CompletionEngine
): Promise<void> {
  const { languages } = await import('monaco-editor');

  languages.registerInlineCompletionsProvider('*', {
    provideInlineCompletions: async (model, position, context, token) => {
      if (!completionEngine.isEnabled()) return { items: [] };

      const prefix = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const suffix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: model.getLineCount(),
        endColumn: model.getLineMaxColumn(model.getLineCount()),
      });

      const language = model.getLanguageId();

      try {
        const result = await completionEngine.getCompletion({ prefix, suffix, language });
        if (result.completion) {
          return {
            items: [{
              insertText: result.completion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
              filterText: result.completion,
            }],
          };
        }
      } catch (error) {
        console.error('Inline completion error:', error);
      }

      return { items: [] };
    },
  });
}