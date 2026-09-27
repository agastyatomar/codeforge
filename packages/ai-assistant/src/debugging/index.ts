import { OllamaClient, createOllamaClient } from '../ollama';
import { TransformersClient, createTransformersClient } from '../transformers';
import { ContextManager, createContextManager, CodeContext } from '../context';
import { MonacoEditorManager } from '@codeforge/editor/monaco';
import type { ExecutionResult } from '@codeforge/core/types';

export interface DebugRequest {
  code: string;
  language: string;
  error?: string;
  executionResult?: ExecutionResult;
  context?: CodeContext;
  focus?: 'root-cause' | 'fix' | 'explanation' | 'all';
}

export interface DebugResult {
  analysis: string;
  rootCause: string;
  suggestedFix: string;
  fixedCode?: string;
  preventionTips: string[];
  model: string;
  provider: 'ollama' | 'transformers';
}

export interface DebugAction {
  type: 'fix' | 'explain' | 'refactor' | 'test';
  description: string;
  codeChange?: { file: string; oldCode: string; newCode: string };
}

export class DebuggingEngine {
  private ollamaClient: OllamaClient;
  private transformersClient: TransformersClient;
  private contextManager: ContextManager;
  private useOllama = true;

  constructor(monacoManager: MonacoEditorManager) {
    this.ollamaClient = createOllamaClient();
    this.transformersClient = createTransformersClient();
    this.contextManager = createContextManager(monacoManager);
  }

  async initialize(): Promise<void> {
    const healthy = await this.ollamaClient.checkHealth();
    this.useOllama = healthy;
  }

  async debug(request: DebugRequest): Promise<DebugResult> {
    const context = request.context || await this.contextManager.buildContext();
    const prompt = this.buildPrompt(request, context);

    if (this.useOllama) {
      try {
        const response = await this.ollamaClient.generate({
          prompt,
          options: { num_predict: 2048, temperature: 0.2 },
        });
        return this.parseDebugResponse(response.response, this.ollamaClient.getConfig().model, 'ollama');
      } catch (error) {
        console.warn('Ollama debugging failed, trying Transformers.js:', error);
      }
    }

    try {
      const result = await this.transformersClient.generateText(
        'Xenova/codegen-350M-multi',
        prompt,
        { maxLength: 2048, temperature: 0.2 }
      );
      return this.parseDebugResponse(result, 'Xenova/codegen-350M-multi', 'transformers');
    } catch (error) {
      console.error('Both debugging providers failed:', error);
      return {
        analysis: 'Failed to debug',
        rootCause: 'Unknown',
        suggestedFix: 'Unable to generate fix',
        preventionTips: [],
        model: '',
        provider: 'ollama',
      };
    }
  }

  async *streamDebug(request: DebugRequest): AsyncGenerator<string, void, unknown> {
    const context = request.context || await this.contextManager.buildContext();
    const prompt = this.buildPrompt(request, context);

    if (this.useOllama) {
      try {
        for await (const chunk of this.ollamaClient.streamGenerate({
          prompt,
          options: { num_predict: 2048, temperature: 0.2 },
        })) {
          yield chunk;
        }
        return;
      } catch (error) {
        console.warn('Ollama streaming failed:', error);
      }
    }
  }

