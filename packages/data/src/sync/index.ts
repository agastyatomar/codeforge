import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';

const { Doc: YDoc, Map: YMap, Array: YArray, Text: YText } = Y;

export interface SyncConfig {
  roomName: string;
  signalingServers?: string[];
  indexedDBName?: string;
  enableWebRTC?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncState {
  connected: boolean;
  peers: string[];
  pendingChanges: number;
  lastSynced: number;
}

export interface SyncEvent {
  type: 'connect' | 'disconnect' | 'peer-joined' | 'peer-left' | 'sync' | 'conflict' | 'error';
  payload: unknown;
}

type SyncEventHandler = (event: SyncEvent) => void;

export class SyncEngine {
  private doc: Y.Doc;
  private persistence: IndexeddbPersistence;
  private provider: WebrtcProvider | null = null;
  private config: SyncConfig;
  private state: SyncState = {
    connected: false,
    peers: [],
    pendingChanges: 0,
    lastSynced: 0,
  };
  private handlers = new Set<SyncEventHandler>();
  private maps = new Map<string, Y.Map<unknown>>();
  private arrays = new Map<string, Y.Array<unknown>>();
  private texts = new Map<string, Y.Text>();

  constructor(config: SyncConfig) {
    this.config = {
      signalingServers: ['wss://signaling.yjs.dev', 'wss://signaling.yjs.dev:443'],
      indexedDBName: 'codeforge-sync',
      enableWebRTC: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.doc = new Y.Doc();
    this.persistence = new IndexeddbPersistence(this.config.indexedDBName!, this.doc);
  }

  async initialize(): Promise<void> {
    await this.persistence.whenSynced;

    if (this.config.enableWebRTC) {
      this.provider = new WebrtcProvider(this.config.roomName, this.doc, {
        signaling: this.config.signalingServers,
        maxConns: 20,
      });

      this.provider.on('status', (event: { connected: boolean }) => {
        this.setState({ connected: event.connected });
        this.emit({ type: event.connected ? 'connect' : 'disconnect', payload: null });
      });

      this.provider.on('peer', (event: { peerId: string; connected: boolean }) => {
        if (event.connected) {
          this.state.peers.push(event.peerId);
          this.emit({ type: 'peer-joined', payload: event.peerId });
        } else {
          this.state.peers = this.state.peers.filter((p) => p !== event.peerId);
          this.emit({ type: 'peer-left', payload: event.peerId });
        }
        this.setState({ peers: [...this.state.peers] });
      });

      this.provider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          this.setState({ lastSynced: Date.now(), pendingChanges: 0 });
          this.emit({ type: 'sync', payload: null });
        }
      });
    }

    this.doc.on('update', () => {
      this.setState({ pendingChanges: this.state.pendingChanges + 1 });
    });
  }

  getMap<T>(name: string): Y.Map<T> {
    if (!this.maps.has(name)) {
      this.maps.set(name, this.doc.getMap<T>(name));
    }
    return this.maps.get(name)! as Y.Map<T>;
  }

  getArray<T>(name: string): Y.Array<T> {
    if (!this.arrays.has(name)) {
      this.arrays.set(name, this.doc.getArray<T>(name));
    }
    return this.arrays.get(name)! as Y.Array<T>;
  }

  getText(name: string): Y.Text {
    if (!this.texts.has(name)) {
      this.texts.set(name, this.doc.getText(name));
    }
    return this.texts.get(name)!;
  }

  getState(): SyncState {
    return { ...this.state };
  }

  onEvent(handler: SyncEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private setState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
  }

  private emit(event: SyncEvent): void {
    for (const handler of this.handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error('Sync event handler error:', error);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    await this.persistence.destroy();
    this.doc.destroy();
    this.setState({ connected: false, peers: [] });
  }

  getDocument(): YDoc {
    return this.doc;
  }

  encodeStateAsUpdate(): Uint8Array {
    return YDoc.encodeStateAsUpdate(this.doc);
  }

  applyUpdate(update: Uint8Array): void {
    YDoc.applyUpdate(this.doc, update);
  }
}

export class CRDTSyncManager {
  private engines = new Map<string, SyncEngine>();

  createEngine(roomName: string, config?: Partial<SyncConfig>): SyncEngine {
    const engine = new SyncEngine({ roomName, ...config });
    this.engines.set(roomName, engine);
    return engine;
  }

  getEngine(roomName: string): SyncEngine | undefined {
    return this.engines.get(roomName);
  }

  async initializeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.engines.values()).map((e) => e.initialize())
    );
  }

  async disconnectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.engines.values()).map((e) => e.disconnect())
    );
    this.engines.clear();
  }

  getAllStates(): Record<string, SyncState> {
    const states: Record<string, SyncState> = {};
    for (const [name, engine] of this.engines) {
      states[name] = engine.getState();
    }
    return states;
  }
}

export const syncManager = new CRDTSyncManager();

export function createSyncRepository<T extends { id: string }>(
  engine: SyncEngine,
  collectionName: string,
  toLocal: (data: unknown) => T,
  toRemote: (entity: T) => unknown
) {
  const yMap = engine.getMap<unknown>(collectionName);

  return {
    async findById(id: string): Promise<T | undefined> {
      const data = yMap.get(id);
      return data ? toLocal(data) : undefined;
    },

    async findAll(): Promise<T[]> {
      const result: T[] = [];
      yMap.forEach((value) => result.push(toLocal(value)));
      return result;
    },

    async find(query: { where?: Partial<T> }): Promise<T[]> {
      const all = await this.findAll();
      if (!query.where) return all;

      return all.filter((item) =>
        Object.entries(query.where!).every(([key, value]) => item[key as keyof T] === value)
      );
    },

    async create(entity: Omit<T, 'id'>): Promise<T> {
      const id = crypto.randomUUID();
      const fullEntity = { ...entity, id } as T;
      yMap.set(id, toRemote(fullEntity));
      return fullEntity;
    },

    async update(id: string, changes: Partial<T>): Promise<T> {
      const existing = yMap.get(id);
      if (!existing) throw new Error(`Entity not found: ${id}`);

      const updated = { ...toLocal(existing), ...changes } as T;
      yMap.set(id, toRemote(updated));
      return updated;
    },

    async delete(id: string): Promise<void> {
      yMap.delete(id);
    },

    async count(query: { where?: Partial<T> }): Promise<number> {
      const all = await this.find(query);
      return all.length;
    },

    onChange(callback: (changes: Map<string, { action: 'add' | 'update' | 'delete'; oldValue?: unknown; newValue?: unknown }>) => void): () => void {
      const observer = (event: Y.YMapEvent<unknown>) => {
        const changes = new Map();
        event.changes.keys.forEach((change, key) => {
          changes.set(key, {
            action: change.action,
            oldValue: change.oldValue,
            newValue: yMap.get(key),
          });
        });
        callback(changes);
      };

      yMap.observe(observer);
      return () => yMap.unobserve(observer);
    },
  };
}