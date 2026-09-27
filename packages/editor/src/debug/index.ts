import type { DebugProtocol } from 'vscode-debugprotocol';

export interface DebugSessionConfig {
  type: string;
  request: 'launch' | 'attach';
  name: string;
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  stopOnEntry?: boolean;
  sourceMaps?: boolean;
  outFiles?: string[];
  skipFiles?: string[];
}

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  condition?: string;
  hitCondition?: string;
  logMessage?: string;
  enabled: boolean;
  verified: boolean;
}

export interface StackFrame {
  id: number;
  name: string;
  source: { path: string; name: string };
  line: number;
  column: number;
  moduleId?: string;
}

export interface Variable {
  name: string;
  value: string;
  type?: string;
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
}

export interface DebugEvent {
  type: 'stopped' | 'continued' | 'exited' | 'terminated' | 'thread' | 'output' | 'breakpoint' | 'module' | 'loadedSource';
  body: Record<string, unknown>;
}

export class DebugAdapter {
  private sessions = new Map<string, DebugSession>();
  private sequence = 1;

  createSession(config: DebugSessionConfig): DebugSession {
    const session = new DebugSession(config, this.getNextSequence());
    this.sessions.set(session.id, session);
    return session;
  }

  getSession(id: string): DebugSession | undefined {
    return this.sessions.get(id);
  }

  removeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.terminate();
      this.sessions.delete(id);
    }
  }

  getAllSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }

  private getNextSequence(): number {
    return this.sequence++;
  }
}

export class DebugSession {
  id: string;
  config: DebugSessionConfig;
  state: 'initializing' | 'running' | 'stopped' | 'terminated' = 'initializing';
  breakpoints = new Map<string, Breakpoint[]>();
  private handlers = new Set<(event: DebugEvent) => void>();

  constructor(config: DebugSessionConfig, id: number) {
    this.id = `session-${id}`;
    this.config = config;
  }

  async initialize(): Promise<void> {
    this.state = 'running';
    this.emit({ type: 'initialized', body: {} });
  }

  async launch(): Promise<void> {
    await this.initialize();
    this.emit({ type: 'started', body: {} });
  }

  async attach(): Promise<void> {
    await this.initialize();
    this.emit({ type: 'attached', body: {} });
  }

  async setBreakpoints(file: string, breakpoints: Breakpoint[]): Promise<Breakpoint[]> {
    const verified = breakpoints.map((bp) => ({
      ...bp,
      id: bp.id || `bp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      verified: true,
    }));
    this.breakpoints.set(file, verified);
    this.emit({ type: 'breakpoint', body: { breakpoints: verified, file } });
    return verified;
  }

  async getBreakpoints(file: string): Promise<Breakpoint[]> {
    return this.breakpoints.get(file) || [];
  }

  async removeBreakpoints(file: string): Promise<void> {
    this.breakpoints.delete(file);
  }

  async continue(threadId: number): Promise<void> {
    this.state = 'running';
    this.emit({ type: 'continued', body: { threadId, allThreadsContinued: true } });
  }

  async pause(threadId: number): Promise<void> {
    this.state = 'stopped';
    this.emit({ type: 'stopped', body: { reason: 'pause', threadId } });
  }

  async stepIn(threadId: number): Promise<void> {
    this.state = 'running';
    this.emit({ type: 'stopped', body: { reason: 'step', threadId } });
  }

  async stepOut(threadId: number): Promise<void> {
    this.state = 'running';
    this.emit({ type: 'stopped', body: { reason: 'step', threadId } });
  }

  async next(threadId: number): Promise<void> {
    this.state = 'running';
    this.emit({ type: 'stopped', body: { reason: 'step', threadId } });
  }

  async getStackTrace(threadId: number, startFrame: number, levels: number): Promise<StackFrame[]> {
    return [];
  }

  async getVariables(variablesReference: number): Promise<Variable[]> {
    return [];
  }

  async evaluate(expression: string, frameId?: number): Promise<{ result: string; variablesReference: number }> {
    return { result: 'undefined', variablesReference: 0 };
  }

  async setVariable(variablesReference: number, name: string, value: string): Promise<void> {}

  async disconnect(terminateDebuggee: boolean): Promise<void> {
    this.terminate();
  }

  terminate(): void {
    this.state = 'terminated';
    this.emit({ type: 'terminated', body: {} });
    this.handlers.clear();
  }

  onEvent(handler: (event: DebugEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(event: DebugEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Debug event handler error:', error);
      }
    }
  }
}

export class DebugManager {
  private adapter = new DebugAdapter();
  private activeSession: DebugSession | null = null;

  getAdapter(): DebugAdapter {
    return this.adapter;
  }

  async startDebugging(config: DebugSessionConfig): Promise<DebugSession> {
    if (this.activeSession) {
      await this.stopDebugging();
    }

    const session = this.adapter.createSession(config);
    this.activeSession = session;

    if (config.request === 'launch') {
      await session.launch();
    } else {
      await session.attach();
    }

    return session;
  }

  async stopDebugging(): Promise<void> {
    if (this.activeSession) {
      this.activeSession.terminate();
      this.adapter.removeSession(this.activeSession.id);
      this.activeSession = null;
    }
  }

  getActiveSession(): DebugSession | null {
    return this.activeSession;
  }

  getSession(id: string): DebugSession | undefined {
    return this.adapter.getSession(id);
  }
}

export function createDebugManager(): DebugManager {
  return new DebugManager();
}

export const debugConfigurations: Record<string, DebugSessionConfig[]> = {
  python: [
    {
      type: 'python',
      request: 'launch',
      name: 'Python: Current File',
      program: '${file}',
      console: 'integratedTerminal',
      stopOnEntry: false,
    },
    {
      type: 'python',
      request: 'launch',
      name: 'Python: Module',
      module: true,
      console: 'integratedTerminal',
    },
  ],
  javascript: [
    {
      type: 'node',
      request: 'launch',
      name: 'Node: Current File',
      program: '${file}',
      console: 'integratedTerminal',
      stopOnEntry: false,
    },
    {
      type: 'node',
      request: 'launch',
      name: 'Node: NPM Start',
      runtimeExecutable: 'npm',
      runtimeArgs: ['start'],
      console: 'integratedTerminal',
    },
  ],
  typescript: [
    {
      type: 'node',
      request: 'launch',
      name: 'TypeScript: Current File',
      program: '${file}',
      outFiles: ['${workspaceFolder}/dist/**/*.js'],
      console: 'integratedTerminal',
      stopOnEntry: false,
      sourceMaps: true,
    },
  ],
};