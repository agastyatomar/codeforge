import { OllamaClient, createOllamaClient } from '../ollama';
import { TransformersClient, createTransformersClient } from '../transformers';
import { ContextManager, createContextManager, CodeContext } from '../context';
import { MonacoEditorManager } from '@codeforge/editor/monaco';

export interface ExplanationRequest {
  code: string;
  language: string;
  detailLevel: 'brief' | 'detailed' | 'comprehensive';
  focus?: 'logic' | 'performance' | 'security' | 'style' | 'all';
  context?: CodeContext;
}

export interface ExplanationResult {
  explanation: string;
  sections: ExplanationSection[];
  model: string;
  provider: 'ollama' | 'transformers';
}

export interface ExplanationSection {
  title: string;
  content: string;
  type: 'overview' | 'line-by-line' | 'concepts' | 'patterns' | 'issues' | 'suggestions';
}

export class ExplanationEngine {
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

  async explain(request: ExplanationRequest): Promise<ExplanationResult> {
    const context = request.context || await this.contextManager.buildContext();
    const prompt = this.buildPrompt(request, context);

    if (this.useOllama) {
      try {
        const response = await this.ollamaClient.generate({
          prompt,
          options: { num_predict: 2048, temperature: 0.3 },
        });
        return this.parseExplanation(response.response, this.ollamaClient.getConfig().model, 'ollama');
      } catch (error) {
        console.warn('Ollama explanation failed, trying Transformers.js:', error);
      }
    }

    try {
      const explanation = await this.transformersClient.generateText(
        'Xenova/codegen-350M-multi',
        prompt,
        { maxLength: 2048, temperature: 0.3 }
      );
      return this.parseExplanation(explanation, 'Xenova/codegen-350M-multi', 'transformers');
    } catch (error) {
      console.error('Both explanation providers failed:', error);
      return {
        explanation: 'Failed to generate explanation',
        sections: [],
        model: '',
        provider: 'ollama',
      };
    }
  }

  async *streamExplanation(request: ExplanationRequest): AsyncGenerator<string, void, unknown> {
    const context = request.context || await this.contextManager.buildContext();
    const prompt = this.buildPrompt(request, context);

    if (this.useOllama) {
      try {
        for await (const chunk of this.ollamaClient.streamGenerate({
          prompt,
          options: { num_predict: 2048, temperature: 0.3 },
        })) {
          yield chunk;
        }
        return;
      } catch (error) {
        console.warn('Ollama streaming failed:', error);
      }
    }
  }

  private buildPrompt(request: ExplanationRequest, context: CodeContext): string {
    const detailInstructions = {
      brief: 'Provide a concise 2-3 sentence summary.',
      detailed: 'Provide a thorough explanation covering key concepts, logic flow, and important details.',
      comprehensive: 'Provide an exhaustive explanation including line-by-line analysis, design patterns, potential issues, and improvements.',
    };

    const focusInstructions = {
      logic: 'Focus on the algorithmic logic and control flow.',
      performance: 'Focus on time/space complexity, bottlenecks, and optimization opportunities.',
      security: 'Focus on security vulnerabilities, input validation, and safe practices.',
      style: 'Focus on code style, best practices, and maintainability.',
      all: 'Cover all aspects: logic, performance, security, and style.',
    };

    const relevantContext = context ? this.contextManager.getRelevantContext(request.code) : '';

    let prompt = `You are an expert programming instructor. Explain the following ${request.language} code.\n\n`;

    prompt += `Detail level: ${detailInstructions[request.detailLevel]}\n`;
    prompt += `Focus: ${focusInstructions[request.focus || 'all']}\n\n`;

    if (relevantContext) {
      prompt += `Project context:\n${relevantContext}\n\n`;
    }

    prompt += `Code to explain:\n\`\`\`${request.language}\n${request.code}\n\`\`\`\n\n`;

    prompt += `Provide a structured explanation with these sections:\n`;
    prompt += `1. Overview - What does this code do?\n`;
    prompt += `2. Line-by-line analysis - Key lines explained\n`;
    prompt += `3. Concepts used - Programming concepts demonstrated\n`;
    prompt += `4. Patterns - Design patterns or idioms used\n`;
    prompt += `5. Potential issues - Bugs, edge cases, or improvements\n`;
    prompt += `6. Suggestions - How to improve or extend\n\n`;

    prompt += `Format as JSON with sections array containing title, content, and type.`;

    return prompt;
  }

  private parseExplanation(response: string, model: string, provider: 'ollama' | 'transformers'): ExplanationResult {
    let explanation = response;
    let sections: ExplanationSection[] = [];

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.sections && Array.isArray(parsed.sections)) {
          sections = parsed.sections;
          explanation = parsed.explanation || sections.map((s) => s.content).join('\n\n');
        }
      }
    } catch {
      sections = this.extractSectionsFromText(response);
    }

    if (sections.length === 0) {
      sections = [
        { title: 'Explanation', content: explanation, type: 'overview' },
      ];
    }

    return { explanation, sections, model, provider };
  }

  private extractSectionsFromText(text: string): ExplanationSection[] {
    const sections: ExplanationSection[] = [];
    const lines = text.split('\n');
    let currentSection: ExplanationSection | null = null;

    for (const line of lines) {
      const headerMatch = line.match(/^(\d+\.?\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[:-]/);
      if (headerMatch) {
        if (currentSection) sections.push(currentSection);
        const title = headerMatch[2];
        currentSection = { title, content: '', type: this.inferType(title) };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      } else if (line.trim()) {
        if (!currentSection) {
          currentSection = { title: 'Explanation', content: '', type: 'overview' };
        }
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) sections.push(currentSection);

    return sections.length > 0 ? sections : [{ title: 'Explanation', content: text, type: 'overview' }];
  }

  private inferType(title: string): ExplanationSection['type'] {
    const lower = title.toLowerCase();
    if (lower.includes('overview') || lower.includes('summary')) return 'overview';
    if (lower.includes('line') || lower.includes('step')) return 'line-by-line';
    if (lower.includes('concept') || lower.includes('theory')) return 'concepts';
    if (lower.includes('pattern') || lower.includes('idiom')) return 'patterns';
    if (lower.includes('issue') || lower.includes('bug') || lower.includes('problem')) return 'issues';
    if (lower.includes('suggest') || lower.includes('improve') || lower.includes('recommend')) return 'suggestions';
    return 'overview';
  }

  setUseOllama(use: boolean): void {
    this.useOllama = use;
  }

  getContextManager(): ContextManager {
    return this.contextManager;
  }
}

export function createExplanationEngine(monacoManager: MonacoEditorManager): ExplanationEngine {
  return new ExplanationEngine(monacoManager);
}