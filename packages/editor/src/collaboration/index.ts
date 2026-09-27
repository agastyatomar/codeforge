import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as monaco from 'monaco-editor';

export interface CollaborationConfig {
  roomName: string;
  userId: string;
  userName: string;
  userColor: string;
  signalingServers?: string[];
  enableWebRTC?: boolean;
  enablePersistence?: boolean;
  persistenceName?: string;
}

export interface RemoteUser {
  userId: string;
  userName: string;
  color: string;
  cursorPosition?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  lastActive: number;
}

export class CollaborationManager {
  private doc: Y.Doc;
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private bindings = new Map<string, MonacoBinding>();
  private config: CollaborationConfig;
  private remoteUsers = new Map<string, RemoteUser>();
  private awareness: any;
  private handlers = new Set<(event: CollaborationEvent) => void>();

  constructor(config: CollaborationConfig) {
    this.config = {
      signalingServers: ['wss://signaling.yjs.dev', 'wss://signaling.yjs.dev:443'],
      enableWebRTC: true,
      enablePersistence: true,
      persistenceName: 'codeforge-collab',
      ...config,
    };

    this.doc = new Y.Doc();
    this.awareness = this.doc.awareness;
    this.awareness.setLocalStateField('user', {
      id: this.config.userId,
      name: this.config.userName,
      color: this.config.userColor,
    });
  }

  async initialize(): Promise<void> {
    if (this.config.enablePersistence) {
      this.persistence = new IndexeddbPersistence(this.config.persistenceName!, this.doc);
      await this.persistence.whenSynced;
    }

    if (this.config.enableWebRTC) {
      this.provider = new WebrtcProvider(this.config.roomName, this.doc, {
        signaling: this.config.signalingServers,
        maxConns: 20,
      });

      this.provider.on('status', (event: { connected: boolean }) => {
        this.emit({ type: 'connection-change', connected: event.connected });
      });

      this.provider.on('peer', (event: { peerId: string; connected: boolean }) => {
        this.emit({ type: 'peer-change', peerId: event.peerId, connected: event.connected });
      });

      this.provider.on('sync', (isSynced: boolean) => {
        this.emit({ type: 'sync', synced: isSynced });
      });
    }

    this.awareness.on('change', () => {
      this.updateRemoteUsers();
    });

    this.updateRemoteUsers();
  }

  bindEditor(editor: monaco.editor.IStandaloneCodeEditor, model: monaco.editor.ITextModel): MonacoBinding {
    const binding = new MonacoBinding(model, this.doc.getText(model.uri.path), this.awareness);
    this.bindings.set(model.uri.path, binding);
    return binding;
  }

  unbindEditor(model: monaco.editor.ITextModel): void {
    const binding = this.bindings.get(model.uri.path);
    if (binding) {
      binding.destroy();
      this.bindings.delete(model.uri.path);
    }
  }

  getRemoteUsers(): RemoteUser[] {
    return Array.from(this.remoteUsers.values());
  }

  getDocument(): Y.Doc {
    return this.doc;
  }

  getAwareness(): any {
    return this.awareness;
  }

  updateUserState(state: Partial<RemoteUser>): void {
    this.awareness.setLocalStateField('user', { ...this.awareness.getLocalState()?.user, ...state });
  }

  getState(): { connected: boolean; peerCount: number; userCount: number } {
    return {
      connected: this.provider?.connected || false,
      peerCount: this.provider?.peers.size || 0,
      userCount: this.remoteUsers.size,
    };
  }

  onEvent(handler: (event: CollaborationEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.persistence) {
      await this.persistence.destroy();
      this.persistence = null;
    }
    for (const binding of this.bindings.values()) {
      binding.destroy();
    }
    this.bindings.clear();
    this.doc.destroy();
  }

  private updateRemoteUsers(): void {
    const states = this.awareness.getStates();
    const newUsers = new Map<string, RemoteUser>();

    for (const [clientId, state] of states) {
      if (clientId === this.awareness.clientID) continue;

      const user = state?.user;
      if (user) {
        newUsers.set(user.id, {
          userId: user.id,
          userName: user.name,
          color: user.color,
          lastActive: Date.now(),
        });
      }
    }

    this.remoteUsers = newUsers;
    this.emit({ type: 'users-change', users: Array.from(this.remoteUsers.values()) });
  }

  private emit(event: CollaborationEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Collaboration event handler error:', error);
      }
    }
  }
}

export interface CollaborationEvent {
  type: 'connection-change' | 'peer-change' | 'sync' | 'users-change' | 'cursor-change' | 'selection-change';
  connected?: boolean;
  peerId?: string;
  synced?: boolean;
  users?: RemoteUser[];
  userId?: string;
  cursor?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
}

export function createCollaborationManager(config: CollaborationConfig): CollaborationManager {
  return new CollaborationManager(config);
}

export function generateUserColor(userId: string): string {
  const colors = [
    '#ff7b72', '#3fb950', '#d29922', '#58a6ff', '#bc8cff', '#39c5cf',
    '#ff9779', '#56d364', '#e3b341', '#79c0ff', '#d2a8ff', '#56d4dd',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function generateUserName(userId: string): string {
  const adjectives = ['Swift', 'Clever', 'Bright', 'Keen', 'Sharp', 'Quick', 'Agile', 'Nimble'];
  const nouns = ['Coder', 'Builder', 'Maker', 'Hacker', 'Dev', 'Engineer', 'Architect', 'Creator'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `${adjectives[Math.abs(hash) % adjectives.length]} ${nouns[Math.abs(hash >> 8) % nouns.length]}`;
}