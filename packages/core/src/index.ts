export * from './types';
export * from './events';
export * from './plugins/registry';
export * from './utils';

import { createPluginRegistry } from './plugins/registry';
import { createEventBus, type CoreEvents } from './events';
import type { CoreAPI, PluginManifest } from './types';

export interface CoreInitOptions {
  plugins?: Array<{ manifest: PluginManifest; loader: () => Promise<unknown> }>;
}

export async function createCore(options: CoreInitOptions = {}) {
  const eventBus = createEventBus();

  const coreAPI: CoreAPI = {
    plugins: {
      getPlugin: () => undefined,
      getPluginsByType: () => [],
      onPluginLoaded: () => () => {},
      onPluginUnloaded: () => () => {},
    },
    data: {
      repository: () => ({
        findById: async () => undefined,
        findAll: async () => [],
        find: async () => [],
        create: async (entity) => entity as any,
        update: async (id, changes) => changes as any,
        delete: async () => {},
        count: async () => 0,
      }),
      transaction: async (fn) => fn({} as any),
      migrate: async () => {},
    },
    courses: {
      getCourse: async () => undefined,
      getCourses: async () => [],
      getExercises: async () => [],
      onProgressChange: () => () => {},
    },
    editor: {
      openFile: async () => {},
      getOpenFiles: () => [],
      onFileChange: () => () => {},
      executeCode: async () => ({ success: false, output: '', executionTime: 0, memoryUsed: 0 }),
    },
    gamification: {
      awardXP: async () => {},
      unlockAchievement: async () => {},
      getUserStats: async () => ({
        totalXP: 0,
        level: 1,
        currentLevelXP: 0,
        nextLevelXP: 100,
        streakDays: 0,
        longestStreak: 0,
        coursesCompleted: 0,
        exercisesCompleted: 0,
        achievementsUnlocked: 0,
        totalTimeSpent: 0,
        lastActiveDate: new Date(),
      }),
      onAchievementUnlocked: () => () => {},
    },
    ui: {
      notify: () => {},
      openModal: async () => undefined,
      registerCommand: () => () => {},
      registerSetting: () => () => {},
    },
  };

  const registry = await createPluginRegistry(coreAPI);

  coreAPI.plugins = {
    getPlugin: (id) => registry.getPlugin(id),
    getPluginsByType: (type) => registry.getPluginsByType(type),
    onPluginLoaded: (cb) => registry.onPluginLoaded(cb),
    onPluginUnloaded: (cb) => registry.onPluginUnloaded(cb),
  };

  for (const { manifest, loader } of options.plugins || []) {
    await registry.registerPlugin(manifest, loader);
  }

  return {
    registry,
    eventBus,
    api: coreAPI,
    shutdown: async () => {
      for (const pluginId of registry.getLoadOrder().reverse()) {
        await registry.unloadPlugin(pluginId);
      }
    },
  };
}

export type { CoreEvents } from './events';