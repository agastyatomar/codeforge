import { createDexieRepository, db } from '@codeforge/data/dexie';
import { syncManager, createSyncRepository } from '@codeforge/data/sync';
import type { UserStats } from '@codeforge/core/types';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  score: number;
  level: number;
  previousRank?: number;
  change?: number;
}

export interface LeaderboardConfig {
  type: 'global' | 'friends' | 'course' | 'weekly' | 'monthly' | 'custom';
  scope?: string;
  limit?: number;
  sortBy?: 'xp' | 'level' | 'streak' | 'courses' | 'exercises';
  timeframe?: 'all' | 'week' | 'month' | 'year';
}

export class LeaderboardEngine {
  private statsRepo = createDexieRepository(db.users);
  private syncEngine = syncManager.getEngine('leaderboard') || syncManager.createEngine('leaderboard');
  private localCache = new Map<string, LeaderboardEntry[]>();
  private config: LeaderboardConfig;

  constructor(config: LeaderboardConfig = { type: 'global' }) {
    this.config = { limit: 100, sortBy: 'xp', timeframe: 'all', ...config };
  }

  async initialize(): Promise<void> {
    await this.syncEngine.initialize();
  }

  async getLeaderboard(userId?: string): Promise<LeaderboardEntry[]> {
    const cacheKey = this.getCacheKey();
    if (this.localCache.has(cacheKey)) {
      return this.localCache.get(cacheKey)!;
    }

    const users = await this.getUsersForLeaderboard();
    const entries = this.buildLeaderboard(users, userId);
    this.localCache.set(cacheKey, entries);
    return entries;
  }

  private async getUsersForLeaderboard(): Promise<Array<{ id: string; username: string; stats: UserStats }>> {
    const allUsers = await this.statsRepo.findAll();
    return allUsers
      .map((u) => ({
        id: u.id,
        username: u.username,
        stats: JSON.parse(u.stats || '{}') as UserStats,
      }))
      .filter((u) => u.stats && u.stats.totalXP > 0);
  }

  private buildLeaderboard(users: Array<{ id: string; username: string; stats: UserStats }>, currentUserId?: string): LeaderboardEntry[] {
    const sorted = [...users].sort((a, b) => {
      switch (this.config.sortBy) {
        case 'xp':
          return b.stats.totalXP - a.stats.totalXP;
        case 'level':
          return b.stats.level - a.stats.level;
        case 'streak':
          return b.stats.streakDays - a.stats.streakDays;
        case 'courses':
          return b.stats.coursesCompleted - a.stats.coursesCompleted;
        case 'exercises':
          return b.stats.exercisesCompleted - a.stats.exercisesCompleted;
        default:
          return b.stats.totalXP - a.stats.totalXP;
      }
    });

    const limited = sorted.slice(0, this.config.limit);

    return limited.map((user, index) => ({
      userId: user.id,
      username: user.username,
      rank: index + 1,
      score: this.getScore(user.stats),
      level: user.stats.level,
    }));
  }

  private getScore(stats: UserStats): number {
    switch (this.config.sortBy) {
      case 'xp':
        return stats.totalXP;
      case 'level':
        return stats.level;
      case 'streak':
        return stats.streakDays;
      case 'courses':
        return stats.coursesCompleted;
      case 'exercises':
        return stats.exercisesCompleted;
      default:
        return stats.totalXP;
    }
  }

  async getUserRank(userId: string): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard(userId);
    return leaderboard.find((entry) => entry.userId === userId) || null;
  }

  async getUserRankInScope(userId: string, scope: string): Promise<LeaderboardEntry | null> {
    const config = { ...this.config, type: 'custom' as const, scope };
    const engine = new LeaderboardEngine(config);
    return engine.getUserRank(userId);
  }

  async getSurroundingEntries(userId: string, count = 5): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard();
    const userIndex = leaderboard.findIndex((e) => e.userId === userId);
    if (userIndex === -1) return [];

    const start = Math.max(0, userIndex - count);
    const end = Math.min(leaderboard.length, userIndex + count + 1);
    return leaderboard.slice(start, end);
  }

  async getTopEntries(count: number): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard();
    return leaderboard.slice(0, count);
  }

  async getPercentile(userId: string): Promise<number> {
    const leaderboard = await this.getLeaderboard();
    const userIndex = leaderboard.findIndex((e) => e.userId === userId);
    if (userIndex === -1) return 0;

    const percentile = ((leaderboard.length - userIndex) / leaderboard.length) * 100;
    return Math.round(percentile);
  }

  private getCacheKey(): string {
    return `${this.config.type}:${this.config.scope || ''}:${this.config.sortBy}:${this.config.timeframe}:${this.config.limit}`;
  }

  invalidateCache(): void {
    this.localCache.clear();
  }

  async syncWithPeers(): Promise<void> {
    if (this.syncEngine.getState().connected) {
      await this.syncEngine.getDocument();
    }
  }

  getConfig(): LeaderboardConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LeaderboardConfig>): void {
    this.config = { ...this.config, ...config };
    this.invalidateCache();
  }
}

export function createLeaderboardEngine(config?: LeaderboardConfig): LeaderboardEngine {
  return new LeaderboardEngine(config);
}

export const LEADERBOARD_TYPES = [
  'global',
  'friends',
  'course',
  'weekly',
  'monthly',
  'custom',
] as const;

export const LEADERBOARD_SORT_OPTIONS = [
  { value: 'xp', label: 'Total XP' },
  { value: 'level', label: 'Level' },
  { value: 'streak', label: 'Current Streak' },
  { value: 'courses', label: 'Courses Completed' },
  { value: 'exercises', label: 'Exercises Completed' },
] as const;

export const LEADERBOARD_TIMEFRAMES = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
] as const;