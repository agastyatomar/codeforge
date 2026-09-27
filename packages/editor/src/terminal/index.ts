import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

export interface TerminalConfig {
  cols?: number;
  rows?: number;
  cursorBlink?: boolean;
  fontSize?: number;
  fontFamily?: string;
  theme?: TerminalTheme;
  allowTransparency?: boolean;
  scrollback?: number;
  disableStdin?: boolean;
  convertEol?: boolean;
  rightClickSelectsWord?: boolean;
}

export interface TerminalTheme {
  foreground?: string;
  background?: string;
  cursor?: string;
  cursorAccent?: string;
  selectionBackground?: string;
  black?: string;
  red?: string;
  green?: string;
  yellow?: string;
  blue?: string;
  magenta?: string;
  cyan?: string;
  white?: string;
  brightBlack?: string;
  brightRed?: string;
  brightGreen?: string;
  brightYellow?: string;
  brightBlue?: string;
  brightMagenta?: string;
  brightCyan?: string;
  brightWhite?: string;
}

export class TerminalManager {
  private terminals = new Map<string, XTermTerminal>();
  private defaultConfig: TerminalConfig;

  constructor(config: TerminalConfig = {}) {
    this.defaultConfig = {
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      theme: {
        foreground: '#e6edf3',
        background: '#0d1117',
        cursor: '#58a6ff',
        cursorAccent: '#0d1117',
        selectionBackground: '#264f78',
        black: '#161b22',
        red: '#ff7b72',
        green: '#3fb950',
        yellow: '#d29922',
        blue: '#58a6ff',
        magenta: '#bc8cff',
        cyan: '#39c5cf',
        white: '#e6edf3',
        brightBlack: '#484f58',
        brightRed: '#ff9779',
        brightGreen: '#56d364',
        brightYellow: '#e3b341',
        brightBlue: '#79c0ff',
        brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd',
        brightWhite: '#ffffff',
      },
      allowTransparency: false,
      scrollback: 10000,
      disableStdin: false,
      convertEol: true,
      rightClickSelectsWord: true,
      ...config,
    };
  }

  createTerminal(id: string, container: HTMLElement, config?: TerminalConfig): XTermTerminal {
    const terminal = new XTermTerminal({ ...this.defaultConfig, ...config });
    terminal.attach(container);
    this.terminals.set(id, terminal);
    return terminal;
  }

  getTerminal(id: string): XTermTerminal | undefined {
    return this.terminals.get(id);
  }

  getAllTerminals(): XTermTerminal[] {
    return Array.from(this.terminals.values());
  }

  removeTerminal(id: string): void {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(id);
    }
  }

  removeAllTerminals(): void {
    for (const terminal of this.terminals.values()) {
      terminal.dispose();
    }
    this.terminals.clear();
  }

  setDefaultConfig(config: Partial<TerminalConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

export class XTermTerminal {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private webLinksAddon: WebLinksAddon;
  private config: TerminalConfig;
  private disposed = false;
  private buffers: string[] = [];

  constructor(config: TerminalConfig) {
    this.config = config;
    this.terminal = new Terminal({
      cols: config.cols,
      rows: config.rows,
      cursorBlink: config.cursorBlink,
      fontSize: config.fontSize,
      fontFamily: config.fontFamily,
      theme: config.theme,
      allowTransparency: config.allowTransparency,
      scrollback: config.scrollback,
      disableStdin: config.disableStdin,
      convertEol: config.convertEol,
      rightClickSelectsWord: config.rightClickSelectsWord,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    this.webLinksAddon = new WebLinksAddon();
    this.terminal.loadAddon(this.webLinksAddon);
  }

  attach(container: HTMLElement): void {
    this.terminal.open(container);
    this.fitAddon.fit();

    const resizeObserver = new ResizeObserver(() => {
      this.fitAddon.fit();
    });
    resizeObserver.observe(container);
  }

  write(data: string): void {
    if (this.disposed) return;
    this.terminal.write(data);
  }

  writeln(data: string): void {
    this.write(data + '\r\n');
  }

  clear(): void {
    this.terminal.clear();
  }

  reset(): void {
    this.terminal.reset();
  }

  focus(): void {
    this.terminal.focus();
  }

  blur(): void {
    this.terminal.blur();
  }

  getBuffer(): string {
    return this.terminal.buffer.active.toString();
  }

  getLines(): string[] {
    const lines: string[] = [];
    for (let i = 0; i < this.terminal.buffer.active.length; i++) {
      const line = this.terminal.buffer.active.getLine(i);
      if (line) lines.push(line.translateToString());
    }
    return lines;
  }

  onData(callback: (data: string) => void): () => void {
    return this.terminal.onData(callback);
  }

  onKey(callback: (key: { key: string; domEvent: KeyboardEvent }) => void): () => void {
    return this.terminal.onKey(callback);
  }

  onResize(callback: (size: { cols: number; rows: number }) => void): () => void {
    return this.terminal.onResize(callback);
  }

  onTitleChange(callback: (title: string) => void): () => void {
    return this.terminal.onTitleChange(callback);
  }

  setOption<K extends keyof Terminal.Options>(key: K, value: Terminal.Options[K]): void {
    this.terminal.setOption(key, value);
  }

  getOption<K extends keyof Terminal.Options>(key: K): Terminal.Options[K] {
    return this.terminal.getOption(key);
  }

  resize(columns: number, rows: number): void {
    this.terminal.resize(columns, rows);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.terminal.dispose();
    this.fitAddon.dispose();
  }
}

export function createTerminalManager(config?: TerminalConfig): TerminalManager {
  return new TerminalManager(config);
}

export const defaultTheme: TerminalTheme = {
  foreground: '#e6edf3',
  background: '#0d1117',
  cursor: '#58a6ff',
  cursorAccent: '#0d1117',
  selectionBackground: '#264f78',
  black: '#161b22',
  red: '#ff7b72',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#e6edf3',
  brightBlack: '#484f58',
  brightRed: '#ff9779',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#ffffff',
};

export const lightTheme: TerminalTheme = {
  foreground: '#24292f',
  background: '#ffffff',
  cursor: '#0969da',
  cursorAccent: '#ffffff',
  selectionBackground: '#d2e9ff',
  black: '#ffffff',
  red: '#cf222e',
  green: '#116329',
  yellow: '#9a6700',
  blue: '#0969da',
  magenta: '#8250df',
  cyan: '#1b7c83',
  white: '#24292f',
  brightBlack: '#6e7781',
  brightRed: '#cf222e',
  brightGreen: '#116329',
  brightYellow: '#9a6700',
  brightBlue: '#0969da',
  brightMagenta: '#8250df',
  brightCyan: '#1b7c83',
  brightWhite: '#24292f',
};