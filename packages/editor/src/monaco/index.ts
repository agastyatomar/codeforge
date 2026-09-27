import * as monaco from 'monaco-editor';
import { languages, editor, Uri } from 'monaco-editor';
import type { EditorFile, ExecutionResult } from '@codeforge/core/types';

export interface MonacoEditorConfig {
  theme?: 'vs-dark' | 'vs-light' | 'hc-black' | 'hc-light';
  language?: string;
  automaticLayout?: boolean;
  minimap?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  fontSize?: number;
  tabSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  folding?: boolean;
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  cursorStyle?: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
  multiCursorModifier?: 'ctrlCmd' | 'alt';
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  suggestOnTriggerCharacters?: boolean;
  quickSuggestions?: boolean | { other: boolean; comments: boolean; strings: boolean };
  parameterHints?: boolean;
  hover?: boolean;
  lightbulb?: boolean;
  codeLens?: boolean;
  foldingStrategy?: 'auto' | 'indentation';
  showUnused?: boolean;
  inlineSuggest?: boolean;
}

export class MonacoEditorManager {
  private editors = new Map<string, editor.IStandaloneCodeEditor>();
  private models = new Map<string, editor.ITextModel>();
  private config: MonacoEditorConfig;
  private disposables: monaco.IDisposable[] = [];

  constructor(config: MonacoEditorConfig = {}) {
    this.config = {
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: true,
      lineNumbers: 'on',
      fontSize: 14,
      tabSize: 2,
      wordWrap: 'on',
      folding: true,
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorStyle: 'line',
      multiCursorModifier: 'ctrlCmd',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: true,
      hover: true,
      lightbulb: true,
      codeLens: true,
      foldingStrategy: 'auto',
      showUnused: true,
      inlineSuggest: true,
      ...config,
    };

    this.configureMonaco();
  }