  private buildPrompt(request: DebugRequest, context: CodeContext): string {
    const focusInstructions = {
      'root-cause': 'Focus on identifying the root cause of the error.',
      fix: 'Focus on providing a concrete fix for the issue.',
      explanation: 'Focus on explaining why the error occurred.',
      all: 'Provide comprehensive analysis: root cause, fix, and explanation.',
    };

    const relevantContext = context ? this.contextManager.getRelevantContext(request.code) : '';

    let prompt = `You are an expert debugger. Analyze this ${request.language} code that has an error.\n\n`;
    prompt += `Focus: ${focusInstructions[request.focus || 'all']}\n\n`;

    if (relevantContext) {
      prompt += `Project context:\n${relevantContext}\n\n`;
    }

    prompt += `Code:\n\`\`\`${request.language}\n${request.code}\n\`\`\`\n\n`;

    if (request.error) {
      prompt += `Error message:\n${request.error}\n\n`;
    }

    if (request.executionResult) {
      prompt += `Execution result:\n`;
      prompt += `Success: ${request.executionResult.success}\n`;
      prompt += `Output: ${request.executionResult.output}\n`;
      if (request.executionResult.error) {
        prompt += `Error: ${request.executionResult.error}\n`;
      }
      prompt += `Execution time: ${request.executionResult.executionTime}ms\n\n`;
    }

    prompt += `Provide your response as JSON with these fields:\n`;
    prompt += `{\n`;
    prompt += `  "analysis": "Detailed analysis of the issue",\n`;
    prompt += `  "rootCause": "The fundamental reason for the error",\n`;
    prompt += `  "suggestedFix": "Step-by-step fix instructions",\n`;
    prompt += `  "fixedCode": "Complete corrected code (optional)",\n`;
    prompt += `  "preventionTips": ["tip1", "tip2", ...]\n`;
    prompt += `}`;

    return prompt;
  }

  private parseDebugResponse(response: string, model: string, provider: 'ollama' | 'transformers'): DebugResult {
    let analysis = '';
    let rootCause = '';
    let suggestedFix = '';
    let fixedCode: string | undefined;
    let preventionTips: string[] = [];

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        analysis = parsed.analysis || '';
        rootCause = parsed.rootCause || '';
        suggestedFix = parsed.suggestedFix || '';
        fixedCode = parsed.fixedCode;
        preventionTips = parsed.preventionTips || [];
      }
    } catch {
      const sections = this.extractSections(response);
      analysis = sections.analysis || response;
      rootCause = sections.rootCause || 'See analysis';
      suggestedFix = sections.suggestedFix || 'See analysis';
      fixedCode = sections.fixedCode;
      preventionTips = sections.preventionTips || [];
    }

    return { analysis, rootCause, suggestedFix, fixedCode, preventionTips, model, provider };
  }

  private extractSections(text: string): { analysis: string; rootCause: string; suggestedFix: string; fixedCode?: string; preventionTips: string[] } {
    const sections = { analysis: '', rootCause: '', suggestedFix: '', fixedCode: undefined as string | undefined, preventionTips: [] as string[] };
    let currentField = 'analysis';

    const fieldPatterns = {
      analysis: /analysis\s*[:-]/i,
      rootCause: /root.?cause\s*[:-]/i,
      suggestedFix: /suggested.?fix|fix\s*[:-]/i,
      fixedCode: /fixed.?code|corrected.?code\s*[:-]/i,
      preventionTips: /prevention|tips\s*[:-]/i,
    };

    for (const line of text.split('\n')) {
      let matched = false;
      for (const [field, pattern] of Object.entries(fieldPatterns)) {
        if (pattern.test(line)) {
          currentField = field;
          matched = true;
          break;
        }
      }

      if (!matched && line.trim()) {
        (sections as any)[currentField] += line + '\n';
      }
    }

    if (sections.preventionTips.length === 0 && typeof sections.preventionTips === 'string') {
      sections.preventionTips = sections.preventionTips
        .split('\n')
        .map((l) => l.replace(/^[-*]\s*/, '').trim())
        .filter((l) => l.length > 0);
    }

    return sections;
  }

  async generateTestCase(request: DebugRequest): Promise<string> {
    const prompt = `Generate a minimal test case that reproduces this bug in ${request.language}:\n\n\`\`\`${request.language}\n${request.code}\n\`\`\`\n\nError: ${request.error || 'Unknown'}\n\nTest case:`;

    if (this.useOllama) {
      try {
        const response = await this.ollamaClient.generate({
          prompt,
          options: { num_predict: 1024, temperature: 0.3 },
        });
        return response.response;
      } catch {
        // Fall through
      }
    }

    return this.transformersClient.generateText('Xenova/codegen-350M-multi', prompt, { maxLength: 1024, temperature: 0.3 });
  }

  setUseOllama(use: boolean): void {
    this.useOllama = use;
  }

  getContextManager(): ContextManager {
    return this.contextManager;
  }
}

export function createDebuggingEngine(monacoManager: MonacoEditorManager): DebuggingEngine {
  return new DebuggingEngine(monacoManager);
}