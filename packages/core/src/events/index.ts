import { Emitter } from 'mitt';
import type { EventBus } from '../types';

export interface CoreEvents {
  'plugin:loaded': { pluginId: string; manifest: unknown };
  'plugin:unloaded': { pluginId: string };
  'plugin:error': { pluginId: string; error: Error };
  'course:started': { courseId: string; userId: string };
  'course:completed': { courseId: string; userId: string; xpEarned: number };
  'lesson:started': { lessonId: string; courseId: string; userId: string };
  'lesson:completed': { lessonId: string; courseId: string; userId: string; xpEarned: number };
  'exercise:started': { exerciseId: string; lessonId: string; userId: string };
  'exercise:completed': { exerciseId: string; lessonId: string; userId: string; score: number; xpEarned: number };
  'exercise:failed': { exerciseId: string; lessonId: string; userId: string; error: string };
  'xp:awarded': { amount: number; source: string; userId: string };
  'achievement:unlocked': { achievementId: string; userId: string };
  'streak:updated': { currentStreak: number; longestStreak: number; userId: string };
  'level:up': { newLevel: number; userId: string };
  'avatar:updated': { avatarId: string; userId: string };
  'world:entered': { worldId: string; userId: string };
  'world:exited': { worldId: string; userId: string };
  'build:created': { buildId: string; userId: string };
  'build:published': { buildId: string; userId: string; url: string };
  'build:remixed': { originalBuildId: string; newBuildId: string; userId: string };
  'code:executed': { language: string; success: boolean; executionTime: number; userId: string };
  'ai:requested': { model: string; promptLength: number; userId: string };
  'ai:completed': { model: string; responseLength: number; tokensUsed: number; userId: string };
  'settings:changed': { settingId: string; oldValue: unknown; newValue: unknown };
  'theme:changed': { themeId: string };
  'locale:changed': { locale: string };
  'sync:started': { peerId: string };
  'sync:completed': { peerId: string; syncedItems: number };
  'sync:conflict': { peerId: string; conflicts: unknown[] };
  'offline:detected': void;
  'online:detected': void;
  'error:uncaught': { error: Error; context: string };
  'performance:metric': { name: string; value: number; unit: string };
}

export function createEventBus(): EventBus {
  const emitter = new Emitter<CoreEvents>();

  return {
    on: <K extends keyof CoreEvents>(event: K, handler: (data: CoreEvents[K]) => void) => {
      emitter.on(event, handler);
      return () => emitter.off(event, handler);
    },
    emit: <K extends keyof CoreEvents>(event: K, data: CoreEvents[K]) => {
      emitter.emit(event, data);
    },
    off: <K extends keyof CoreEvents>(event: K, handler: (data: CoreEvents[K]) => void) => {
      emitter.off(event, handler);
    },
  };
}

export type { EventBus } from '../types';