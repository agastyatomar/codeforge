import { PluginManifest, PluginManifestSchema, PluginInstance, PluginContext, CoreAPI, PluginStorage } from '../types';
import { createEventBus, CoreEvents } from '../events';
import { nanoid } from 'nanoid';

export class PluginRegistry {
  private plugins = new Map<string, PluginInstance>();
  private loadOrder: string[] = [];
  private coreAPI: CoreAPI;
  private eventBus = createEventBus();
  private pluginLoaders = new Map<string, () => Promise<unknown>>();
  private configStore = new Map<string, Record<string, unknown>>();

  constructor(coreAPI: CoreAPI) {
    this.coreAPI = coreAPI;
  }

  async registerPlugin(manifest: PluginManifest, loader: () => Promise<unknown>): Promise<void> {
    const result = PluginManifestSchema.safeParse(manifest);
    if (!result.success) {
      throw new Error(`Invalid plugin manifest: ${result.error.message}`);
    }

    const validatedManifest = result.data;

    if (this.plugins.has(validatedManifest.name)) {
      throw new Error(`Plugin ${validatedManifest.name} already registered`);
    }

    this.pluginLoaders.set(validatedManifest.name, loader);

    await this.loadPlugin(validatedManifest);
  }

  async loadPlugin(manifest: PluginManifest): Promise<PluginInstance> {
    const pluginId = manifest.name;
    const loader = this.pluginLoaders.get(pluginId);

    if (!loader) {
      throw new Error(`No loader registered for plugin ${pluginId}`);
    }

    const instance: PluginInstance = {
      id: pluginId,
      manifest,
      context: null as unknown as PluginContext,
      module: null,
      status: 'loading',
    };

    this.plugins.set(pluginId, instance);

    try {
      const storage = this.createPluginStorage(pluginId);
      const config = this.configStore.get(pluginId) || manifest.codeforge.defaultConfig || {};

      const context: PluginContext = {
        pluginId,
        manifest,
        config,
        storage,
        events: this.eventBus,
        logger: this.createLogger(pluginId),
        api: this.coreAPI,
      };

      instance.context = context;

      const module = await loader();
      instance.module = module;
      instance.status = 'loaded';

      this.loadOrder.push(pluginId);

      if (module && typeof module === 'object' && 'initialize' in module) {
        await (module as { initialize: (ctx: PluginContext) => Promise<void> }).initialize(context);
      }

      this.eventBus.emit('plugin:loaded', { pluginId, manifest });
      return instance;
    } catch (error) {
      instance.status = 'error';
      instance.error = error as Error;
      this.eventBus.emit('plugin:error', { pluginId, error: error as Error });
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) return;

    if (instance.module && typeof instance.module === 'object' && 'shutdown' in instance.module) {
      try {
        await (instance.module as { shutdown: () => Promise<void> }).shutdown();
      } catch (error) {
        instance.logger.error('Error during plugin shutdown', { error });
      }
    }

    instance.status = 'unloaded';
    this.plugins.delete(pluginId);
    this.loadOrder = this.loadOrder.filter((id) => id !== pluginId);
    this.pluginLoaders.delete(pluginId);

    this.eventBus.emit('plugin:unloaded', { pluginId });
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) throw new Error(`Plugin ${pluginId} not found`);

    const manifest = instance.manifest;
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(manifest);
  }

  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  getPluginsByType(type: PluginManifest['codeforge']['type']): PluginInstance[] {
    return Array.from(this.plugins.values()).filter(
      (p) => p.manifest.codeforge.type === type && p.status === 'loaded'
    );
  }

  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getLoadedPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values()).filter((p) => p.status === 'loaded');
  }

  getLoadOrder(): string[] {
    return [...this.loadOrder];
  }

  async setConfig(pluginId: string, config: Record<string, unknown>): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) throw new Error(`Plugin ${pluginId} not found`);

    this.configStore.set(pluginId, config);
    instance.context.config = config;

    if (instance.module && typeof instance.module === 'object' && 'onConfigChange' in instance.module) {
      await (instance.module as { onConfigChange: (config: Record<string, unknown>) => Promise<void> }).onConfigChange(config);
    }
  }

  getConfig(pluginId: string): Record<string, unknown> | undefined {
    return this.configStore.get(pluginId);
  }

  onPluginLoaded(callback: (plugin: PluginInstance) => void): () => void {
    return this.eventBus.on('plugin:loaded', ({ pluginId }) => {
      const plugin = this.plugins.get(pluginId);
      if (plugin) callback(plugin);
    });
  }

  onPluginUnloaded(callback: (pluginId: string) => void): () => void {
    return this.eventBus.on('plugin:unloaded', callback);
  }

  private createPluginStorage(pluginId: string): PluginStorage {
    const prefix = `plugin:${pluginId}:`;
    const dbName = 'codeforge-plugins';

    return {
      async get<T>(key: string): Promise<T | undefined> {
        const db = await this.openDB();
        return db.get(`${prefix}${key}`);
      },
      async set<T>(key: string, value: T): Promise<void> {
        const db = await this.openDB();
        await db.put(`${prefix}${key}`, value);
      },
      async delete(key: string): Promise<void> {
        const db = await this.openDB();
        await db.delete(`${prefix}${key}`);
      },
      async clear(): Promise<void> {
        const db = await this.openDB();
        const keys = await db.getAllKeys();
        const pluginKeys = keys.filter((k) => typeof k === 'string' && k.startsWith(prefix));
        await Promise.all(pluginKeys.map((k) => db.delete(k)));
      },
      async keys(): Promise<string[]> {
        const db = await this.openDB();
        const allKeys = await db.getAllKeys();
        return allKeys
          .filter((k) => typeof k === 'string' && k.startsWith(prefix))
          .map((k) => k.slice(prefix.length));
      },
      openDB: async () => {
        const { openDB } = await import('idb');
        return openDB(dbName, 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('plugin-storage')) {
              db.createObjectStore('plugin-storage');
            }
          },
        });
      },
    };
  }

  private createLogger(pluginId: string) {
    const prefix = `[${pluginId}]`;
    return {
      debug: (message: string, meta?: Record<string, unknown>) =>
        console.debug(`${prefix} DEBUG:`, message, meta),
      info: (message: string, meta?: Record<string, unknown>) =>
        console.info(`${prefix} INFO:`, message, meta),
      warn: (message: string, meta?: Record<string, unknown>) =>
        console.warn(`${prefix} WARN:`, message, meta),
      error: (message: string, meta?: Record<string, unknown>) =>
        console.error(`${prefix} ERROR:`, message, meta),
    };
  }
}

export async function createPluginRegistry(coreAPI: CoreAPI): Promise<PluginRegistry> {
  return new PluginRegistry(coreAPI);
}