  private configureMonaco(): void {
    monaco.editor.defineTheme('codeforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#213852',
        'editorCursor.foreground': '#58a6ff',
        'editorLineNumber.foreground': '#8b949e',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorWhitespace.foreground': '#21262d',
        'editorHoverWidget.background': '#161b22',
        'editorHoverWidget.border': '#30363d',
        'editorSuggestWidget.background': '#161b22',
        'editorSuggestWidget.border': '#30363d',
        'editorSuggestWidget.selectedBackground': '#264f78',
        'editorWidget.background': '#161b22',
        'editorWidget.border': '#30363d',
        'panel.background': '#0d1117',
        'panel.border': '#30363d',
        'statusBar.background': '#161b22',
        'statusBar.foreground': '#e6edf3',
        'titleBar.activeBackground': '#0d1117',
        'titleBar.activeForeground': '#e6edf3',
        'activityBar.background': '#0d1117',
        'activityBar.foreground': '#e6edf3',
        'sideBar.background': '#0d1117',
        'sideBar.foreground': '#e6edf3',
        'sideBar.border': '#30363d',
      },
    });

    monaco.editor.setTheme(this.config.theme === 'hc-black' ? 'hc-black' : this.config.theme === 'hc-light' ? 'hc-light' : 'codeforge-dark');
  }

  createEditor(container: HTMLElement, file: EditorFile): editor.IStandaloneCodeEditor {
    const model = this.getOrCreateModel(file);
    const editorInstance = monaco.editor.create(container, {
      model,
      theme: this.config.theme,
      automaticLayout: this.config.automaticLayout,
      minimap: { enabled: this.config.minimap },
      lineNumbers: this.config.lineNumbers,
      fontSize: this.config.fontSize,
      tabSize: this.config.tabSize,
      wordWrap: this.config.wordWrap,
      folding: this.config.folding,
      renderWhitespace: this.config.renderWhitespace,
      cursorBlinking: this.config.cursorBlinking,
      cursorStyle: this.config.cursorStyle,
      multiCursorModifier: this.config.multiCursorModifier,
      formatOnPaste: this.config.formatOnPaste,
      formatOnType: this.config.formatOnType,
      suggestOnTriggerCharacters: this.config.suggestOnTriggerCharacters,
      quickSuggestions: this.config.quickSuggestions,
      parameterHints: { enabled: this.config.parameterHints },
      hover: { enabled: this.config.hover },
      lightbulb: { enabled: this.config.lightbulb },
      codeLens: this.config.codeLens,
      foldingStrategy: this.config.foldingStrategy,
      showUnused: this.config.showUnused,
      inlineSuggest: { enabled: this.config.inlineSuggest },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      renderLineHighlight: 'all',
      renderFinalNewline: true,
      insertSpaces: true,
      detectIndentation: true,
      trimAutoWhitespace: true,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoSurround: 'languageDefined',
      autoIndent: 'full',
      electricAction: 'keepIndent',
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true, highlightActiveIndentation: true },
    });

    this.setupEditorEvents(editorInstance, file.path);
    this.editors.set(file.path, editorInstance);

    if (file.cursorPosition) {
      editorInstance.setPosition(file.cursorPosition);
    }

    if (file.selection) {
      editorInstance.setSelection(file.selection);
    }

    return editorInstance;
  }

  private getOrCreateModel(file: EditorFile): editor.ITextModel {
    const uri = Uri.file(file.path);
    let model = this.models.get(file.path);

    if (!model) {
      model = monaco.editor.createModel(file.content, file.language, uri);
      this.models.set(file.path, model);
    } else {
      model.setValue(file.content);
    }

    return model;
  }

  private setupEditorEvents(editorInstance: editor.IStandaloneCodeEditor, filePath: string): void {
    const onChange = editorInstance.onDidChangeModelContent(() => {
      const model = editorInstance.getModel();
      if (model) {
        this.updateFileContent(filePath, model.getValue());
      }
    });

    const onCursorChange = editorInstance.onDidChangeCursorPosition((e) => {
      this.updateCursorPosition(filePath, e.position);
    });

    const onSelectionChange = editorInstance.onDidChangeCursorSelection((e) => {
      this.updateSelection(filePath, e.selection);
    });

    this.disposables.push(onChange, onCursorChange, onSelectionChange);
  }

  private updateFileContent(filePath: string, content: string): void {
    const editorInstance = this.editors.get(filePath);
    if (editorInstance) {
      const model = editorInstance.getModel();
      if (model) {
        // File content updated - would notify via event bus
      }
    }
  }

  private updateCursorPosition(filePath: string, position: { lineNumber: number; column: number }): void {
    // Update cursor position in file state
  }

  private updateSelection(filePath: string, selection: monaco.Selection | null): void {
    // Update selection in file state
  }

  getEditor(filePath: string): editor.IStandaloneCodeEditor | undefined {
    return this.editors.get(filePath);
  }

  getModel(filePath: string): editor.ITextModel | undefined {
    return this.models.get(filePath);
  }

  getAllEditors(): editor.IStandaloneCodeEditor[] {
    return Array.from(this.editors.values());
  }

  getAllModels(): editor.ITextModel[] {
    return Array.from(this.models.values());
  }

  closeEditor(filePath: string): void {
    const editorInstance = this.editors.get(filePath);
    if (editorInstance) {
      editorInstance.dispose();
      this.editors.delete(filePath);
    }

    const model = this.models.get(filePath);
    if (model) {
      model.dispose();
      this.models.delete(filePath);
    }
  }

  closeAllEditors(): void {
    for (const editorInstance of this.editors.values()) {
      editorInstance.dispose();
    }
    this.editors.clear();

    for (const model of this.models.values()) {
      model.dispose();
    }
    this.models.clear();
  }

  setTheme(theme: string): void {
    monaco.editor.setTheme(theme);
    this.config.theme = theme as any;
  }

  getTheme(): string {
    return this.config.theme || 'vs-dark';
  }

  updateConfig(config: Partial<MonacoEditorConfig>): void {
    this.config = { ...this.config, ...config };

    for (const editorInstance of this.editors.values()) {
      editorInstance.updateOptions(this.config);
    }
  }

  async formatDocument(filePath: string): Promise<void> {
    const editorInstance = this.editors.get(filePath);
    if (editorInstance) {
      await editorInstance.getAction('editor.action.formatDocument')?.run();
    }
  }

  async formatSelection(filePath: string): Promise<void> {
    const editorInstance = this.editors.get(filePath);
    if (editorInstance) {
      await editorInstance.getAction('editor.action.formatSelection')?.run();
    }
  }

  dispose(): void {
    this.closeAllEditors();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}

export function createMonacoEditorManager(config?: MonacoEditorConfig): MonacoEditorManager {
  return new MonacoEditorManager(config);
}

export function registerLanguage(language: languages.LanguageRegistration): void {
  languages.register(language);
}

export function setMonarchTokensProvider(languageId: string, provider: languages.IMonarchLanguage): void {
  languages.setMonarchTokensProvider(languageId, provider);
}

export function registerCompletionItemProvider(languageId: string, provider: languages.CompletionItemProvider): void {
  languages.registerCompletionItemProvider(languageId, provider);
}

export function registerHoverProvider(languageId: string, provider: languages.HoverProvider): void {
  languages.registerHoverProvider(languageId, provider);
}

export function registerDefinitionProvider(languageId: string, provider: languages.DefinitionProvider): void {
  languages.registerDefinitionProvider(languageId, provider);
}

export function registerReferenceProvider(languageId: string, provider: languages.ReferenceProvider): void {
  languages.registerReferenceProvider(languageId, provider);
}

export function registerDocumentSymbolProvider(languageId: string, provider: languages.DocumentSymbolProvider): void {
  languages.registerDocumentSymbolProvider(languageId, provider);
}

export function registerCodeActionProvider(languageId: string, provider: languages.CodeActionProvider): void {
  languages.registerCodeActionProvider(languageId, provider);
}

export function registerDocumentFormattingEditProvider(languageId: string, provider: languages.DocumentFormattingEditProvider): void {
  languages.registerDocumentFormattingEditProvider(languageId, provider);
}

export function registerOnTypeFormattingEditProvider(languageId: string, provider: languages.OnTypeFormattingEditProvider): void {
  languages.registerOnTypeFormattingEditProvider(languageId, provider);
}