import Dexie, { Table } from 'dexie';
import type { Repository, Query, Transaction } from '@codeforge/core/types';

export interface CodeForgeDB extends Dexie {
  users: Table<UserRecord, string>;
  courses: Table<CourseRecord, string>;
  lessons: Table<LessonRecord, string>;
  exercises: Table<ExerciseRecord, string>;
  userProgress: Table<UserProgressRecord, string>;
  achievements: Table<AchievementRecord, string>;
  userAchievements: Table<UserAchievementRecord, [string, string]>;
  builds: Table<BuildRecord, string>;
  buildFiles: Table<BuildFileRecord, string>;
  worldState: Table<WorldStateRecord, string>;
  communityPosts: Table<CommunityPostRecord, string>;
  communityReplies: Table<CommunityReplyRecord, string>;
  settings: Table<SettingRecord, string>;
  syncQueue: Table<SyncQueueRecord, string>;
  pluginStorage: Table<PluginStorageRecord, string>;
}

export interface UserRecord {
  id: string;
  username: string;
  email?: string;
  avatarConfig: string;
  settings: string;
  stats: string;
  createdAt: number;
  updatedAt: number;
}

export interface CourseRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  version: string;
  author: string;
  tags: string;
  language: string;
  difficulty: string;
  estimatedHours: number;
  lessons: string;
  prerequisites: string;
  learningObjectives: string;
  createdAt: number;
  updatedAt: number;
}

export interface LessonRecord {
  id: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  content: string;
  contentType: string;
  exercises: string;
  estimatedMinutes: number;
  xpReward: number;
}

export interface ExerciseRecord {
  id: string;
  lessonId: string;
  order: number;
  type: string;
  title: string;
  description: string;
  instructions: string;
  starterCode: string;
  solution: string;
  tests: string;
  hints: string;
  xpReward: number;
  difficulty: number;
  timeLimit: number;
  memoryLimit: number;
}

export interface UserProgressRecord {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  exerciseId: string;
  status: string;
  score: number;
  attempts: number;
  timeSpent: number;
  completedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface AchievementRecord {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xpReward: number;
  criteria: string;
  createdAt: number;
}

export interface UserAchievementRecord {
  userId: string;
  achievementId: string;
  unlockedAt: number;
}

export interface BuildRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  slug: string;
  files: string;
  assets: string;
  isPublic: number;
  publishedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface BuildFileRecord {
  id: string;
  buildId: string;
  path: string;
  content: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorldStateRecord {
  id: string;
  userId: string;
  worldId: string;
  positionX: number;
  positionY: number;
  avatarState: string;
  inventory: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityPostRecord {
  id: string;
  userId: string;
  channelId: string;
  title: string;
  content: string;
  images: string;
  reactions: string;
  replyCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityReplyRecord {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: string;
  updatedAt: number;
}

export interface SyncQueueRecord {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: string;
  timestamp: number;
  retries: number;
  peerId?: string;
}

export interface PluginStorageRecord {
  key: string;
  value: string;
  pluginId: string;
  updatedAt: number;
}

export const db = new Dexie('CodeForge') as CodeForgeDB;

db.version(1).stores({
  users: 'id, username, email, createdAt',
  courses: 'id, slug, language, difficulty, createdAt',
  lessons: 'id, courseId, order',
  exercises: 'id, lessonId, order, type',
  userProgress: 'id, userId, courseId, lessonId, exerciseId, status, completedAt',
  achievements: 'id, category, rarity',
  userAchievements: '[userId+achievementId], userId, achievementId, unlockedAt',
  builds: 'id, userId, slug, isPublic, publishedAt, createdAt',
  buildFiles: 'id, buildId, path, language',
  worldState: 'id, userId, worldId, updatedAt',
  communityPosts: 'id, userId, channelId, createdAt',
  communityReplies: 'id, postId, userId, createdAt',
  settings: 'key',
  syncQueue: 'id, entityType, entityId, operation, timestamp, peerId',
  pluginStorage: 'key, pluginId, updatedAt',
});

export function createDexieRepository<T extends { id: string }>(
  table: Table<T, string>
): Repository<T> {
  return {
    async findById(id: string): Promise<T | undefined> {
      return table.get(id);
    },

    async findAll(): Promise<T[]> {
      return table.toArray();
    },

    async find(query: Query<T>): Promise<T[]> {
      let collection = table.toCollection();

      if (query.where) {
        for (const [key, value] of Object.entries(query.where)) {
          collection = collection.filter((item) => (item as Record<string, unknown>)[key] === value);
        }
      }

      if (query.orderBy) {
        const orderBy = query.orderBy.map((o) => o.field as string).join(',');
        const direction = query.orderBy[0]?.direction === 'desc' ? 'desc' : 'asc';
        collection = collection.sortBy(orderBy) as any;
        if (direction === 'desc') {
          const arr = await collection;
          return arr.reverse();
        }
      }

      if (query.offset) {
        collection = collection.offset(query.offset);
      }

      if (query.limit) {
        collection = collection.limit(query.limit);
      }

      return collection.toArray();
    },

    async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      const now = Date.now();
      const id = crypto.randomUUID();
      const fullEntity = { ...entity, id, createdAt: now, updatedAt: now } as T;
      await table.add(fullEntity);
      return fullEntity;
    },

    async update(id: string, changes: Partial<T>): Promise<T> {
      const existing = await table.get(id);
      if (!existing) throw new Error(`Entity not found: ${id}`);

      const updated = { ...existing, ...changes, updatedAt: Date.now() } as T;
      await table.put(updated);
      return updated;
    },

    async delete(id: string): Promise<void> {
      await table.delete(id);
    },

    async count(query: Query<T>): Promise<number> {
      let collection = table.toCollection();

      if (query.where) {
        for (const [key, value] of Object.entries(query.where)) {
          collection = collection.filter((item) => (item as Record<string, unknown>)[key] === value);
        }
      }

      return collection.count();
    },
  };
}

export function createDexieTransaction(): Transaction {
  let tx: Dexie.Transaction | null = null;

  return {
    repository<T>(name: string): Repository<T> {
      const table = (db as any)[name] as Table<T, string>;
      if (!table) throw new Error(`Table ${name} not found`);
      return createDexieRepository(table);
    },
    async commit(): Promise<void> {
      if (tx) await tx.commit();
    },
    async rollback(): Promise<void> {
      if (tx) await tx.abort();
    },
  };
}

export async function initializeDexie(): Promise<void> {
  await db.open();
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const result: Record<string, unknown[]> = {};
  for (const table of db.tables) {
    result[table.name] = await table.toArray();
  }
  return result;
}

export async function importAllData(data: Record<string, unknown[]>): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      if (data[table.name]) {
        await table.bulkPut(data[table.name]);
      }
    }
  });
}

export { Dexie };
export default db;